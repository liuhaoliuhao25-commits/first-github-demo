"""四季主题系统 — 4季×2模式=8套配色 + QSS"""
from PySide6.QtWidgets import QApplication
from PySide6.QtCore import QObject, Signal

# ═══════════════════════════════════════════
# 8 套颜色令牌
# ═══════════════════════════════════════════

SEASONS = ["spring", "summer", "autumn", "winter"]
MODES = ["light", "dark"]

TOKENS = {
    # ── 🌸 春日清新 ──
    "spring": {
        "light": {
            "primary": "#5CB838", "primary_hover": "#4DA32E", "primary_pressed": "#3D8A22",
            "primary_light": "#EDF8E8", "bg": "#F7F9F5", "bg_alt": "#EEF2EB",
            "surface": "#FFFFFF", "surface_hover": "#FAFCF7", "surface_raised": "#FFFFFF",
            "text": "#1A2418", "text_secondary": "#5C6B56", "text_hint": "#85917F",
            "border": "#DDE4D7", "border_focus": "#6ECB47", "accent": "#F0B8C8",
            "success": "#5CB838", "danger": "#E8737A", "warning": "#F5A623",
            "shadow": "rgba(100,140,80,0.06)", "scrollbar_bg": "#EEF2EB", "scrollbar_thumb": "#C8D3C2",
            "tab_active_bg": "#5CB838", "tab_active_text": "#FFFFFF",
            "tab_inactive_bg": "#EEF2EB", "tab_inactive_text": "#6B7A65",
            "progress_bg": "#E8EDE4", "progress_chunk": "#5CB838",
        },
        "dark": {
            "primary": "#7ECB5A", "primary_hover": "#6DB84A", "primary_pressed": "#5AA03D",
            "primary_light": "#1C2E16", "bg": "#0F170C", "bg_alt": "#151F11",
            "surface": "#1A2516", "surface_hover": "#202D1B", "surface_raised": "#253320",
            "text": "#E2E8DE", "text_secondary": "#9CAA96", "text_hint": "#6F7E69",
            "border": "#2A3824", "border_focus": "#7ECB5A", "accent": "#5C3A44",
            "success": "#7ECB5A", "danger": "#E8737A", "warning": "#F5A623",
            "shadow": "rgba(0,0,0,0.30)", "scrollbar_bg": "#1A2516", "scrollbar_thumb": "#35442E",
            "tab_active_bg": "#7ECB5A", "tab_active_text": "#0F170C",
            "tab_inactive_bg": "#1A2516", "tab_inactive_text": "#7A8A73",
            "progress_bg": "#253320", "progress_chunk": "#7ECB5A",
        },
    },
    # ── ☀️ 夏日清爽 ──
    "summer": {
        "light": {
            "primary": "#4A90E2", "primary_hover": "#3D7FCC", "primary_pressed": "#326DB5",
            "primary_light": "#EBF3FC", "bg": "#F2F6FA", "bg_alt": "#E8EEF5",
            "surface": "#FFFFFF", "surface_hover": "#F7FAFD", "surface_raised": "#FFFFFF",
            "text": "#162030", "text_secondary": "#546478", "text_hint": "#7D8C9E",
            "border": "#D9E2EE", "border_focus": "#5B9DE6", "accent": "#4ED9BC",
            "success": "#4ED9BC", "danger": "#EF6B6B", "warning": "#F5B642",
            "shadow": "rgba(70,130,210,0.06)", "scrollbar_bg": "#E8EEF5", "scrollbar_thumb": "#C4D2E6",
            "tab_active_bg": "#4A90E2", "tab_active_text": "#FFFFFF",
            "tab_inactive_bg": "#E8EEF5", "tab_inactive_text": "#65778C",
            "progress_bg": "#E4EBF2", "progress_chunk": "#4A90E2",
        },
        "dark": {
            "primary": "#5BA0F0", "primary_hover": "#4A8EDE", "primary_pressed": "#3D7AC4",
            "primary_light": "#152238", "bg": "#0C141E", "bg_alt": "#121B28",
            "surface": "#172232", "surface_hover": "#1D2A3D", "surface_raised": "#223045",
            "text": "#DEE5F0", "text_secondary": "#95A5BA", "text_hint": "#6A7A90",
            "border": "#283548", "border_focus": "#5BA0F0", "accent": "#3A6B5E",
            "success": "#4ED9BC", "danger": "#F07070", "warning": "#F5B642",
            "shadow": "rgba(0,0,0,0.30)", "scrollbar_bg": "#172232", "scrollbar_thumb": "#324560",
            "tab_active_bg": "#5BA0F0", "tab_active_text": "#0C141E",
            "tab_inactive_bg": "#172232", "tab_inactive_text": "#788AA2",
            "progress_bg": "#223045", "progress_chunk": "#5BA0F0",
        },
    },
    # ── 🍂 秋日暖调 ──
    "autumn": {
        "light": {
            "primary": "#E8961A", "primary_hover": "#D48514", "primary_pressed": "#BD7510",
            "primary_light": "#FDF3E5", "bg": "#FBF7F2", "bg_alt": "#F5EFE6",
            "surface": "#FFFFFF", "surface_hover": "#FDFAF5", "surface_raised": "#FFFFFF",
            "text": "#1F1810", "text_secondary": "#6B5C48", "text_hint": "#968878",
            "border": "#E8DDD0", "border_focus": "#E8961A", "accent": "#C47A30",
            "success": "#7CB342", "danger": "#D4654A", "warning": "#E8961A",
            "shadow": "rgba(180,130,80,0.08)", "scrollbar_bg": "#F5EFE6", "scrollbar_thumb": "#D8CAB5",
            "tab_active_bg": "#E8961A", "tab_active_text": "#FFFFFF",
            "tab_inactive_bg": "#F5EFE6", "tab_inactive_text": "#7D6E58",
            "progress_bg": "#F0E8DC", "progress_chunk": "#E8961A",
        },
        "dark": {
            "primary": "#E89E30", "primary_hover": "#D48C20", "primary_pressed": "#BD7A18",
            "primary_light": "#2E2010", "bg": "#181008", "bg_alt": "#201810",
            "surface": "#241A10", "surface_hover": "#2C2015", "surface_raised": "#32261A",
            "text": "#EDE4D8", "text_secondary": "#A89880", "text_hint": "#7A6C58",
            "border": "#3A2E20", "border_focus": "#E89E30", "accent": "#6B4226",
            "success": "#7CB342", "danger": "#D4654A", "warning": "#E89E30",
            "shadow": "rgba(0,0,0,0.30)", "scrollbar_bg": "#241A10", "scrollbar_thumb": "#403420",
            "tab_active_bg": "#E89E30", "tab_active_text": "#181008",
            "tab_inactive_bg": "#241A10", "tab_inactive_text": "#8A7A62",
            "progress_bg": "#32261A", "progress_chunk": "#E89E30",
        },
    },
    # ── ❄️ 冬日静谧 ──
    "winter": {
        "light": {
            "primary": "#7A8090", "primary_hover": "#6A7080", "primary_pressed": "#5A6070",
            "primary_light": "#F0F1F4", "bg": "#F5F5F7", "bg_alt": "#EEEEF1",
            "surface": "#FFFFFF", "surface_hover": "#F8F8FA", "surface_raised": "#FFFFFF",
            "text": "#181820", "text_secondary": "#5E606A", "text_hint": "#8A8C95",
            "border": "#E0E1E5", "border_focus": "#8A90A0", "accent": "#A0C8DE",
            "success": "#6BAF6B", "danger": "#D4726E", "warning": "#C8A050",
            "shadow": "rgba(120,128,140,0.06)", "scrollbar_bg": "#EEEEF1", "scrollbar_thumb": "#CCCDD4",
            "tab_active_bg": "#7A8090", "tab_active_text": "#FFFFFF",
            "tab_inactive_bg": "#EEEEF1", "tab_inactive_text": "#6E707A",
            "progress_bg": "#EAEBEE", "progress_chunk": "#7A8090",
        },
        "dark": {
            "primary": "#9095A5", "primary_hover": "#808595", "primary_pressed": "#707585",
            "primary_light": "#1E2128", "bg": "#101216", "bg_alt": "#16181E",
            "surface": "#1A1D24", "surface_hover": "#20232C", "surface_raised": "#262932",
            "text": "#E2E3E8", "text_secondary": "#9A9CA6", "text_hint": "#6E707A",
            "border": "#2E303A", "border_focus": "#9095A5", "accent": "#4A6070",
            "success": "#6BAF6B", "danger": "#D4726E", "warning": "#C8A050",
            "shadow": "rgba(0,0,0,0.30)", "scrollbar_bg": "#1A1D24", "scrollbar_thumb": "#363944",
            "tab_active_bg": "#9095A5", "tab_active_text": "#101216",
            "tab_inactive_bg": "#1A1D24", "tab_inactive_text": "#7C7E88",
            "progress_bg": "#262932", "progress_chunk": "#9095A5",
        },
    },
}


