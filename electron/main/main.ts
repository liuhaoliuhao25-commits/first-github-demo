import { app, Tray, Menu, BrowserWindow } from 'electron'
import path from 'path'
import { PetWindowManager } from './services/pet-window'
import { ShortcutService } from './services/shortcut'
import { FullScreenDetector } from './services/fullscreen-detector'
import { IpcHandler } from './services/ipc-handler'
import { AIHandler } from './handlers/ai-handler'
import { VoiceHandler } from './handlers/voice-handler'
import { logger } from './services/logger'

let tray: Tray | null = null
let windowManager: PetWindowManager | null = null
let fullscreenDetector: FullScreenDetector | null = null
let aiHandler: AIHandler | null = null
let voiceHandler: VoiceHandler | null = null

const isDev = process.env.NODE_ENV === 'development'

function createPetWindow() {
  logger.info('Creating pet window')
  
  windowManager = new PetWindowManager()
  const win = windowManager.createWindow({
    width: 400,
    height: 600,
    alwaysOnTop: true,
  })

  // 加载页面
  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
    logger.info('Loaded in development mode')
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
    logger.info('Loaded in production mode')
  }

  // 窗口事件
  win.on('ready-to-show', () => {
    logger.info('Window ready to show')
  })

  win.on('closed', () => {
    logger.info('Window closed')
    windowManager = null
  })

  return win
}

function createTray() {
  try {
    const trayPath = path.join(__dirname, '../resources/icon.png')
    tray = new Tray(trayPath)

    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示/隐藏',
        click: () => {
          const win = windowManager?.getWindow()
          if (win?.isVisible()) {
            windowManager?.hide()
            logger.info('Hide pet window')
          } else {
            windowManager?.show()
            logger.info('Show pet window')
          }
        },
      },
      {
        label: '设置',
        click: () => {
          logger.info('Open settings')
          windowManager?.getWindow()?.webContents.send('open-settings')
        },
      },
      { type: 'separator' },
      {
        label: '检查更新',
        click: () => {
          logger.info('Check update')
          windowManager?.getWindow()?.webContents.send('check-update')
        },
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          logger.info('Application quit')
          app.quit()
        },
      },
    ])

    tray.setToolTip('独有桌宠')
    tray.setContextMenu(contextMenu)

    logger.info('Tray created successfully')
  } catch (error) {
    logger.error('Failed to create tray', error)
  }
}

function setupServices() {
  if (!windowManager) return

  logger.info('Setting up services')

  // 注册 IPC 处理器
  const ipcHandler = new IpcHandler(windowManager)
  ipcHandler.registerHandlers()

  // 初始化 AI 服务
  aiHandler = new AIHandler(windowManager.getWindow())
  aiHandler.initialize().catch((err) => {
    logger.error('Failed to initialize AI handler', err)
  })

  // 初始化语音服务
  voiceHandler = new VoiceHandler(windowManager.getWindow())
  voiceHandler.initialize().catch((err) => {
    logger.error('Failed to initialize voice handler', err)
  })

  // 注册快捷键
  const shortcutService = new ShortcutService(windowManager)
  shortcutService.registerAll()
  logger.info('Shortcuts registered')

  // 启动全屏检测
  fullscreenDetector = new FullScreenDetector(windowManager)
  fullscreenDetector.startMonitoring((isFullScreen) => {
    logger.debug('Full screen state changed', { isFullScreen })
  })
}

app.whenReady().then(() => {
  logger.info('Application ready')
  createPetWindow()
  createTray()
  setupServices()
})

// 清理服务
app.on('will-quit', () => {
  logger.info('Application quitting')
  aiHandler?.dispose()
  voiceHandler?.dispose()
  fullscreenDetector?.stopMonitoring()
  tray?.destroy()
  windowManager?.destroy()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    logger.info('All windows closed, quitting')
    app.quit()
  }
})

app.on('activate', () => {
  logger.info('Activate')
  if (windowManager?.getWindow() === null) {
    createPetWindow()
    setupServices()
  }
})

// 全局错误处理
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise })
})
