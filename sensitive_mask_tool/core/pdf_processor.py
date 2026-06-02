"""PDF 处理器 — PyMuPDF 检测 + 打码 + 保存"""
import os
import fitz  # PyMuPDF
import numpy as np
from typing import List, Optional, Callable

from core.detectors import SensitiveDetector
from core.mask_engines import MaskEngine
from utils.bbox import merge_bboxes


class PDFProcessor:
    """PDF 敏感信息打码处理器。

    用法:
        detector = SensitiveDetector(enabled_rules=['phone', ...])
        processor = PDFProcessor(detector, mask_mode='blur')
        processor.process('input.pdf', 'output.pdf', progress_callback=...)
    """

    def __init__(
        self,
        detector: SensitiveDetector,
        mask_mode: str = "black",
    ):
        self.detector = detector
        self.mask_mode = mask_mode  # "black" | "blur" | "asterisk"

    def process(
        self,
        input_path: str,
        output_path: str,
        progress_callback: Optional[Callable[[int, int, str], None]] = None,
    ) -> bool:
        """处理单个 PDF 文件。

        progress_callback(current_page, total_pages, message)
        返回: 成功/失败
        """
        if not self.detector.has_any_rule():
            # 无规则 → 直接复制
            import shutil
            shutil.copy2(input_path, output_path)
            return True

        try:
            doc = fitz.open(input_path)
            total = len(doc)

            for i in range(total):
                if progress_callback:
                    progress_callback(i + 1, total, f"处理第 {i + 1}/{total} 页...")
                self._process_page(doc, i)

            doc.save(output_path, garbage=4, deflate=True)
            doc.close()
            return True
        except Exception as e:
            if progress_callback:
                progress_callback(0, 0, f"错误: {e}")
            return False

    def process_batch(
        self,
        file_list: List[str],
        output_dir: str,
        progress_callback: Optional[Callable[[int, int, str], None]] = None,
    ) -> List[str]:
        """批量处理 PDF 文件。

        返回: 成功处理的输出文件路径列表
        """
        os.makedirs(output_dir, exist_ok=True)
        results = []
        total = len(file_list)

        for idx, fp in enumerate(file_list):
            basename = os.path.basename(fp)
            name, _ = os.path.splitext(basename)
            out_path = os.path.join(output_dir, f"{name}_打码.pdf")

            if progress_callback:
                progress_callback(
                    idx + 1, total, f"处理: {basename}"
                )

            success = self.process(fp, out_path)
            if success:
                results.append(out_path)

        return results

    # ── 内部方法 ──────────────────────────────────────

    def _process_page(self, doc: fitz.Document, page_index: int):
        """处理单页。"""
        page = doc[page_index]

        if self.mask_mode == "black":
            self._redact_text_mode(page)
        else:
            # 模糊或星号 → 栅格化打码
            self._redact_image_mode(page)

    def _redact_text_mode(self, page: fitz.Page):
        """文字PDF — 使用原生 redact annotation（黑块模式）。"""
        text = page.get_text("text")
        hits = self.detector.detect_in_text(text)

        for hit in hits:
            # 搜索文本在页面中的位置（矩形区域）
            search_text = hit["text"]
            rects = page.search_for(search_text)
            for rect in rects:
                page.add_redact_annot(rect, fill=(0, 0, 0))

        # 应用所有 redact
        page.apply_redactions()

    def _redact_image_mode(self, page: fitz.Page):
        """图像打码模式 — 渲染页面为图像 → 打码 → 替换页面。

        先尝试文字检测定位敏感区域；再对扫描PDF用OCR补充。
        """
        # 渲染页面到图像
        mat = fitz.Matrix(2.0, 2.0)  # 2x 缩放保证清晰度
        pix = page.get_pixmap(matrix=mat)
        img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(
            pix.height, pix.width, pix.n
        ).copy()

        # 如果图像是 RGBA，转为 BGR
        if img.shape[2] == 4:
            import cv2
            img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)
        elif img.shape[2] == 3:
            # RGB → BGR (for OpenCV compatibility)
            img = img[:, :, ::-1].copy()

        # 检测敏感区域
        bboxes = self._detect_bboxes_on_page(page, img, pix)

        # 逐区域打码
        for bbox in bboxes:
            MaskEngine.apply(img, bbox, self.mask_mode)

        # BGR → RGB (for PyMuPDF)
        if img.shape[2] == 3:
            img = img[:, :, ::-1]

        # 将打码后的图像插入页面
        # 清空页面 → 插入图像（使用临时文件，兼容所有 PyMuPDF 版本）
        page.clean_contents()
        rect = page.rect
        tmp_path = self._save_temp_image(img)
        page.insert_image(rect, filename=tmp_path)
        import os as _os
        _os.unlink(tmp_path)

    def _detect_bboxes_on_page(
        self, page: fitz.Page, img: np.ndarray, pix
    ) -> List:
        """检测页面上的敏感区域，返回图像坐标系的 bbox 列表。"""
        bboxes = []

        # 1. 文本搜索 → 定位文字区域
        text = page.get_text("text")
        text_hits = self.detector.detect_in_text(text)

        for hit in text_hits:
            rects = page.search_for(hit["text"])
            for rect in rects:
                # 页面坐标 → 图像坐标（乘以缩放因子）
                scale_x = pix.width / page.rect.width
                scale_y = pix.height / page.rect.height
                x = int(rect.x0 * scale_x)
                y = int(rect.y0 * scale_y)
                w = int((rect.x1 - rect.x0) * scale_x)
                h = int((rect.y1 - rect.y0) * scale_y)
                # 扩大一点边距
                pad = 4
                bboxes.append((
                    max(0, x - pad),
                    max(0, y - pad),
                    w + 2 * pad,
                    h + 2 * pad,
                ))

        # 2. OCR 补充（扫描PDF中可能遗漏的）
        ocr_hits = self.detector.detect_in_image(img)
        for hit in ocr_hits:
            bboxes.append(hit.get("bbox", (0, 0, 0, 0)))

        # 去重合并重叠 bbox
        return merge_bboxes(bboxes)

    @staticmethod
    def _save_temp_image(img: np.ndarray) -> str:
        """将 numpy 图像保存为临时 PNG，返回路径。"""
        import cv2
        import tempfile
        tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
        tmp.close()
        cv2.imwrite(tmp.name, img)
        return tmp.name

    # ── 预览方法 ─────────────────────────────────────

    def preview_page_image(
        self, input_path: str, page_num: int = 0, with_mask: bool = False
    ) -> Optional[np.ndarray]:
        """获取指定页的预览图像（可选是否带打码效果）。

        返回: numpy BGR 数组
        """
        try:
            doc = fitz.open(input_path)
            if page_num >= len(doc):
                doc.close()
                return None

            page = doc[page_num]
            mat = fitz.Matrix(1.5, 1.5)
            pix = page.get_pixmap(matrix=mat)
            img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(
                pix.height, pix.width, pix.n
            ).copy()

            if img.shape[2] == 4:
                import cv2
                img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)
            elif img.shape[2] == 3:
                img = img[:, :, ::-1].copy()

            if with_mask and self.detector.has_any_rule():
                bboxes = self._detect_bboxes_on_page(page, img, pix)
                for bbox in bboxes:
                    MaskEngine.apply(img, bbox, self.mask_mode)

            doc.close()
            return img
        except Exception:
            return None
