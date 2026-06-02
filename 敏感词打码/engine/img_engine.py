"""图片打码引擎 — OpenCV + Pillow"""
import os
import cv2
import numpy as np
from PIL import Image
from typing import List, Optional, Callable

from engine.detector import Detector
from engine.masker import Masker
from engine.pdf_engine import merge_bboxes

IMG_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif"}


class ImgEngine:
    """图片敏感信息打码。"""

    def __init__(self, detector: Detector, mode: str = "black"):
        self.detector = detector
        self.mode = mode

    def process(self, src: str, dst: str) -> bool:
        if not self.detector.active:
            import shutil; shutil.copy2(src, dst); return True
        try:
            img = cv2.imread(src, cv2.IMREAD_COLOR)
            if img is None:
                img = cv2.cvtColor(np.array(Image.open(src).convert("RGB")), cv2.COLOR_RGB2BGR)
            for b in self._bboxes(img):
                Masker.apply(img, b, self.mode)
            os.makedirs(os.path.dirname(dst) or ".", exist_ok=True)
            cv2.imwrite(dst, img, [cv2.IMWRITE_JPEG_QUALITY, 95])
            return True
        except Exception:
            return False

    def batch(self, files: List[str], out_dir: str,
              cb: Callable = None) -> List[str]:
        os.makedirs(out_dir, exist_ok=True)
        results = []
        for idx, fp in enumerate(files):
            name, ext = os.path.splitext(os.path.basename(fp))
            dst = os.path.join(out_dir, f"{name}_打码{ext}")
            if cb:
                cb(idx + 1, len(files), os.path.basename(fp))
            if self.process(fp, dst):
                results.append(dst)
        return results

    def preview(self, src: str, masked: bool = False) -> Optional[np.ndarray]:
        try:
            img = cv2.imread(src, cv2.IMREAD_COLOR)
            if img is None:
                img = cv2.cvtColor(np.array(Image.open(src).convert("RGB")), cv2.COLOR_RGB2BGR)
            if masked and self.detector.active:
                for b in self._bboxes(img):
                    Masker.apply(img, b, self.mode)
            return img
        except Exception:
            return None

    # ── 内部 ────────────────────────────────────

    def _bboxes(self, img: np.ndarray) -> List:
        bboxes = []
        for h in self.detector.scan_image(img):
            if "bbox" in h:
                bboxes.append(h["bbox"])
        if not bboxes and self.detector.active:
            bboxes = _text_regions(img)
        return merge_bboxes(bboxes)


def _text_regions(img: np.ndarray) -> List:
    """形态学文字区域检测（OCR不可用时的回退方案）。"""
    try:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        _, bin_img = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 5))
        closed = cv2.morphologyEx(bin_img, cv2.MORPH_CLOSE, kernel)
        contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        regions = []
        for cnt in contours:
            x, y, w, h = cv2.boundingRect(cnt)
            if w > 30 and h > 10:
                pad = 4
                regions.append((max(0, x - pad), max(0, y - pad), w + 2 * pad, h + 2 * pad))
        return regions
    except Exception:
        return []
