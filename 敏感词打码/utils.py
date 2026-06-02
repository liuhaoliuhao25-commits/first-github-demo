"""工具函数合集"""
import os
import subprocess
from typing import List, Tuple

# ── 文件分类 ──

def classify(paths: List[str]) -> Tuple[List[str], List[str]]:
    pdfs, imgs = [], []
    pdf_exts = {".pdf"}
    img_exts = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif"}
    for p in paths:
        ext = os.path.splitext(p)[1].lower()
        if ext in pdf_exts:
            pdfs.append(p)
        elif ext in img_exts:
            imgs.append(p)
    return pdfs, imgs

# ── 桌面快捷方式 ──

def desktop_shortcut(target: str, name: str = "敏感词打码"):
    desktop = os.path.join(os.environ["USERPROFILE"], "Desktop")
    lnk = os.path.join(desktop, f"{name}.lnk")
    if os.path.exists(lnk):
        return
    try:
        import pythoncom
        from win32com.client import Dispatch
        shell = Dispatch("WScript.Shell")
        sc = shell.CreateShortcut(lnk)
        sc.TargetPath = target
        sc.WorkingDirectory = os.path.dirname(target)
        sc.IconLocation = target
        sc.save()
    except ImportError:
        ps = f"""
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("{lnk}")
$Shortcut.TargetPath = "{target}"
$Shortcut.WorkingDirectory = "{os.path.dirname(target)}"
$Shortcut.Save()
"""
        subprocess.run(["powershell", "-Command", ps], capture_output=True)
