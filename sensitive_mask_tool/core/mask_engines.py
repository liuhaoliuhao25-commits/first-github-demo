"""打码引擎 — 黑块 / 高斯模糊 / 星号掩码"""
import cv2
import numpy as np
from typing import Tuple


class MaskEngine:
    """三种打码模式的可调用引擎。

    用法:
        engine = MaskEngine()
        result_img = engine.apply(image, bbox, mode="black")
        result_img = engine.apply(image, bbox, mode="blur")
        result_img = engine.apply(image, bbox, mode="asterisk")
    """

    @staticmethod
    def apply(
        image: np.ndarray,
        bbox: Tuple[int, int, int, int],
        mode: str = "black",
    ) -> np.ndarray:
        """在图像上对指定区域打码（原地修改）。

        bbox: (x, y, w, h) — 左上角坐标 + 宽高
        mode: "black" | "blur" | "asterisk"
        """
        x, y, w, h = [int(v) for v in bbox]
        h_img, w_img = image.shape[:2]
        # 裁剪到图像边界
        x = max(0, x)
        y = max(0, y)
        w = min(w, w_img - x)
        h = min(h, h_img - y)
        if w <= 0 or h <= 0:
            return image

        if mode == "black":
            return MaskEngine._fill_black(image, x, y, w, h)
        elif mode == "blur":
            return MaskEngine._gaussian_blur(image, x, y, w, h)
        elif mode == "asterisk":
            return MaskEngine._asterisk_mask(image, x, y, w, h)
        else:
            return MaskEngine._fill_black(image, x, y, w, h)

    # ── 黑块遮挡 ─────────────────────────────────────

    @staticmethod
    def _fill_black(
        image: np.ndarray, x: int, y: int, w: int, h: int
    ) -> np.ndarray:
        image[y : y + h, x : x + w] = 0
        return image

    # ── 高斯模糊 ─────────────────────────────────────

    @staticmethod
    def _gaussian_blur(
        image: np.ndarray, x: int, y: int, w: int, h: int
    ) -> np.ndarray:
        roi = image[y : y + h, x : x + w]
        # 核大小根据区域尺寸自适应
        ksize = max(3, min(w, h) // 3)
        if ksize % 2 == 0:
            ksize += 1
        blurred = cv2.GaussianBlur(roi, (ksize, ksize), 0)
        image[y : y + h, x : x + w] = blurred
        return image

    # ── 星号掩码 ─────────────────────────────────────

    @staticmethod
    def _asterisk_mask(
        image: np.ndarray, x: int, y: int, w: int, h: int
    ) -> np.ndarray:
        """在区域上覆盖星号字符图案（原地修改）。"""
        # 直接在 numpy 数组上操作：白底 + 黑星号
        roi = image[y : y + h, x : x + w]
        # 白色背景
        roi[:] = (255, 255, 255)
        # 用 OpenCV putText 绘制星号（避免 PIL 字体依赖）
        import cv2
        font_size = max(0.3, min(h / 60.0, 1.2))
        cols = max(1, int(w / (font_size * 25)))
        rows = max(1, int(h / (font_size * 35)))
        cell_w = w / cols
        cell_h = h / rows
        for row in range(rows):
            for col in range(cols):
                cx = x + int(col * cell_w + cell_w * 0.1)
                cy = y + int(row * cell_h + cell_h * 0.75)
                # "cy" 是相对于整个图像，但 putText 使用绝对坐标
                cv2.putText(
                    image, "*",
                    (cx, cy),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    font_size,
                    (0, 0, 0),
                    max(1, int(font_size * 2)),
                    cv2.LINE_AA,
                )
        return image

    # ── 文字掩码（用于PDF文字层替换）─────────────────

    @staticmethod
    def asterisk_text(text: str, keep_first: int = 3, keep_last: int = 4) -> str:
        """将文本替换为星号掩码格式。如：138****6789"""
        if len(text) <= keep_first + keep_last:
            return "*" * len(text)
        return text[:keep_first] + "*" * (len(text) - keep_first - keep_last) + text[-keep_last:]

    @staticmethod
    def mask_text(text: str, mode: str = "asterisk") -> str:
        """对纯文本进行掩码。

        mode:
          "black"   → 全替换为 █
          "asterisk"→ 保留首尾，中间用 * 替代
          "blur"    → 全替换为 ***
        """
        if mode == "black":
            return "█" * len(text)
        elif mode == "asterisk":
            return MaskEngine.asterisk_text(text)
        else:  # blur → 星号全掩
            return "*" * len(text)
