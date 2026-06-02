"""PDF 批量打码标签页"""
import os
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLabel,
    QListWidget, QListWidgetItem, QComboBox, QLineEdit,
    QFileDialog, QProgressBar, QMessageBox, QSplitter, QGroupBox,
    QAbstractItemView,
)
from PySide6.QtCore import Qt, QThread, Signal, QTimer
from PySide6.QtGui import QDragEnterEvent, QDropEvent

from core.detectors import SensitiveDetector
from core.pdf_processor import PDFProcessor
from ui.preview_widget import PreviewWidget
from ui.rules_panel import RulesPanel


# ── 后台处理线程 ──────────────────────────────────────

class PDFProcessThread(QThread):
    """后台PDF处理线程，避免阻塞UI。"""
    progress = Signal(int, int, str)   # current, total, message
    finished = Signal(list)             # output file paths
    error = Signal(str)

    def __init__(self, file_list, output_dir, mask_mode, rules_config):
        super().__init__()
        self.file_list = file_list
        self.output_dir = output_dir
        self.mask_mode = mask_mode
        self.rules_config = rules_config

    def run(self):
        try:
            detector = SensitiveDetector(
                enabled_rules=self.rules_config.get("enabled_rules", []),
                custom_keywords=self.rules_config.get("custom_keywords", []),
            )
            processor = PDFProcessor(detector, mask_mode=self.mask_mode)
            results = processor.process_batch(
                self.file_list,
                self.output_dir,
                progress_callback=lambda c, t, m: self.progress.emit(c, t, m),
            )
            self.finished.emit(results)
        except Exception as e:
            self.error.emit(str(e))


# ── PDF 标签页 ────────────────────────────────────────

