import { ipcMain, BrowserWindow } from 'electron'
import { PetWindowManager } from './pet-window'

export class IpcHandler {
  private windowManager: PetWindowManager

  constructor(windowManager: PetWindowManager) {
    this.windowManager = windowManager
  }

  registerHandlers(): void {
    // 窗口控制
    ipcMain.on('window-control', (event, action: string) => {
      this.handleWindowControl(action)
    })

    // 打开设置
    ipcMain.on('open-settings', () => {
      const win = this.windowManager.getWindow()
      win?.webContents.send('open-settings')
    })

    // 检查更新
    ipcMain.on('check-update', () => {
      const win = this.windowManager.getWindow()
      win?.webContents.send('check-update')
    })
  }

  private handleWindowControl(action: string): void {
    switch (action) {
      case 'toggle-transparent':
        this.windowManager.toggleTransparent()
        break

      case 'toggle-ontop':
        this.windowManager.toggleAlwaysOnTop()
        break

      case 'toggle-mouse-through':
        this.windowManager.toggleMouseThrough()
        break

      case 'hide':
        this.windowManager.hide()
        break

      case 'show':
        this.windowManager.show()
        break

      default:
        console.warn('Unknown window control action:', action)
    }
  }

  unregisterHandlers(): void {
    ipcMain.removeAllListeners('window-control')
    ipcMain.removeAllListeners('open-settings')
    ipcMain.removeAllListeners('check-update')
  }
}
