"""共用敏感规则面板 — 现代化卡片式"""
from PySide6.QtWidgets import (
    QGroupBox, QVBoxLayout, QCheckBox, QTextEdit,
    QLabel, QPushButton, QHBoxLayout, QWidget, QSizePolicy
)
from PySide6.QtCore import Signal, Qt
from typing import List, Dict
from ui.theme import ThemeManager
from ui.effects import card_shadow
from PySide6.QtGui import QColor

RULES = [
    ("phone", "📱  手机号"),
    ("id_card", "🪪  身份证号"),
    ("birth", "🎂  出生日期"),
    ("address", "🏠  住址信息"),
    ("credit_code", "🏢  信用代码"),
    ("email", "📧  邮箱地址"),
    ("url", "🌐  网址URL"),
]


class RulesPanel(QGroupBox):
    rules_changed = Signal()

    def __init__(self, theme: ThemeManager):
        super().__init__("🔍 敏感信息规则")
        self._theme = theme
        self._checks: Dict[str, QCheckBox] = {}
        self._build()
        card_shadow(self, blur=16, offset=(0, 2), color=QColor(0, 0, 0, 30))

    def _build(self):
        lo = QVBoxLayout(self)
        lo.setSpacing(5)
        lo.setContentsMargins(12, 18, 12, 12)

        # 预设规则
        for rid, label in RULES:
            cb = QCheckBox(label)
            cb.setChecked(True)
            cb.toggled.connect(self.rules_changed.emit)
            cb.setCursor(Qt.PointingHandCursor)
            self._checks[rid] = cb
            lo.addWidget(cb)

        lo.addSpacing(4)

        # 分隔
        sep = QLabel()
        sep.setFixedHeight(1)
        sep.setStyleSheet(f"background:{self._theme.tokens['border']};")
        lo.addWidget(sep)
        lo.addSpacing(4)

        # 自定义关键词
        kw_label = QLabel("🔑 自定义关键词")
        kw_label.setStyleSheet(f"font-weight:600;font-size:12px;color:{self._theme.tokens['text_secondary']};")
        lo.addWidget(kw_label)

        self.kw_edit = QTextEdit()
        self.kw_edit.setMaximumHeight(90)
        self.kw_edit.setPlaceholderText("一行一个关键词...")
        self.kw_edit.textChanged.connect(self.rules_changed.emit)
        lo.addWidget(self.kw_edit)

        lo.addSpacing(4)

        # 按钮行
        btn_row = QHBoxLayout()
        btn_clear = QPushButton("清空")
        btn_clear.clicked.connect(lambda: [c.setChecked(False) for c in self._checks.values()])
        btn_clear.setCursor(Qt.PointingHandCursor)
        btn_all = QPushButton("全选")
        btn_all.clicked.connect(lambda: [c.setChecked(True) for c in self._checks.values()])
        btn_all.setCursor(Qt.PointingHandCursor)
        btn_row.addWidget(btn_clear)
        btn_row.addWidget(btn_all)
        lo.addLayout(btn_row)

    def config(self) -> dict:
        return {
            "rules": [rid for rid, cb in self._checks.items() if cb.isChecked()],
            "keywords": [k.strip() for k in self.kw_edit.toPlainText().splitlines() if k.strip()],
        }
