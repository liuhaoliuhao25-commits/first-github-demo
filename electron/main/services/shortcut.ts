import { globalShortcut, BrowserWindow } from 'electron'
import { PetWindowManager } from './pet-window'

export class ShortcutService {
  private windowManager: PetWindowManager

  constructor(windowManager: PetWindowManager) {
    this.windowManager = windowManager
  }

  registerAll(): void {
    // Ctrl+Shift+T: 切换透明
    globalShortcut.register('CommandOrControl+Shift+T', () => {
      this.windowManager.toggleTransparent()
      console.log('Toggle transparent')
    })

    // Ctrl+Shift+O: 切换置顶
    globalShortcut.register('CommandOrControl+Shift+O', () => {
      this.windowManager.toggleAlwaysOnTop()
      console.log('Toggle always on top')
    })

    // Ctrl+Shift+P: 切换鼠标穿透
    globalShortcut.register('CommandOrControl+Shift+P', () => {
      this.windowManager.toggleMouseThrough()
      console.log('Toggle mouse through')
    })

    // Ctrl+Shift+H: 隐藏/显示
    globalShortcut.register('CommandOrControl+Shift+H', () => {
      const win = this.windowManager.getWindow()
      if (win?.isVisible()) {
        this.windowManager.hide()
      } else {
        this.windowManager.show()
      }
      console.log('Toggle visibility')
    })
  }

  unregisterAll(): void {
    globalShortcut.unregisterAll()
  }
}
