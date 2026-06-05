import { BrowserWindow } from 'electron'

export interface PetWindowOptions {
  width?: number
  height?: number
  alwaysOnTop?: boolean
}

export class PetWindowManager {
  private window: BrowserWindow | null = null
  
  createWindow(options: PetWindowOptions = {}): BrowserWindow {
    const {
      width = 400,
      height = 600,
      alwaysOnTop = true,
    } = options

    this.window = new BrowserWindow({
      width,
      height,
      frame: false,
      transparent: true,
      alwaysOnTop,
      skipTaskbar: true,
      hasShadow: false,
      focusable: false,
      backgroundColor: '#00000000',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webgl: true,
        backgroundThrottling: false,
        
        preload: require.resolve('../preload/preload'),
      },
    })

    // Windows 特定优化
    if (process.platform === 'win32') {
      this.window.setWindowButtonVisibility(false)
      this.window.setBackgroundColor('#00000000')
    }

    // macOS 特定优化
    if (process.platform === 'darwin') {
      this.window.setVibrancy('fullscreen-ui')
    }

    // 鼠标穿透逻辑
    this.setupMouseThrough()

    return this.window
  }

  private setupMouseThrough() {
    if (!this.window) return

    let isMouseOver = false

    // 鼠标进入窗口
    this.window.on('enter-full-screen', () => {
      isMouseOver = true
      this.window?.setIgnoreMouseEvents(true, { forward: true })
    })

    // 鼠标离开窗口
    this.window.on('leave-html-full-screen', () => {
      isMouseOver = false
      this.window?.setIgnoreMouseEvents(true, { forward: true })
    })

    // 默认穿透
    this.window.setIgnoreMouseEvents(true, { forward: true })
  }

  // 切换透明
  toggleTransparent(): void {
    if (!this.window) return
    // 使用 opacity 实现透明度切换
    const opacity = this.window.getOpacity()
    this.window.setOpacity(opacity > 0.5 ? 0.3 : 1.0)
  }

  // 切换置顶
  toggleAlwaysOnTop(): void {
    if (!this.window) return
    const isOnTop = this.window.isAlwaysOnTop()
    this.window.setAlwaysOnTop(!isOnTop)
  }

  // 切换鼠标穿透
  toggleMouseThrough(): void {
    if (!this.window) return
    // 简单切换穿透状态
    this.window.setIgnoreMouseEvents(true, { forward: true })
  }

  // 隐藏窗口
  hide(): void {
    this.window?.hide()
  }

  // 显示窗口
  show(): void {
    this.window?.show()
  }

  // 销毁窗口
  destroy(): void {
    this.window?.destroy()
    this.window = null
  }

  // 获取窗口实例
  getWindow(): BrowserWindow | null {
    return this.window
  }
}
