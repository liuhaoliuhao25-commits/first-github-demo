"""预览组件 — 原始/打码对比显示"""
import cv2
import numpy as np
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QSplitter, QScrollArea
)
from PySide6.QtGui import QImage, QPixmap
from PySide6.QtCore import Qt


class PreviewWidget(QWidget):
    """左右对比预览：原始图 | 打码图"""

    def __init__(self):
        super().__init__()
        self._build_ui()

    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)

        self.splitter = QSplitter(Qt.Horizontal)

        # ── 原始预览 ──
        left_container = QWidget()
        left_layout = QVBoxLayout(left_container)
        left_layout.setContentsMargins(4, 4, 4, 4)
        left_title = QLabel("📋 原始内容")
        left_title.setStyleSheet("font-weight: bold; font-size: 13px;")
        left_title.setAlignment(Qt.AlignCenter)
        left_layout.addWidget(left_title)

        self.original_scroll = QScrollArea()
        self.original_scroll.setWidgetResizable(True)
        self.original_label = QLabel("请导入文件")
        self.original_label.setAlignment(Qt.AlignCenter)
        self.original_label.setStyleSheet("background: #fafafa; border: 1px solid #ddd; border-radius: 4px;")
        self.original_label.setMinimumSize(300, 300)
        self.original_scroll.setWidget(self.original_label)
        left_layout.addWidget(self.original_scroll)
        self.splitter.addWidget(left_container)

        # ── 打码预览 ──
        right_container = QWidget()
        right_layout = QVBoxLayout(right_container)
        right_layout.setContentsMargins(4, 4, 4, 4)
        right_title = QLabel("🔒 打码效果")
        right_title.setStyleSheet("font-weight: bold; font-size: 13px;")
        right_title.setAlignment(Qt.AlignCenter)
        right_layout.addWidget(right_title)

        self.masked_scroll = QScrollArea()
        self.masked_scroll.setWidgetResizable(True)
        self.masked_label = QLabel("等待打码...")
        self.masked_label.setAlignment(Qt.AlignCenter)
        self.masked_label.setStyleSheet("background: #fafafa; border: 1px solid #ddd; border-radius: 4px;")
        self.masked_label.setMinimumSize(300, 300)
        self.masked_scroll.setWidget(self.masked_label)
        right_layout.addWidget(self.masked_scroll)
        self.splitter.addWidget(right_container)

        layout.addWidget(self.splitter)

    # ── 公共接口 ───────────────────────────────────────

    def show_original(self, img: np.ndarray):
        """显示原始图像。"""
        self._set_image(self.original_label, img)

    def show_masked(self, img: np.ndarray):
        """显示打码后的图像。"""
        self._set_image(self.masked_label, img)

    def clear(self):
        """清空预览。"""
        self.original_label.setText("请导入文件")
        self.original_label.setPixmap(QPixmap())
        self.masked_label.setText("等待打码...")
        self.masked_label.setPixmap(QPixmap())

    # ── 内部方法 ───────────────────────────────────────

    def _set_image(self, label: QLabel, img: np.ndarray):
        """将 numpy 图像显示到 QLabel。"""
        if img is None:
            return
        h, w = img.shape[:2]
        if img.shape[2] == 3:
            # BGR → RGB
            rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        else:
            rgb = img

        bytes_per_line = 3 * w
        qimg = QImage(rgb.data, w, h, bytes_per_line, QImage.Format_RGB888)

        # 缩放到适合预览
        max_w = label.width() or 400
        max_h = label.height() or 400
        pixmap = QPixmap.fromImage(qimg).scaled(
            max_w, max_h, Qt.KeepAspectRatio, Qt.SmoothTransformation
        )
        label.setPixmap(pixmap)
        label.setMinimumSize(1, 1)  # 清除最小尺寸限制
