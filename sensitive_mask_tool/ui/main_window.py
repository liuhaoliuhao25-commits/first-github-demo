"""主窗口 — QTabWidget 容纳 PDF/图片 两个标签页 + 左侧共用规则面板"""
from PySide6.QtWidgets import (
    QMainWindow, QTabWidget, QVBoxLayout, QHBoxLayout,
    QWidget, QStatusBar, QSplitter
)
from PySide6.QtCore import Qt

from ui.rules_panel import RulesPanel
from ui.pdf_tab import PDFTab
from ui.image_tab import ImageTab


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("敏感信息打码工具")
        self.resize(1100, 750)
        self._build_ui()

    def _build_ui(self):
        central = QWidget()
        self.setCentralWidget(central)

        # 水平分割：左侧规则面板 | 右侧标签页
        h_layout = QHBoxLayout(central)
        h_layout.setContentsMargins(8, 8, 8, 8)
        h_layout.setSpacing(8)

        # ── 左侧：共用规则面板 ──
        self.rules_panel = RulesPanel()
        self.rules_panel.setFixedWidth(240)
        h_layout.addWidget(self.rules_panel)

        # ── 右侧：标签页 ──
        right_widget = QWidget()
        right_layout = QVBoxLayout(right_widget)
        right_layout.setContentsMargins(0, 0, 0, 0)

        self.tabs = QTabWidget()
        self.pdf_tab = PDFTab(self.rules_panel)
        self.image_tab = ImageTab(self.rules_panel)

        self.tabs.addTab(self.pdf_tab, "📄 PDF批量打码")
        self.tabs.addTab(self.image_tab, "🖼️ 图片批量打码")

        right_layout.addWidget(self.tabs)
        h_layout.addWidget(right_widget, stretch=1)

        # 状态栏
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        self.status_bar.showMessage("就绪 — 请导入文件开始")
