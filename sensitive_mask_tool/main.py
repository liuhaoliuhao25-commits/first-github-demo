"""敏感信息打码工具 — 主入口"""
import sys
import os

from PySide6.QtWidgets import QApplication
from PySide6.QtCore import Qt

from ui.main_window import MainWindow


def _create_shortcut_once():
    """首次启动时在桌面创建快捷方式。"""
    try:
        # 标记文件：创建后写入，下次跳过
        import tempfile
        marker = os.path.join(tempfile.gettempdir(), ".sensitive_mask_tool_shortcut_done")
        if os.path.exists(marker):
            return

        from utils.shortcut import create_desktop_shortcut
        exe_path = sys.executable
        # 如果是打包的exe，sys.executable就是exe自身
        create_desktop_shortcut(exe_path, "敏感信息打码工具")
        # 写入标记
        with open(marker, "w") as f:
            f.write("1")
    except Exception:
        pass  # 快捷方式创建失败不影响主功能


def main():
    _create_shortcut_once()

    # 高DPI支持
    QApplication.setHighDpiScaleFactorRoundingPolicy(
        Qt.HighDpiScaleFactorRoundingPolicy.PassThrough
    )
    app = QApplication(sys.argv)
    app.setApplicationName("敏感信息打码工具")

    # 样式
    app.setStyleSheet("""
        QMainWindow { background-color: #f5f5f5; }
        QTabWidget::pane { border: 1px solid #ccc; background: white; }
        QTabBar::tab { padding: 8px 20px; font-size: 14px; }
        QTabBar::tab:selected { background: #0078d4; color: white; }
        QGroupBox { font-weight: bold; border: 1px solid #ddd; border-radius: 6px; margin-top: 10px; padding-top: 16px; }
        QGroupBox::title { subcontrol-origin: margin; left: 12px; padding: 0 6px; }
        QPushButton { padding: 6px 16px; border-radius: 4px; }
        QPushButton:hover { background: #e0e0e0; }
        QListWidget { border: 1px solid #ccc; border-radius: 4px; }
    """)

    window = MainWindow()
    window.show()

    sys.exit(app.exec())


if __name__ == "__main__":
    main()
