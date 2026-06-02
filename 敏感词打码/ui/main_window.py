"""主窗口 — 无边框 + 自定义标题栏 + 四季主题切换 + 阴影"""
from PySide6.QtWidgets import (
    QMainWindow, QTabWidget, QVBoxLayout, QHBoxLayout,
    QWidget, QStatusBar, QLabel, QPushButton, QApplication,
    QComboBox,
)
from PySide6.QtCore import Qt, QPoint
from PySide6.QtGui import QMouseEvent, QColor

from ui.theme import ThemeManager, SEASON_LABELS, SEASONS
from ui.effects import card_shadow
from ui.rules_panel import RulesPanel
from ui.pdf_tab import PDFTab
from ui.image_tab import ImgTab


BORDER = 6  # 可拖拽调整窗口大小的边框宽度


class MainWindow(QMainWindow):
    def __init__(self, theme: ThemeManager):
        super().__init__()
        self._theme = theme
        self._drag_pos: QPoint | None = None
        self._resize_edge: str | None = None

        self.setWindowTitle("敏感词打码")
        self.setMinimumSize(940, 620)
        self.resize(1100, 740)
        self.setWindowFlags(Qt.FramelessWindowHint)
        self.setAttribute(Qt.WA_TranslucentBackground, False)

        self._build()

        # 监听主题变化
        self._theme.changed.connect(lambda s, m: self._update_card())

    def _build(self):
        # 外层容器留出阴影边距
        outer = QWidget()
        self.setCentralWidget(outer)
        outer_layout = QVBoxLayout(outer)
        outer_layout.setContentsMargins(BORDER, BORDER, BORDER, BORDER)
        outer_layout.setSpacing(0)

        # 主卡片（所有内容）
        card = QWidget()
        card.setObjectName("mainCard")
        card_layout = QVBoxLayout(card)
        card_layout.setContentsMargins(0, 0, 0, 0)
        card_layout.setSpacing(0)

        # ── 自定义标题栏 ──
        card_layout.addLayout(self._title_bar())

        # ── 主体内容 ──
        body = QWidget()
        body_layout = QHBoxLayout(body)
        body_layout.setContentsMargins(8, 4, 8, 8)
        body_layout.setSpacing(8)

        self.rules = RulesPanel(self._theme)
        self.rules.setFixedWidth(235)
        body_layout.addWidget(self.rules)

        self.tabs = QTabWidget()
        self.tabs.addTab(PDFTab(self.rules, self._theme), "  📄  PDF批量打码  ")
        self.tabs.addTab(ImgTab(self.rules, self._theme), "  🖼️  图片批量打码  ")
        body_layout.addWidget(self.tabs, stretch=1)

        card_layout.addWidget(body, stretch=1)

        # ── 状态栏 ──
        self.sb = QStatusBar()
        self.sb.showMessage("就绪 — 导入文件开始")
        card_layout.addWidget(self.sb)

        outer_layout.addWidget(card)

        # 卡片阴影
        card_shadow(card, blur=30, offset=(0, 4), color=QColor(0, 0, 0, 40))
        card.setStyleSheet(f"""
            QWidget#mainCard {{
                background: {self._theme.tokens['surface']};
                border-radius: 12px;
            }}
        """)

    def _title_bar(self) -> QHBoxLayout:
        tb = QHBoxLayout()
        tb.setContentsMargins(16, 4, 8, 4)
        tb.setSpacing(8)

        # 应用图标+标题
        icon = QLabel("🔒")
        icon.setStyleSheet("font-size:18px;background:transparent;")
        tb.addWidget(icon)
        title = QLabel("敏感词打码")
        title.setStyleSheet(f"""
            font-size:15px;font-weight:700;color:{self._theme.tokens['text']};
            background:transparent;
        """)
        tb.addWidget(title)
        tb.addSpacing(12)

        # 操作区
        tb.addStretch()

        # 四季下拉
        self.combo_season = QComboBox()
        for s in SEASONS:
            self.combo_season.addItem(SEASON_LABELS[s])
        self.combo_season.setCurrentText(SEASON_LABELS[self._theme.season])
        self.combo_season.setFixedWidth(130)
        self.combo_season.setFixedHeight(30)
        self.combo_season.currentIndexChanged.connect(
            lambda: self._theme.apply_season(QApplication.instance(), SEASONS[self.combo_season.currentIndex()])
        )
        tb.addWidget(self.combo_season)
        tb.addSpacing(4)

        # 浅色/深色切换
        self.btn_mode = QPushButton("☀️" if self._theme.mode == "light" else "🌙")
        self.btn_mode.setFixedSize(34, 30)
        self.btn_mode.setToolTip("切换浅色/深色")
        self.btn_mode.clicked.connect(lambda: (
            self._theme.toggle_mode(),
            self._theme.apply(QApplication.instance()),
            self.btn_mode.setText("☀️" if self._theme.mode == "light" else "🌙")
        ))
        btn_mode_style = f"""
            QPushButton {{ background:transparent;border:1px solid {self._theme.tokens['border']};border-radius:15px;font-size:14px; }}
            QPushButton:hover {{ background:{self._theme.tokens['surface_hover']}; }}
        """
        self.btn_mode.setStyleSheet(btn_mode_style)
        tb.addWidget(self.btn_mode)
        tb.addSpacing(8)

        # 窗口控制按钮
        for sym, slot, tip in [
            ("─", self.showMinimized, "最小化"),
            ("□", self._toggle_max, "最大化"),
            ("✕", self.close, "关闭"),
        ]:
            btn = QPushButton(sym)
            btn.setFixedSize(34, 30)
            btn.setToolTip(tip)
            btn.clicked.connect(slot)
            hover = "#e0e0e0" if self._theme.mode == "light" else "#333"
            close_hover = "#e81123" if sym == "✕" else hover
            btn.setStyleSheet(f"""
                QPushButton {{
                    background: transparent;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: bold;
                    color: {self._theme.tokens['text']};
                }}
                QPushButton:hover {{ background: {close_hover}; color: white; }}
            """)
            tb.addWidget(btn)

        return tb

    def _toggle_max(self):
        if self.isMaximized():
            self.showNormal()
        else:
            self.showMaximized()

    def _update_card(self):
        card = self.centralWidget().findChild(QWidget, "mainCard")
        if card:
            card.setStyleSheet(f"""
                QWidget#mainCard {{
                    background: {self._theme.tokens['surface']};
                    border-radius: 12px;
                }}
            """)
        self.btn_mode.setText("☀️" if self._theme.mode == "light" else "🌙")

    # ── 窗口拖拽 + 边缘缩放 ──

    def mousePressEvent(self, e: QMouseEvent):
        if e.button() == Qt.LeftButton:
            self._drag_pos = e.globalPosition().toPoint()
            self._resize_edge = self._hit_edge(e.position().toPoint())

    def mouseMoveEvent(self, e: QMouseEvent):
        if not self._drag_pos:
            return
        delta = e.globalPosition().toPoint() - self._drag_pos
        if self._resize_edge:
            g = self.geometry()
            edges = {
                "left":   lambda: g.adjusted(delta.x(), 0, 0, 0),
                "right":  lambda: g.adjusted(0, 0, delta.x(), 0),
                "top":    lambda: g.adjusted(0, delta.y(), 0, 0),
                "bottom": lambda: g.adjusted(0, 0, 0, delta.y()),
                "tl":     lambda: g.adjusted(delta.x(), delta.y(), 0, 0),
                "tr":     lambda: g.adjusted(0, delta.y(), delta.x(), 0),
                "bl":     lambda: g.adjusted(delta.x(), 0, 0, delta.y()),
                "br":     lambda: g.adjusted(0, 0, delta.x(), delta.y()),
            }
            if self._resize_edge in edges:
                new_g = edges[self._resize_edge]()
                if new_g.width() >= self.minimumWidth() and new_g.height() >= self.minimumHeight():
                    self.setGeometry(new_g)
            self._drag_pos = e.globalPosition().toPoint()
        elif e.position().toPoint().y() < 40:
            # 标题栏拖拽
            self.move(self.pos() + delta)
            self._drag_pos = e.globalPosition().toPoint()

    def mouseReleaseEvent(self, e: QMouseEvent):
        self._drag_pos = None
        self._resize_edge = None

    def _hit_edge(self, pos: QPoint) -> str | None:
        """检测鼠标是否在窗口边缘（用于缩放）。"""
        w, h = self.width(), self.height()
        x, y = pos.x(), pos.y()
        left = x <= BORDER + 4
        right = x >= w - BORDER - 4
        top = y <= BORDER + 4
        bottom = y >= h - BORDER - 4
        if top and left:    return "tl"
        if top and right:   return "tr"
        if bottom and left: return "bl"
        if bottom and right:return "br"
        if left:            return "left"
        if right:           return "right"
        if top:             return "top"
        if bottom:          return "bottom"
        return None