class PDFTab(QWidget):
    def __init__(self, rules_panel: RulesPanel):
        super().__init__()
        self.rules_panel = rules_panel
        self.files: list = []
        self.output_dir: str = ""
        self.worker: PDFProcessThread | None = None
        self._build_ui()
        self._connect_signals()

    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setSpacing(6)

        # ── 工具栏 ──
        toolbar = QHBoxLayout()

        self.btn_import = QPushButton("📥 导入PDF")
        self.btn_import.setStyleSheet("background: #0078d4; color: white; font-weight: bold;")
        toolbar.addWidget(self.btn_import)

        self.btn_clear = QPushButton("🗑️ 清空列表")
        toolbar.addWidget(self.btn_clear)

        toolbar.addStretch()

        toolbar.addWidget(QLabel("打码模式："))
        self.combo_mode = QComboBox()
        self.combo_mode.addItems(["纯黑块遮挡", "高斯模糊", "星号*掩码"])
        self.combo_mode.setCurrentIndex(0)
        toolbar.addWidget(self.combo_mode)

        layout.addLayout(toolbar)

        # ── 文件列表 + 预览 分割区 ──
        splitter = QSplitter(Qt.Vertical)

        # 文件列表区
        list_group = QGroupBox("📋 文件列表（支持拖拽导入）")
        list_layout = QVBoxLayout(list_group)

        self.file_list = QListWidget()
        self.file_list.setSelectionMode(QAbstractItemView.ExtendedSelection)
        self.file_list.setAcceptDrops(True)
        self.file_list.setDragEnabled(False)
        self.file_list.setMinimumHeight(120)
        list_layout.addWidget(self.file_list)

        self.lbl_count = QLabel("已导入 0 个文件")
        self.lbl_count.setStyleSheet("color: #666;")
        list_layout.addWidget(self.lbl_count)

        splitter.addWidget(list_group)

        # 预览区
        preview_group = QGroupBox("👁️ 预览区（选中文件后显示）")
        preview_layout = QVBoxLayout(preview_group)
        self.preview = PreviewWidget()
        preview_layout.addWidget(self.preview)
        splitter.addWidget(preview_group)

        splitter.setStretchFactor(0, 1)
        splitter.setStretchFactor(1, 3)
        layout.addWidget(splitter)

        # ── 底部：输出目录 + 进度 + 按钮 ──
        bottom = QVBoxLayout()

        out_row = QHBoxLayout()
        out_row.addWidget(QLabel("输出目录："))
        self.edit_output = QLineEdit()
        self.edit_output.setPlaceholderText("选择或输入输出目录...")
        out_row.addWidget(self.edit_output)

        self.btn_output = QPushButton("📁 选择")
        out_row.addWidget(self.btn_output)
        bottom.addLayout(out_row)

        self.progress_bar = QProgressBar()
        self.progress_bar.setVisible(False)
        bottom.addWidget(self.progress_bar)

        self.lbl_status = QLabel("")
        self.lbl_status.setStyleSheet("color: #888;")
        bottom.addWidget(self.lbl_status)

        btn_row = QHBoxLayout()
        btn_row.addStretch()

        self.btn_preview = QPushButton("👁️ 预览打码效果")
        self.btn_preview.setStyleSheet("padding: 8px 24px;")
        btn_row.addWidget(self.btn_preview)

        self.btn_process = QPushButton("🚀 批量导出打码PDF")
        self.btn_process.setStyleSheet(
            "background: #d32f2f; color: white; font-weight: bold; padding: 8px 24px;"
        )
        btn_row.addWidget(self.btn_process)
        bottom.addLayout(btn_row)

        layout.addLayout(bottom)

    # ── 信号连接 ───────────────────────────────────────

    def _connect_signals(self):
        self.btn_import.clicked.connect(self._import_files)
        self.btn_clear.clicked.connect(self._clear_files)
        self.btn_output.clicked.connect(self._select_output_dir)
        self.btn_preview.clicked.connect(self._preview_selected)
        self.btn_process.clicked.connect(self._batch_process)

        # 双击文件列表项 → 预览
        self.file_list.itemDoubleClicked.connect(lambda: self._preview_selected())

        # 拖拽事件
        self.file_list.dragEnterEvent = self._drag_enter
        self.file_list.dropEvent = self._drop_event

    # ── 文件管理 ───────────────────────────────────────

    def _import_files(self):
        files, _ = QFileDialog.getOpenFileNames(
            self, "选择PDF文件", "",
            "PDF文件 (*.pdf);;所有文件 (*.*)"
        )
        if files:
            self._add_files(files)

    def _add_files(self, files: list):
        added = 0
        for fp in files:
            if fp not in self.files:
                self.files.append(fp)
                item = QListWidgetItem(os.path.basename(fp))
                item.setToolTip(fp)
                self.file_list.addItem(item)
                added += 1
        self.lbl_count.setText(f"已导入 {len(self.files)} 个文件")

    def _clear_files(self):
        self.files.clear()
        self.file_list.clear()
        self.lbl_count.setText("已导入 0 个文件")
        self.preview.clear()

    def _drag_enter(self, event: QDragEnterEvent):
        if event.mimeData().hasUrls():
            event.acceptProposedAction()

    def _drop_event(self, event: QDropEvent):
        urls = event.mimeData().urls()
        files = [url.toLocalFile() for url in urls if url.toLocalFile().lower().endswith(".pdf")]
        if files:
            self._add_files(files)
        event.acceptProposedAction()

    # ── 输出目录 ───────────────────────────────────────

    def _select_output_dir(self):
        d = QFileDialog.getExistingDirectory(self, "选择输出目录")
        if d:
            self.output_dir = d
            self.edit_output.setText(d)

    # ── 预览 ───────────────────────────────────────────

    def _preview_selected(self):
        """预览选中的第一个PDF文件（原图 vs 打码效果）。"""
        selected = self.file_list.selectedItems()
        if not selected:
            QMessageBox.information(self, "提示", "请先在文件列表中选中一个PDF文件。")
            return

        idx = self.file_list.row(selected[0])
        if idx >= len(self.files):
            return
        fp = self.files[idx]

        config = self.rules_panel.get_config()
        detector = SensitiveDetector(
            enabled_rules=config["enabled_rules"],
            custom_keywords=config["custom_keywords"],
        )
        mask_mode = self._get_mask_mode()

        processor = PDFProcessor(detector, mask_mode)

        # 显示原始图
        original = processor.preview_page_image(fp, 0, with_mask=False)
        if original is not None:
            self.preview.show_original(original)
        else:
            self.preview.original_label.setText("无法加载预览")

        # 显示打码图
        masked = processor.preview_page_image(fp, 0, with_mask=True)
        if masked is not None:
            self.preview.show_masked(masked)
        else:
            self.preview.masked_label.setText("打码失败")

    # ── 批量处理 ───────────────────────────────────────

    def _batch_process(self):
        if not self.files:
            QMessageBox.warning(self, "警告", "请先导入PDF文件。")
            return

        output_dir = self.edit_output.text().strip() or self._default_output_dir()
        if not output_dir:
            QMessageBox.warning(self, "警告", "请选择输出目录。")
            return
        self.output_dir = output_dir

        mask_mode = self._get_mask_mode()
        config = self.rules_panel.get_config()

        if not config["enabled_rules"] and not config["custom_keywords"]:
            QMessageBox.warning(self, "警告", "请至少在左侧规则面板勾选一项敏感规则或输入自定义关键词。")
            return

        # 禁用UI
        self._set_ui_enabled(False)
        self.progress_bar.setVisible(True)
        self.progress_bar.setMaximum(len(self.files))
        self.progress_bar.setValue(0)

        self.worker = PDFProcessThread(self.files, output_dir, mask_mode, config)
        self.worker.progress.connect(self._on_progress)
        self.worker.finished.connect(self._on_finished)
        self.worker.error.connect(self._on_error)
        self.worker.start()

    def _on_progress(self, current: int, total: int, msg: str):
        self.progress_bar.setValue(current)
        self.lbl_status.setText(msg)

    def _on_finished(self, results: list):
        self._set_ui_enabled(True)
        self.progress_bar.setVisible(False)
        self.lbl_status.setText(f"✅ 批量处理完成！共导出 {len(results)} 个文件到：{self.output_dir}")
        QMessageBox.information(
            self, "完成",
            f"批量打码完成！\n\n成功处理 {len(results)}/{len(self.files)} 个文件\n输出目录：{self.output_dir}"
        )

    def _on_error(self, err: str):
        self._set_ui_enabled(True)
        self.progress_bar.setVisible(False)
        self.lbl_status.setText(f"❌ 错误: {err}")
        QMessageBox.critical(self, "错误", f"处理失败：{err}")

    # ── 辅助方法 ───────────────────────────────────────

    def _get_mask_mode(self) -> str:
        idx = self.combo_mode.currentIndex()
        modes = ["black", "blur", "asterisk"]
        return modes[idx]

    def _default_output_dir(self) -> str:
        desktop = os.path.join(os.environ.get("USERPROFILE", ""), "Desktop")
        out = os.path.join(desktop, "打码输出")
        os.makedirs(out, exist_ok=True)
        self.edit_output.setText(out)
        return out

    def _set_ui_enabled(self, enabled: bool):
        self.btn_import.setEnabled(enabled)
        self.btn_clear.setEnabled(enabled)
        self.btn_preview.setEnabled(enabled)
        self.btn_process.setEnabled(enabled)
        self.combo_mode.setEnabled(enabled)
        self.edit_output.setEnabled(enabled)
        self.btn_output.setEnabled(enabled)
