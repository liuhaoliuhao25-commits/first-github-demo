"""PDF批量打码标签页 — 现代化UI"""
import os
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLabel,
    QListWidget, QListWidgetItem, QComboBox, QLineEdit,
    QFileDialog, QProgressBar, QMessageBox, QSplitter,
    QGroupBox, QAbstractItemView, QFrame,
)
from PySide6.QtCore import Qt, QThread, Signal
from PySide6.QtGui import QDragEnterEvent, QDropEvent, QColor

from engine.detector import Detector
from engine.pdf_engine import PDFEngine
from ui.previewer import Previewer
from ui.rules_panel import RulesPanel
from ui.theme import ThemeManager
from ui.effects import card_shadow

MODES = {"纯黑块遮挡": "black", "高斯模糊": "blur", "星号*掩码": "asterisk"}


class PDFWorker(QThread):
    progress = Signal(int, int, str)
    done = Signal(list)
    error = Signal(str)

    def __init__(self, files, out_dir, mode, config):
        super().__init__()
        self.files = files; self.out_dir = out_dir
        self.mode = mode; self.config = config

    def run(self):
        try:
            d = Detector(self.config["rules"], self.config["keywords"])
            eng = PDFEngine(d, self.mode)
            r = eng.batch(self.files, self.out_dir, lambda c, t, m: self.progress.emit(c, t, m))
            self.done.emit(r)
        except Exception as e:
            self.error.emit(str(e))


