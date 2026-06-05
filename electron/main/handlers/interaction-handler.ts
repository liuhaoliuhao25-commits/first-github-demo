import { ipcMain, BrowserWindow } from 'electron'
import { InteractionEngine } from '../services/interaction-engine'
import { logger } from '../services/logger'

interface InteractionSettings {
  idleThresholdMinutes: number
  greetingEnabled: boolean
  idleReminderEnabled: boolean
  reminderIntervalMinutes: number
}

export class InteractionHandler {
  private mainWindow: BrowserWindow
  private engine: InteractionEngine
  private settings: InteractionSettings | null = null

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
    this.engine = new InteractionEngine({
      idleThresholdMinutes: 5,
      greetingEnabled: true,
      idleReminderEnabled: true,
      reminderIntervalMinutes: 15,
    })

    this.setupEventListeners()
    this.registerIPCHandlers()
    
    logger.info('Interaction Handler initialized')
  }

  private setupEventListeners(): void {
    this.engine.on('greeting', (event) => {
      this.mainWindow.webContents.send('interaction:greeting', event)
      logger.debug('Greeting event sent to renderer')
    })

    this.engine.on('reminder', (event) => {
      this.mainWindow.webContents.send('interaction:reminder', event)
      logger.debug('Reminder event sent to renderer')
    })

    this.engine.on('interaction', (event) => {
      logger.debug('Interaction event', { type: event.type })
    })
  }

  private registerIPCHandlers(): void {
    // 获取设置
    ipcMain.handle('interaction:getSettings', () => {
      return this.settings
    })

    // 保存设置
    ipcMain.on('interaction:saveSettings', (_event, settings: InteractionSettings) => {
      this.settings = settings
      this.engine.updateConfig(settings)
      logger.info('Interaction settings saved', settings)
    })

    // 记录交互
    ipcMain.on('interaction:record', (_event, eventType: string, context?: any) => {
      this.engine.recordInteraction({
        type: eventType,
        timestamp: Date.now(),
        context,
      })
    })

    // 启动引擎
    ipcMain.on('interaction:start', () => {
      this.engine.start()
    })

    // 停止引擎
    ipcMain.on('interaction:stop', () => {
      this.engine.stop()
    })

    // 获取状态
    ipcMain.handle('interaction:getStatus', () => {
      return this.engine.getStatus()
    })
  }

  async initialize(): Promise<void> {
    const defaultSettings: InteractionSettings = {
      idleThresholdMinutes: 5,
      greetingEnabled: true,
      idleReminderEnabled: true,
      reminderIntervalMinutes: 15,
    }

    this.settings = defaultSettings
    this.engine.updateConfig(defaultSettings)
    this.engine.start()

    logger.info('Interaction Handler initialized with defaults', defaultSettings)
  }

  dispose(): void {
    this.engine.dispose()
    logger.info('Interaction Handler disposed')
  }
}
