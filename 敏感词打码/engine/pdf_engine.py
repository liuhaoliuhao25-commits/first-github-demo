"""PDF打码引擎 — PyMuPDF"""
import os, re
import fitz
import cv2
import numpy as np
import tempfile
from typing import List, Optional, Callable

from engine.detector import Detector
from engine.masker import Masker


def merge_bboxes(bboxes: List, iou: float = 0.25) -> List:
    """合并重叠边界框。"""
    if not bboxes:
        return []
    merged, used = [], [False] * len(bboxes)
    for i, b1 in enumerate(bboxes):
        if used[i]:
            continue
        x1, y1, w1, h1 = b1
        for j, b2 in enumerate(bboxes):
            if i == j or used[j]:
                continue
            x2, y2, w2, h2 = b2
            ix = max(0, min(x1 + w1, x2 + w2) - max(x1, x2))
            iy = max(0, min(y1 + h1, y2 + h2) - max(y1, y2))
            inter = ix * iy
            union = w1 * h1 + w2 * h2 - inter
            if union > 0 and inter / union > iou:
                nx = min(x1, x2); ny = min(y1, y2)
                nw = max(x1 + w1, x2 + w2) - nx; nh = max(y1 + h1, y2 + h2) - ny
                x1, y1, w1, h1 = nx, ny, nw, nh
                used[j] = True
        merged.append((x1, y1, w1, h1))
        used[i] = True
    return merged