class PDFTab(QWidget):
    def __init__(self, rules: RulesPanel, theme: ThemeManager):
        super().__init__()
        self.rules = rules; self._theme = theme
        self.files = []; self.out_dir = ""; self.worker = None
        self._build(); self._wire()

    def _build(self):
        lo = QVBoxLayout(self); lo.setSpacing(8); lo.setContentsMargins(4, 8, 4, 4)

        # ── 工具栏 ──
        tb = QHBoxLayout(); tb.setSpacing(8)
        self.btn_import = QPushButton("📥  导入PDF文件")
        self.btn_import.setProperty("cssClass", "primary")
        tb.addWidget(self.btn_import)
        self.btn_folder = QPushButton("📂  导入文件夹")
        tb.addWidget(self.btn_folder)
        self.btn_clear = QPushButton("🗑️  清空列表")
        tb.addWidget(self.btn_clear); tb.addStretch()
        tb.addWidget(QLabel("打码模式"))
        self.combo = QComboBox()
        self.combo.addItems(list(MODES.keys()))
        self.combo.setFixedWidth(130)
        tb.addWidget(self.combo)
        lo.addLayout(tb)

        # ── 文件列表 + 预览 ──
        split = QSplitter(Qt.Vertical); split.setHandleWidth(3)

        g1 = QGroupBox("📋  文件列表")
        g1.setStyleSheet(f"QGroupBox{{font-size:12px;}}")
        l1 = QVBoxLayout(g1)
        self.list_w = QListWidget()
        self.list_w.setSelectionMode(QAbstractItemView.ExtendedSelection)
        self.list_w.setAcceptDrops(True); self.list_w.setMinimumHeight(90)
        self.list_w.setAlternatingRowColors(True)
        l1.addWidget(self.list_w)
        self.lbl_cnt = QLabel("拖拽文件到此处或点击导入")
        self.lbl_cnt.setStyleSheet(f"color:{self._theme.tokens['text_hint']};font-size:11px;")
        l1.addWidget(self.lbl_cnt)
        split.addWidget(g1)

        g2 = QGroupBox("👁️  预览区")
        g2.setStyleSheet(f"QGroupBox{{font-size:12px;}}")
        l2 = QVBoxLayout(g2)
        self.preview = Previewer(self._theme)
        l2.addWidget(self.preview)
        split.addWidget(g2)
        split.setStretchFactor(0, 1); split.setStretchFactor(1, 3)
        lo.addWidget(split)

        # ── 底部 ──
        bo = QVBoxLayout(); bo.setSpacing(6)
        r1 = QHBoxLayout(); r1.setSpacing(8)
        r1.addWidget(QLabel("输出目录"))
        self.edit_out = QLineEdit()
        self.edit_out.setPlaceholderText("选择或输入目录...")
        r1.addWidget(self.edit_out, stretch=1)
        self.btn_out = QPushButton("📁  选择")
        r1.addWidget(self.btn_out)
        bo.addLayout(r1)

        self.prog = QProgressBar(); self.prog.setVisible(False)
        self.prog.setFixedHeight(8)
        bo.addWidget(self.prog)

        self.lbl_status = QLabel("")
        self.lbl_status.setStyleSheet(f"color:{self._theme.tokens['text_secondary']};font-size:12px;")
        bo.addWidget(self.lbl_status)

        r2 = QHBoxLayout(); r2.addStretch()
        self.btn_preview = QPushButton("👁️  预览打码效果")
        self.btn_preview.setProperty("cssClass", "success")
        r2.addWidget(self.btn_preview)
        r2.addSpacing(8)
        self.btn_go = QPushButton("🚀  批量导出打码PDF")
        self.btn_go.setProperty("cssClass", "danger")
        r2.addWidget(self.btn_go)
        bo.addLayout(r2)
        lo.addLayout(bo)

    def _wire(self):
        self.btn_import.clicked.connect(lambda: self._add_files(
            QFileDialog.getOpenFileNames(self, "选择PDF", "", "PDF (*.pdf)")[0]))
        self.btn_folder.clicked.connect(self._import_folder)
        self.btn_clear.clicked.connect(self._clear)
        self.btn_out.clicked.connect(lambda: self._set_out(QFileDialog.getExistingDirectory(self, "输出目录")))
        self.btn_preview.clicked.connect(self._preview)
        self.btn_go.clicked.connect(self._run)
        self.list_w.itemDoubleClicked.connect(lambda: self._preview())
        self.list_w.dragEnterEvent = lambda e: e.acceptProposedAction() if e.mimeData().hasUrls() else None
        self.list_w.dropEvent = self._drop

    def _add_files(self, files):
        for fp in files:
            if fp not in self.files:
                self.files.append(fp)
                self.list_w.addItem(os.path.basename(fp))
        self.lbl_cnt.setText(f"已导入 {len(self.files)} 个PDF文件")

    def _import_folder(self):
        d = QFileDialog.getExistingDirectory(self, "选择文件夹")
        if d:
            found = []
            for root, _, files in os.walk(d):
                for f in files:
                    if f.lower().endswith('.pdf'):
                        found.append(os.path.join(root, f))
            self._add_files(found)

    def _clear(self):
        self.files.clear(); self.list_w.clear()
        self.lbl_cnt.setText("拖拽文件到此处或点击导入"); self.preview.clear()

    def _drop(self, e: QDropEvent):
        found = []
        for u in e.mimeData().urls():
            p = u.toLocalFile()
            if os.path.isdir(p):
                for root, _, files in os.walk(p):
                    for f in files:
                        if f.lower().endswith('.pdf'):
                            found.append(os.path.join(root, f))
            elif p.lower().endswith('.pdf'):
                found.append(p)
        self._add_files(found)
        e.acceptProposedAction()

    def _set_out(self, d):
        if d: self.out_dir = d; self.edit_out.setText(d)

    def _preview(self):
        sel = self.list_w.selectedItems()
        if not sel: return QMessageBox.information(self, "提示", "请选中一个文件")
        idx = self.list_w.row(sel[0])
        if idx >= len(self.files): return
        cfg = self.rules.config()
        eng = PDFEngine(Detector(cfg["rules"], cfg["keywords"]), MODES[self.combo.currentText()])
        self.preview.show_orig(eng.preview(self.files[idx], 0, False))
        self.preview.show_mask(eng.preview(self.files[idx], 0, True))

    def _run(self):
        if not self.files: return QMessageBox.warning(self, "警告", "请先导入PDF文件")
        out = self.edit_out.text().strip() or self._default_out()
        cfg = self.rules.config()
        if not cfg["rules"] and not cfg["keywords"]:
            return QMessageBox.warning(self, "警告", "请至少勾选一项敏感规则")
        self._enable(False)
        self.prog.setVisible(True); self.prog.setMaximum(len(self.files)); self.prog.setValue(0)
        self.worker = PDFWorker(self.files, out, MODES[self.combo.currentText()], cfg)
        self.worker.progress.connect(lambda c, t, m: (self.prog.setValue(c), self.lbl_status.setText(m)))
        self.worker.done.connect(self._done)
        self.worker.error.connect(lambda e: (self._enable(True), QMessageBox.critical(self, "错误", e)))
        self.worker.start()

    def _done(self, results):
        self._enable(True); self.prog.setVisible(False)
        self.lbl_status.setText(f"✅ 完成：{len(results)}/{len(self.files)} → {self.out_dir}")
        QMessageBox.information(self, "完成", f"批量打码完成！\n\n成功: {len(results)}/{len(self.files)}\n输出: {self.out_dir}")

    def _default_out(self):
        d = os.path.join(os.environ.get("USERPROFILE", ""), "Desktop", "打码输出")
        os.makedirs(d, exist_ok=True); self.edit_out.setText(d); return d

    def _enable(self, on):
        for w in [self.btn_import, self.btn_folder, self.btn_clear, self.btn_preview, self.btn_go, self.combo, self.edit_out, self.btn_out]:
            w.setEnabled(on)
