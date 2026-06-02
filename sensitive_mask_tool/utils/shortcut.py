"""桌面快捷方式 — Windows .lnk 创建"""


def create_desktop_shortcut(target_exe: str, shortcut_name: str = "敏感信息打码工具"):
    """在用户桌面创建快捷方式"""
    import os
    try:
        import pythoncom
        from win32com.client import Dispatch
    except ImportError:
        # 回退方案：使用 PowerShell
        _create_shortcut_ps(target_exe, shortcut_name)
        return

    desktop = os.path.join(os.environ["USERPROFILE"], "Desktop")
    shortcut_path = os.path.join(desktop, f"{shortcut_name}.lnk")

    if os.path.exists(shortcut_path):
        return  # 已存在

    shell = Dispatch("WScript.Shell")
    shortcut = shell.CreateShortcut(shortcut_path)
    shortcut.TargetPath = target_exe
    shortcut.WorkingDirectory = os.path.dirname(target_exe)
    shortcut.IconLocation = target_exe
    shortcut.save()


def _create_shortcut_ps(target_exe: str, shortcut_name: str):
    import os
    import subprocess
    desktop = os.path.join(os.environ["USERPROFILE"], "Desktop")
    shortcut_path = os.path.join(desktop, f"{shortcut_name}.lnk")
    if os.path.exists(shortcut_path):
        return
    ps = f'''
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("{shortcut_path}")
$Shortcut.TargetPath = "{target_exe}"
$Shortcut.WorkingDirectory = "{os.path.dirname(target_exe)}"
$Shortcut.Save()
'''
    subprocess.run(["powershell", "-Command", ps], capture_output=True)