class PDFEngine:
    """PDF敏感信息打码。"""

    def __init__(self, detector: Detector, mode: str = "black"):
        self.detector = detector
        self.mode = mode

    def process(self, src: str, dst: str) -> bool:
        if not self.detector.active:
            import shutil; shutil.copy2(src, dst); return True
        try:
            doc = fitz.open(src)
            for i in range(len(doc)):
                self._page(doc, i)
            doc.save(dst, garbage=4, deflate=True)
            doc.close()
            return True
        except Exception:
            return False

    def batch(self, files: List[str], out_dir: str,
              cb: Callable = None) -> List[str]:
        os.makedirs(out_dir, exist_ok=True)
        results = []
        for idx, fp in enumerate(files):
            name = os.path.splitext(os.path.basename(fp))[0]
            dst = os.path.join(out_dir, f"{name}_打码.pdf")
            if cb:
                cb(idx + 1, len(files), os.path.basename(fp))
            if self.process(fp, dst):
                results.append(dst)
        return results

    # ── 内部 ────────────────────────────────────

    def _page(self, doc, idx: int):
        page = doc[idx]
        has_text = bool(page.get_text("text").strip())
        has_imgs = bool(page.get_images(full=True))
        title_end = self._title_boundary(page) if idx == 0 else 0
        if self.mode == "black" and has_text:
            self._redact_text(page, title_end)
        elif has_imgs or self.mode != "black":
            self._redact_image(doc, idx, title_end)
        # else: 无文字无图片 → 跳过

    @staticmethod
    def _title_boundary(page) -> int:
        """返回标题区结束位置（文本偏移量）。第1页前2个非空行视为标题。"""
        text = page.get_text("text")
        lines = [l for l in text.split('\n') if l.strip() and not l.strip().startswith('-')]
        # 取前2个非空行（法院名 + 文书类型）
        boundary_lines = lines[:2]
        if not boundary_lines:
            return 0
        last_title = boundary_lines[-1]
        pos = text.find(last_title) + len(last_title)
        # 包含后面的换行符
        while pos < len(text) and text[pos] in '\n\r':
            pos += 1
        return pos

    def _redact_text(self, page, title_boundary: int = 0):
        text = page.get_text("text")
        for h in self.detector.scan_text(text):
            if h["start"] < title_boundary:
                continue  # 跳过标题区
            rects = page.search_for(h["text"])
            if not rects:
                clean = re.sub(r'\s+', '', h["text"])
                if clean != h["text"]:
                    rects = page.search_for(clean)
            for rect in rects:
                page.add_redact_annot(rect, fill=(0, 0, 0))
        page.apply_redactions()

    def _redact_image(self, doc, idx: int, title_boundary: int = 0):
        """打码→替换页面。

        扫描PDF（仅图片无文字）：提取原始图像，在原始分辨率上打码，保留原格式/颜色。
        文字PDF：仅在敏感区域叠加打码图像。
        """
        page = doc[idx]
        rect = page.rect
        imgs = page.get_images(full=True)
        has_text = bool(page.get_text("text").strip())

        if imgs and not has_text:
            # ── 扫描PDF：直接用原始图像打码，不重新渲染 ──
            xref = imgs[0][0]
            base = doc.extract_image(xref)
            raw_bytes = base["image"]
            orig_ext = base["ext"]  # jpeg, png, etc.
            # 解码原始图像
            arr = np.frombuffer(raw_bytes, dtype=np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if img is None:
                # 回退到渲染
                return self._render_and_replace(doc, idx, page, rect, 1.0)
            h_orig, w_orig = img.shape[:2]
            # 用原始尺寸做 bbox（缩放后需要映射回原始坐标）
            scale = w_orig / rect.width
            bboxes = self._bboxes(page, img, None)
            for b in bboxes:
                Masker.apply(img, b, self.mode)
            # 保存为原格式
            tmp = tempfile.NamedTemporaryFile(suffix=f".{orig_ext}", delete=False)
            tmp.close()
            if orig_ext in ("jpeg", "jpg"):
                cv2.imwrite(tmp.name, img, [cv2.IMWRITE_JPEG_QUALITY, 95])
            else:
                cv2.imwrite(tmp.name, img)
            doc.delete_page(idx)
            new_page = doc.new_page(pno=idx, width=rect.width, height=rect.height)
            new_page.insert_image(rect, filename=tmp.name)
            os.unlink(tmp.name)
        elif has_text:
            # ── 文字PDF：仅在敏感区域叠加打码图像，保留原格式/印章/矢量图 ──
            self._overlay_mask(doc, idx, page, rect, title_boundary)
        else:
            # 无文字无图片 → 跳过
            pass

    def _overlay_mask(self, doc, idx, page, rect, title_boundary: int = 0):
        """文字PDF：仅在敏感文字区域覆盖打码图像，保留页面其余内容不变。"""
        scale = 2.0
        mat = fitz.Matrix(scale, scale)
        pix = page.get_pixmap(matrix=mat)
        img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n).copy()
        if img.shape[2] == 4:
            img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)
        elif img.shape[2] == 3:
            img = img[:, :, ::-1].copy()

        text = page.get_text("text")
        hits = self.detector.scan_text(text)
        if not hits:
            return

        for h in hits:
            if h["start"] < title_boundary:
                continue  # 跳过标题区
            rects = page.search_for(h["text"])
            if not rects:
                clean = re.sub(r'\s+', '', h["text"])
                if clean != h["text"]:
                    rects = page.search_for(clean)
            for r in rects:
                pad = 6
                pad_pt_x = pad / (pix.width / page.rect.width)
                pad_pt_y = pad / (pix.height / page.rect.height)
                # 先标记文字为 redact（移除文字层）
                page.add_redact_annot(r, fill=(1, 1, 1))  # 白色填充
                # 页面坐标 → 渲染图像坐标（用于裁剪打码区域）
                sx = pix.width / page.rect.width
                sy = pix.height / page.rect.height
                x = int(r.x0 * sx); y = int(r.y0 * sy)
                w = int((r.x1 - r.x0) * sx); h = int((r.y1 - r.y0) * sy)
                x, y = max(0, x - pad), max(0, y - pad)
                w, h = min(w + 2 * pad, img.shape[1] - x), min(h + 2 * pad, img.shape[0] - y)
                if w <= 0 or h <= 0:
                    continue
                roi = img[y:y+h, x:x+w].copy()
                Masker.apply(roi, (0, 0, w, h), self.mode)
                tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
                tmp.close()
                cv2.imwrite(tmp.name, roi)
                insert_rect = fitz.Rect(r.x0 - pad_pt_x, r.y0 - pad_pt_y,
                                        r.x0 - pad_pt_x + w/sx, r.y0 - pad_pt_y + h/sy)
                page.insert_image(insert_rect, filename=tmp.name, overlay=True)
                os.unlink(tmp.name)
        page.apply_redactions()

    def _render_and_replace(self, doc, idx, page, rect, scale: float):
        """渲染页面→打码→替换。"""
        mat = fitz.Matrix(scale, scale)
        pix = page.get_pixmap(matrix=mat)
        img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n).copy()
        if img.shape[2] == 4:
            img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)
        elif img.shape[2] == 3:
            img = img[:, :, ::-1].copy()
        for b in self._bboxes(page, img, pix):
            Masker.apply(img, b, self.mode)
        if img.shape[2] == 3:
            img = img[:, :, ::-1]
        tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
        tmp.close()
        cv2.imwrite(tmp.name, img)
        doc.delete_page(idx)
        new_page = doc.new_page(pno=idx, width=rect.width, height=rect.height)
        new_page.insert_image(rect, filename=tmp.name)
        os.unlink(tmp.name)

    def _bboxes(self, page, img, pix=None) -> List:
        bboxes = []
        # 计算缩放因子：pixmap尺寸 / 页面尺寸。无pix时用图像尺寸。
        if pix is not None:
            sx = pix.width / page.rect.width
            sy = pix.height / page.rect.height
        else:
            h_img, w_img = img.shape[:2]
            sx = w_img / page.rect.width
            sy = h_img / page.rect.height
        text = page.get_text("text")
        for h in self.detector.scan_text(text):
            for rect in page.search_for(h["text"]):
                x = int(rect.x0 * sx); y = int(rect.y0 * sy)
                w = int((rect.x1 - rect.x0) * sx); h = int((rect.y1 - rect.y0) * sy)
                pad = 4
                bboxes.append((max(0, x - pad), max(0, y - pad), w + 2 * pad, h + 2 * pad))
        for h in self.detector.scan_image(img):
            if "bbox" in h:
                bboxes.append(h["bbox"])
        return merge_bboxes(bboxes)

    # ── 预览 ────────────────────────────────────

    def preview(self, src: str, page_num: int = 0, masked: bool = False) -> Optional[np.ndarray]:
        try:
            doc = fitz.open(src)
            if page_num >= len(doc):
                doc.close(); return None
            page = doc[page_num]
            pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5))
            img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n).copy()
            if img.shape[2] == 4:
                img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)
            elif img.shape[2] == 3:
                img = img[:, :, ::-1].copy()
            if masked and self.detector.active:
                for b in self._bboxes(page, img, pix):
                    Masker.apply(img, b, self.mode)
            doc.close()
            return img
        except Exception:
            return None
