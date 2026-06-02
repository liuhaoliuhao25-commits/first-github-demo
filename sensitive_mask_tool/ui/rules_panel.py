"""共用敏感规则面板 — 复选框 + 自定义关键词"""
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QGroupBox, QCheckBox, QTextEdit,
    QLabel, QPushButton, QHBoxLayout
)
from PySide6.QtCore import Signal
from typing import List, Dict


class RulesPanel(QGroupBox):
    """敏感规则勾选面板。

    信号:
        rules_changed: 任何规则变更时发出
    """

    rules_changed = Signal()

    RULE_MAP = {
        "phone": "📱 手机号",
        "id_card": "🪪 身份证号",
        "birth": "🎂 出生日期",
        "address": "🏠 住址信息",
    }

    def __init__(self):
        super().__init__("🔍 敏感信息规则")
        self._build_ui()

    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setSpacing(8)

        # ── 预设规则复选框 ──
        self.checkboxes: Dict[str, QCheckBox] = {}
        for rule_id, label in self.RULE_MAP.items():
            cb = QCheckBox(label)
            cb.setChecked(True)  # 默认全选
            cb.toggled.connect(self.rules_changed.emit)
            self.checkboxes[rule_id] = cb
            layout.addWidget(cb)

        # ── 分隔线 ──
        sep = QLabel("─" * 20)
        sep.setStyleSheet("color: #ccc;")
        layout.addWidget(sep)

        # ── 自定义关键词 ──
        kw_label = QLabel("🔑 自定义敏感关键词")
        kw_label.setStyleSheet("font-weight: bold; margin-top: 4px;")
        layout.addWidget(kw_label)

        hint = QLabel("每行一个关键词，如：\n张三\n保密项目\n内部文件")
        hint.setStyleSheet("color: #888; font-size: 11px;")
        layout.addWidget(hint)

        self.keywords_edit = QTextEdit()
        self.keywords_edit.setMaximumHeight(120)
        self.keywords_edit.setPlaceholderText("输入自定义关键词，一行一个...")
        self.keywords_edit.textChanged.connect(self.rules_changed.emit)
        layout.addWidget(self.keywords_edit)

        # ── 底部按钮 ──
        btn_row = QHBoxLayout()
        self.btn_clear = QPushButton("清空规则")
        self.btn_clear.clicked.connect(self._clear_rules)
        self.btn_all = QPushButton("全选")
        self.btn_all.clicked.connect(self._select_all)
        btn_row.addWidget(self.btn_clear)
        btn_row.addWidget(self.btn_all)
        layout.addLayout(btn_row)

        layout.addStretch()

    # ── 公共接口 ───────────────────────────────────────

    def get_enabled_rules(self) -> List[str]:
        """返回当前勾选的规则 ID 列表。"""
        return [
            rule_id
            for rule_id, cb in self.checkboxes.items()
            if cb.isChecked()
        ]

    def get_custom_keywords(self) -> List[str]:
        """返回自定义关键词列表（去空）。"""
        text = self.keywords_edit.toPlainText().strip()
        if not text:
            return []
        return [kw.strip() for kw in text.splitlines() if kw.strip()]

    def get_config(self) -> dict:
        """返回当前完整配置。"""
        return {
            "enabled_rules": self.get_enabled_rules(),
            "custom_keywords": self.get_custom_keywords(),
        }

    # ── 内部方法 ───────────────────────────────────────

    def _clear_rules(self):
        for cb in self.checkboxes.values():
            cb.setChecked(False)
        self.keywords_edit.clear()

    def _select_all(self):
        for cb in self.checkboxes.values():
            cb.setChecked(True)
