import { BrowserWindow, screen } from 'electron'

export class FullScreenDetector {
  private checkInterval: NodeJS.Timeout | null = null
  private lastFullScreenState: boolean = false
  private onFullScreenChange?: (isFullScreen: boolean) => void

  constructor(private windowManager: PetWindowManager) {}

  startMonitoring(callback: (isFullScreen: boolean) => void): void {
    this.onFullScreenChange = callback
    this.checkInterval = setInterval(() => {
      this.checkFullScreen()
    }, 2000) // 每 2 秒检测一次
  }

  private checkFullScreen(): void {
    const focusedWindow = BrowserWindow.getFocusedWindow()
    const isFullScreen = focusedWindow?.isFullScreen() ?? false

    if (isFullScreen !== this.lastFullScreenState) {
      this.lastFullScreenState = isFullScreen
      this.onFullScreenChange?.(isFullScreen)

      if (isFullScreen) {
        // 全屏时临时禁用置顶
        const petWindow = this.windowManager.getWindow()
        petWindow?.setAlwaysOnTop(false)
        console.log('Full screen detected, disabled always on top')
      } else {
        // 退出全屏时恢复置顶
        const petWindow = this.windowManager.getWindow()
        petWindow?.setAlwaysOnTop(true)
        console.log('Exit full screen, restored always on top')
      }
    }
  }

  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }
}