def _qss(tk: dict) -> str:
    p, ph, pp, pl = tk["primary"], tk["primary_hover"], tk["primary_pressed"], tk["primary_light"]
    bg, sf, sfh = tk["bg"], tk["surface"], tk["surface_hover"]
    tx, ts, th = tk["text"], tk["text_secondary"], tk["text_hint"]
    bd, bdf = tk["border"], tk["border_focus"]
    sc, dg = tk["success"], tk["danger"]
    sbg, stb = tk["scrollbar_bg"], tk["scrollbar_thumb"]
    tab, tti, ttx = tk["tab_active_bg"], tk["tab_inactive_bg"], tk["tab_active_text"]

    return f"""
*{{font-family:"Microsoft YaHei","Segoe UI",sans-serif;font-size:13px;color:{tx};}}
QMainWindow{{background:{bg};}}

QScrollBar:vertical{{background:{sbg};width:7px;margin:2px 0;border-radius:3px;}}
QScrollBar::handle:vertical{{background:{stb};min-height:28px;border-radius:3px;}}
QScrollBar::add-line:vertical,QScrollBar::sub-line:vertical{{height:0;}}
QScrollBar:horizontal{{background:{sbg};height:7px;margin:0 2px;border-radius:3px;}}
QScrollBar::handle:horizontal{{background:{stb};min-width:28px;border-radius:3px;}}
QScrollBar::add-line:horizontal,QScrollBar::sub-line:horizontal{{width:0;}}

QTabWidget::pane{{border:1px solid {bd};border-radius:9px;background:{sf};top:-1px;}}
QTabBar::tab{{background:{tti};color:{ts};padding:8px 20px;margin-right:2px;border-top-left-radius:8px;border-top-right-radius:8px;font-size:13px;font-weight:500;}}
QTabBar::tab:selected{{background:{tab};color:{ttx};font-weight:600;}}
QTabBar::tab:hover:!selected{{background:{sfh};color:{tx};}}

QGroupBox{{background:{sf};border:1px solid {bd};border-radius:9px;margin-top:16px;padding:16px 14px 12px 14px;font-weight:600;font-size:12px;color:{ts};}}
QGroupBox::title{{subcontrol-origin:margin;left:14px;padding:0 6px;color:{ts};}}

QPushButton{{background:{sf};border:1px solid {bd};border-radius:6px;padding:6px 16px;color:{tx};font-size:13px;}}
QPushButton:hover{{background:{sfh};border-color:{p};}}
QPushButton:pressed{{background:{bg};}}
QPushButton:disabled{{background:{bg};color:{th};border-color:{bd};}}
QPushButton[cssClass="primary"]{{background:{p};color:white;border:none;font-weight:600;padding:7px 20px;}}
QPushButton[cssClass="primary"]:hover{{background:{ph};}}
QPushButton[cssClass="primary"]:pressed{{background:{pp};}}
QPushButton[cssClass="danger"]{{background:{dg};color:white;border:none;font-weight:600;padding:7px 20px;}}
QPushButton[cssClass="danger"]:hover{{background:#DC2626;}}
QPushButton[cssClass="success"]{{background:{sc};color:white;border:none;font-weight:600;}}
QPushButton[cssClass="success"]:hover{{background:#059669;}}

QLineEdit{{background:{sf};border:1px solid {bd};border-radius:6px;padding:7px 12px;color:{tx};font-size:13px;}}
QLineEdit:focus{{border-color:{bdf};border-width:1.5px;}}
QLineEdit:disabled{{background:{bg};color:{th};}}

QTextEdit{{background:{sf};border:1px solid {bd};border-radius:7px;padding:7px 10px;color:{tx};font-size:12px;}}
QTextEdit:focus{{border-color:{bdf};}}

QCheckBox{{spacing:9px;color:{tx};font-size:13px;padding:3px 0;}}
QCheckBox::indicator{{width:18px;height:18px;border-radius:4px;border:1.5px solid {bd};background:{sf};}}
QCheckBox::indicator:checked{{background:{p};border-color:{p};}}
QCheckBox::indicator:hover{{border-color:{p};}}

QComboBox{{background:{sf};border:1px solid {bd};border-radius:6px;padding:6px 12px;color:{tx};font-size:13px;min-width:100px;}}
QComboBox:hover{{border-color:{p};}}
QComboBox::drop-down{{border:none;width:22px;}}
QComboBox QAbstractItemView{{background:{sf};border:1px solid {bd};border-radius:6px;selection-background-color:{pl};selection-color:{tx};padding:4px;outline:none;}}

QListWidget{{background:{sf};border:1px solid {bd};border-radius:7px;padding:4px;color:{tx};outline:none;}}
QListWidget::item{{padding:7px 10px;border-radius:4px;margin:1px 0;}}
QListWidget::item:selected{{background:{pl};color:{tx};}}
QListWidget::item:hover{{background:{sfh};}}

QProgressBar{{background:{tk["progress_bg"]};border:none;border-radius:5px;height:8px;text-align:center;font-size:11px;color:{tx};}}
QProgressBar::chunk{{background:{p};border-radius:5px;}}

QStatusBar{{background:{sf};border-top:1px solid {bd};color:{ts};padding:3px 12px;font-size:12px;}}
QLabel{{color:{tx};background:transparent;}}
QSplitter::handle{{background:{bd};width:1px;height:1px;}}
QSplitter::handle:hover{{background:{p};}}
"""


