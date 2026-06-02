"""图片处理器 — Pillow/OpenCV 检测 + 打码 + 保存"""
import os
import cv2
import numpy as np
from PIL import Image
from typing import List, Optional, Callable

from core.detectors import SensitiveDetector
from core.mask_engines import MaskEngine
from utils.bbox import merge_bboxes


class ImageProcessor:
    """图片敏感信息打码处理器。

    用法:
        detector = SensitiveDetector(enabled_rules=['phone', ...])
        processor = ImageProcessor(detector, mask_mode='blur')
        processor.process('input.jpg', 'output.jpg')
    """

    SUPPORTED_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif"}

    def __init__(
        self,
        detector: SensitiveDetector,
        mask_mode: str = "black",
    ):
        self.detector = detector
        self.mask_mode = mask_mode

    def process(
        self,
        input_path: str,
        output_path: str,
        progress_callback: Optional[Callable[[str], None]] = None,
    ) -> bool:
        """处理单张图片。

        返回: 成功/失败
        """
        if not self.detector.has_any_rule():
            import shutil
            shutil.copy2(input_path, output_path)
            return True

        try:
            # 读取图片
            img = cv2.imread(input_path, cv2.IMREAD_COLOR)
            if img is None:
                # 尝试 Pillow（某些格式可能 OpenCV 不支持）
                pil_img = Image.open(input_path).convert("RGB")
                img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

            if progress_callback:
                progress_callback(f"检测: {os.path.basename(input_path)}")

            # 检测敏感区域
            bboxes = self._detect_bboxes(img)

            if progress_callback and bboxes:
                progress_callback(f"发现 {len(bboxes)} 处敏感区域，开始打码...")

            # 逐区域打码
            for bbox in bboxes:
                MaskEngine.apply(img, bbox, self.mask_mode)

            # 保存（保留原始尺寸）
            os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
            cv2.imwrite(output_path, img, [cv2.IMWRITE_JPEG_QUALITY, 95])

            if progress_callback:
                progress_callback(f"已保存: {os.path.basename(output_path)}")

            return True
        except Exception as e:
            if progress_callback:
                progress_callback(f"错误: {e}")
            return False

    def process_batch(
        self,
        file_list: List[str],
        output_dir: str,
        progress_callback: Optional[Callable[[int, int, str], None]] = None,
    ) -> List[str]:
        """批量处理图片文件。"""
        os.makedirs(output_dir, exist_ok=True)
        results = []
        total = len(file_list)

        for idx, fp in enumerate(file_list):
            basename = os.path.basename(fp)
            name, ext = os.path.splitext(basename)
            out_path = os.path.join(output_dir, f"{name}_打码{ext}")

            if progress_callback:
                progress_callback(idx + 1, total, f"处理: {basename}")

            success = self.process(fp, out_path)
            if success:
                results.append(out_path)

        return results

    # ── 内部方法 ──────────────────────────────────────

    def _detect_bboxes(self, img: np.ndarray) -> List:
        """检测图片中的敏感区域。

        策略：
        1. OCR → 文本 → 正则匹配 → 返回 OCR 的 bbox
        2. 如果没有 OCR 结果，用 OpenCV 文字检测做补充
        """
        bboxes = []

        # OCR 检测
        ocr_hits = self.detector.detect_in_image(img)
        for hit in ocr_hits:
            if "bbox" in hit:
                bboxes.append(hit["bbox"])

        # 如果 OCR 无结果且有关键词或规则，尝试 East 文字检测
        if not bboxes and self.detector.has_any_rule():
            text_regions = self._detect_text_regions(img)
            for region in text_regions:
                bboxes.append(region)

        return merge_bboxes(bboxes)

    @staticmethod
    def _detect_text_regions(img: np.ndarray) -> List:
        """使用形态学操作粗略检测文字密集区域（OCR 不可用时的回退方案）。"""
        try:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            # 二值化
            _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
            # 形态学闭运算连接文字
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 5))
            closed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
            # 找轮廓
            contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            regions = []
            for cnt in contours:
                x, y, w, h = cv2.boundingRect(cnt)
                # 过滤太小的区域
                if w > 30 and h > 10:
                    pad = 4
                    regions.append((
                        max(0, x - pad),
                        max(0, y - pad),
                        w + 2 * pad,
                        h + 2 * pad,
                    ))
            return regions
        except Exception:
            return []

    # ── 预览方法 ─────────────────────────────────────

    def preview_image(
        self, input_path: str, with_mask: bool = False
    ) -> Optional[np.ndarray]:
        """获取预览图像（可选打码效果）。

        返回: numpy BGR 数组
        """
        try:
            img = cv2.imread(input_path, cv2.IMREAD_COLOR)
            if img is None:
                pil_img = Image.open(input_path).convert("RGB")
                img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

            if with_mask and self.detector.has_any_rule():
                bboxes = self._detect_bboxes(img)
                for bbox in bboxes:
                    MaskEngine.apply(img, bbox, self.mask_mode)

            return img
        except Exception:
            return None
