"""敏感词打码 — 主入口"""
import sys, os, tempfile
from PySide6.QtWidgets import QApplication
from PySide6.QtCore import Qt
from ui.theme import ThemeManager
from ui.main_window import MainWindow
from utils import desktop_shortcut


def main():
    _shortcut_once()

    QApplication.setHighDpiScaleFactorRoundingPolicy(
        Qt.HighDpiScaleFactorRoundingPolicy.PassThrough
    )
    app = QApplication(sys.argv)
    app.setApplicationName("敏感词打码")

    # 主题管理器 — 默认春日浅色
    theme = ThemeManager(season="spring", mode="light")
    theme.apply(app)

    w = MainWindow(theme)
    w.show()

    sys.exit(app.exec())


def _shortcut_once():
    marker = os.path.join(tempfile.gettempdir(), ".maci_shortcut_done")
    if os.path.exists(marker):
        return
    try:
        desktop_shortcut(sys.executable, "敏感词打码")
        with open(marker, "w") as f:
            f.write("1")
    except Exception:
        pass


if __name__ == "__main__":
    main()