# ═══════════════════════════════════════════
# 主题管理器
# ═══════════════════════════════════════════

SEASON_LABELS = {
    "spring": "🌸 春日清新",
    "summer": "☀️ 夏日清爽",
    "autumn": "🍂 秋日暖调",
    "winter": "❄️ 冬日静谧",
}


class ThemeManager(QObject):
    changed = Signal(str, str)  # season, mode

    def __init__(self, season: str = "spring", mode: str = "light"):
        super().__init__()
        self._season = season
        self._mode = mode
        self._tokens = TOKENS[season][mode]

    @property
    def season(self) -> str:
        return self._season

    @property
    def mode(self) -> str:
        return self._mode

    @property
    def tokens(self) -> dict:
        return self._tokens

    def set_season(self, season: str):
        self._season = season
        self._tokens = TOKENS[season][self._mode]

    def set_mode(self, mode: str):
        self._mode = mode
        self._tokens = TOKENS[self._season][mode]

    def toggle_mode(self):
        self._mode = "dark" if self._mode == "light" else "light"
        self._tokens = TOKENS[self._season][self._mode]

    def apply(self, app: QApplication):
        qss = _qss(self._tokens)
        app.setStyleSheet(qss)
        self.changed.emit(self._season, self._mode)

    def apply_season(self, app: QApplication, season: str):
        self.set_season(season)
        self.apply(app)

    def apply_mode(self, app: QApplication, mode: str):
        self.set_mode(mode)
        self.apply(app)
