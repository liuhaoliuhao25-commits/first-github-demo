"""打码器 — 黑块 / 高斯模糊 / 星号掩码"""
import cv2
import numpy as np
from typing import Tuple


class Masker:
    """三种打码模式，原地修改图像。

    mode: "black" | "blur" | "asterisk"
    """

    @staticmethod
    def apply(img: np.ndarray, bbox: Tuple[int, int, int, int], mode: str = "black") -> np.ndarray:
        x, y, w, h = [int(v) for v in bbox]
        h_img, w_img = img.shape[:2]
        x, y = max(0, x), max(0, y)
        w, h = min(w, w_img - x), min(h, h_img - y)
        if w <= 0 or h <= 0:
            return img
        if mode == "black":
            img[y:y + h, x:x + w] = 0
        elif mode == "blur":
            roi = img[y:y + h, x:x + w]
            k = max(3, min(w, h) // 3)
            if k % 2 == 0:
                k += 1
            img[y:y + h, x:x + w] = cv2.GaussianBlur(roi, (k, k), 0)
        elif mode == "asterisk":
            _asterisk(img, x, y, w, h)
        return img

    @staticmethod
    def mask_text(text: str, mode: str = "asterisk", keep_first: int = 0, keep_last: int = 0) -> str:
        """对文本逐字替换。默认全替换为*；传 keep_first/keep_last 可保留首尾（如手机号脱敏）。"""
        if mode == "black":
            return "█" * len(text)
        elif mode == "asterisk":
            if keep_first or keep_last:
                if len(text) <= keep_first + keep_last:
                    return "*" * len(text)
                return text[:keep_first] + "*" * (len(text) - keep_first - keep_last) + text[-keep_last:]
            return "*" * len(text)
        return "*" * len(text)


def _asterisk(img: np.ndarray, x: int, y: int, w: int, h: int):
    """原地覆盖星号图案。"""
    img[y:y + h, x:x + w] = (255, 255, 255)
    fs = max(0.3, min(h / 60.0, 1.2))
    cols = max(1, int(w / (fs * 25)))
    rows = max(1, int(h / (fs * 35)))
    cw, ch = w / cols, h / rows
    for r in range(rows):
        for c in range(cols):
            cx = x + int(c * cw + cw * 0.1)
            cy = y + int(r * ch + ch * 0.75)
            cv2.putText(img, "*", (cx, cy), cv2.FONT_HERSHEY_SIMPLEX, fs, (0, 0, 0), max(1, int(fs * 2)), cv2.LINE_AA)
