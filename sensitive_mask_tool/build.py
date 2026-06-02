"""PyInstaller 打包脚本 — 单文件 Windows EXE"""
import os
import sys
import subprocess

# Fix Windows console encoding
os.environ.setdefault("PYTHONIOENCODING", "utf-8")
os.environ.setdefault("PYTHONLEGACYWINDOWSSTDIO", "utf-8")


def build():
    project_dir = os.path.dirname(os.path.abspath(__file__))
    main_py = os.path.join(project_dir, "main.py")
    dist_dir = os.path.join(project_dir, "dist")

    # 确保在项目目录运行
    os.chdir(project_dir)

    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--onefile",
        "--windowed",
        "--name", "敏感信息打码工具",
        "--clean",
        "--noconfirm",
        # 隐藏导入
        "--hidden-import", "fitz",
        "--hidden-import", "cv2",
        "--hidden-import", "PIL",
        "--hidden-import", "PIL._imagingtk",
        "--hidden-import", "PIL._tkinter_finder",
        "--hidden-import", "numpy",
        "--hidden-import", "PySide6.QtCore",
        "--hidden-import", "PySide6.QtGui",
        "--hidden-import", "PySide6.QtWidgets",
        # 收集数据
        "--collect-all", "fitz",
        # 输出
        "--distpath", dist_dir,
        main_py,
    ]

    print("[BUILD] Starting PyInstaller...")
    result = subprocess.run(
        cmd, cwd=project_dir,
        encoding="utf-8", errors="replace"
    )
    if result.returncode == 0:
        exe_path = os.path.join(dist_dir, "敏感信息打码工具.exe")
        if os.path.exists(exe_path):
            size_mb = os.path.getsize(exe_path) / (1024 * 1024)
            print(f"\n[BUILD] Success!")
            print(f"   EXE: {exe_path}")
            print(f"   Size: {size_mb:.1f} MB")
        else:
            print("\n[BUILD] Warning: Build completed but exe not found in dist/")
    else:
        print(f"\n[BUILD] Failed, exit code: {result.returncode}")
        sys.exit(result.returncode)


if __name__ == "__main__":
    build()
