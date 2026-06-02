"""PyInstaller 打包 — 单文件 EXE"""
import os, sys, subprocess
os.environ.setdefault("PYTHONIOENCODING", "utf-8")

def build():
    root = os.path.dirname(os.path.abspath(__file__))
    main_py = os.path.join(root, "main.py")
    icon = os.path.join(root, "app_icon.ico")
    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--onefile", "--windowed", "--clean", "--noconfirm",
        "--name", "敏感词打码",
        f"--icon={icon}",
        "--hidden-import", "fitz",
        "--hidden-import", "cv2",
        "--hidden-import", "PIL",
        "--hidden-import", "numpy",
        "--hidden-import", "PySide6.QtCore",
        "--hidden-import", "PySide6.QtGui",
        "--hidden-import", "PySide6.QtWidgets",
        "--collect-all", "fitz",
        "--distpath", os.path.join(root, "dist"),
        main_py,
    ]
    print("[BUILD] Starting...")
    r = subprocess.run(cmd, cwd=root, encoding="utf-8", errors="replace")
    if r.returncode == 0:
        exe = os.path.join(root, "dist", "敏感词打码.exe")
        if os.path.exists(exe):
            print(f"\n[BUILD] SUCCESS: {exe}")
            print(f"[BUILD] Size: {os.path.getsize(exe)/1024/1024:.1f} MB")
        else:
            print("\n[BUILD] WARNING: exe not found")
    else:
        print(f"\n[BUILD] FAILED: {r.returncode}")
        sys.exit(r.returncode)

if __name__ == "__main__":
    build()
