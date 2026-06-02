"""预览组件 — 高清左右对比"""
import cv2
import numpy as np
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QLabel, QSplitter, QScrollArea, QFrame
)
from PySide6.QtGui import QImage, QPixmap, QColor
from PySide6.QtCore import Qt
from ui.theme import ThemeManager
from ui.effects import card_shadow


class Previewer(QWidget):
    def __init__(self, theme: ThemeManager):
        super().__init__()
        self._theme = theme
        lo = QVBoxLayout(self)
        lo.setContentsMargins(0, 0, 0, 0)
        lo.setSpacing(0)

        split = QSplitter(Qt.Horizontal)
        split.setHandleWidth(3)

        self.orig = _pane("  📋  原始内容", "请导入文件", theme)
        self.mask = _pane("  🔒  打码效果", "等待打码...", theme)
        split.addWidget(self.orig["container"])
        split.addWidget(self.mask["container"])
        split.setSizes([400, 400])

        lo.addWidget(split)

    def show_orig(self, img: np.ndarray):
        _set_img(self.orig["label"], img)

    def show_mask(self, img: np.ndarray):
        _set_img(self.mask["label"], img)

    def clear(self):
        for pane in [self.orig, self.mask]:
            pane["label"].setText(pane.get("placeholder", ""))
            pane["label"].setPixmap(QPixmap())


def _pane(title: str, placeholder: str, theme: ThemeManager) -> dict:
    container = QFrame()
    container.setFrameShape(QFrame.NoFrame)
    tk = theme.tokens
    container.setStyleSheet(f"""
        QFrame {{
            background: {tk['surface']};
            border: 1px solid {tk['border']};
            border-radius: 8px;
        }}
    """)
    lo = QVBoxLayout(container)
    lo.setContentsMargins(0, 0, 0, 0)
    lo.setSpacing(0)

    title_bar = QLabel(title)
    title_bar.setStyleSheet(f"""
        font-weight:600;font-size:12px;color:{tk['text_secondary']};
        padding:6px 10px;background:transparent;border:none;
    """)
    lo.addWidget(title_bar)

    scroll = QScrollArea()
    scroll.setWidgetResizable(True)
    scroll.setFrameShape(QFrame.NoFrame)
    scroll.setStyleSheet("QScrollArea{border:none;background:transparent;}")

    label = QLabel(placeholder)
    label.setAlignment(Qt.AlignCenter)
    label.setStyleSheet(f"""
        background:{tk['bg']};
        border:none;
        border-radius:0 0 8px 8px;
        color:{tk['text_hint']};
        font-size:13px;
    """)
    label.setMinimumSize(280, 260)
    scroll.setWidget(label)
    lo.addWidget(scroll)

    card_shadow(container, blur=10, offset=(0, 1), color=QColor(0, 0, 0, 20))
    return {"container": container, "label": label, "placeholder": placeholder}


def _set_img(label: QLabel, img: np.ndarray):
    if img is None:
        return
    h, w = img.shape[:2]
    if img.shape[2] == 3:
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    else:
        rgb = img
    qimg = QImage(rgb.data, w, h, 3 * w, QImage.Format_RGB888)
    pix = QPixmap.fromImage(qimg).scaled(
        max(280, label.width() - 8),
        max(260, label.height() - 8),
        Qt.KeepAspectRatio,
        Qt.SmoothTransformation,
    )
    label.setPixmap(pix)
    label.setMinimumSize(1, 1)
