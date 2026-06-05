import { ipcMain, IpcMainInvokeEvent, BrowserWindow } from 'electron'
import { AIService, AIConfig } from '../services/ai-service'
import { OllamaManager } from '../services/ollama-manager'
import { logger } from '../services/logger'

interface AISettings {
  provider: 'ollama' | 'cloud'
  ollamaEndpoint: string
  ollamaModel: string
  ollamaAutoStart: boolean
  cloudApiKey?: string
  cloudEndpoint?: string
}

export class AIHandler {
  private mainWindow: BrowserWindow
  private aiService: AIService | null = null
  private ollamaManager: OllamaManager | null = null
  private settings: AISettings | null = null

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
    this.registerIPCHandlers()
    logger.info('AI Handler initialized')
  }

  private registerIPCHandlers(): void {
    // 获取 AI 设置
    ipcMain.handle('ai:getSettings', this.handleGetSettings.bind(this))

    // 保存 AI 设置
    ipcMain.on('ai:saveSettings', this.handleSaveSettings.bind(this))

    // 发送消息
    ipcMain.handle('ai:sendMessage', this.handleSendMessage.bind(this))

    // 清除上下文
    ipcMain.on('ai:clearContext', this.handleClearContext.bind(this))

    // Ollama 控制
    ipcMain.handle('ollama:start', this.handleOllamaStart.bind(this))
    ipcMain.handle('ollama:stop', this.handleOllamaStop.bind(this))
    ipcMain.handle('ollama:status', this.handleOllamaStatus.bind(this))
  }

  async initialize(): Promise<void> {
    // 从配置文件加载设置
    const defaultSettings: AISettings = {
      provider: 'ollama',
      ollamaEndpoint: 'http://localhost:11434',
      ollamaModel: 'llama2',
      ollamaAutoStart: true,
    }

    await this.handleSaveSettings(null as any, defaultSettings)
  }

  private handleGetSettings = async (): Promise<AISettings | null> => {
    return this.settings
  }

  private handleSaveSettings = async (_event: any, settings: AISettings): Promise<void> => {
    this.settings = settings
    
    // 初始化 AI 服务
    const aiConfig: AIConfig = {
      provider: settings.provider,
      ollamaEndpoint: settings.ollamaEndpoint,
      ollamaModel: settings.ollamaModel,
      cloudApiKey: settings.cloudApiKey,
      cloudEndpoint: settings.cloudEndpoint,
      maxContextLength: 20,
    }

    // 清理旧服务
    if (this.aiService) {
      this.aiService.dispose()
    }

    // 创建新服务
    this.aiService = new AIService(aiConfig)

    // 设置事件监听
    this.aiService.on('stream', (content: string) => {
      this.mainWindow.webContents.send('ai:stream', content)
    })

    this.aiService.on('error', (error: Error) => {
      this.mainWindow.webContents.send('ai:error', error.message)
    })

    // 初始化 Ollama Manager
    if (settings.provider === 'ollama') {
      this.ollamaManager = new OllamaManager({
        executablePath: 'ollama',
        model: settings.ollamaModel,
        autoStart: settings.ollamaAutoStart,
      })

      if (settings.ollamaAutoStart) {
        await this.ollamaManager.start()
      }
    }

    logger.info('AI settings saved', { provider: settings.provider })
  }

  private handleSendMessage = async (_event: IpcMainInvokeEvent, message: string): Promise<void> => {
    if (!this.aiService) {
      throw new Error('AI service not initialized')
    }

    await this.aiService.sendMessage(message)
  }

  private handleClearContext = (): void => {
    if (this.aiService) {
      this.aiService.clearContext()
      logger.info('AI context cleared')
    }
  }

  private handleOllamaStart = async (): Promise<boolean> => {
    if (!this.ollamaManager) {
      throw new Error('Ollama manager not initialized')
    }

    return await this.ollamaManager.start()
  }

  private handleOllamaStop = async (): Promise<void> => {
    if (!this.ollamaManager) {
      return
    }

    await this.ollamaManager.stop()
  }

  private handleOllamaStatus = async (): Promise<{
    isRunning: boolean
    isHealthy: boolean
    modelAvailable: boolean
  }> => {
    if (!this.ollamaManager) {
      return {
        isRunning: false,
        isHealthy: false,
        modelAvailable: false,
      }
    }

    const isRunning = this.ollamaManager.isServiceRunning()
    const isHealthy = await this.ollamaManager.checkHealth()
    const modelAvailable = this.settings 
      ? await this.ollamaManager.isModelAvailable(this.settings.ollamaModel)
      : false

    return {
      isRunning,
      isHealthy,
      modelAvailable,
    }
  }

  dispose(): void {
    if (this.aiService) {
      this.aiService.dispose()
    }
    if (this.ollamaManager) {
      this.ollamaManager.dispose()
    }
    logger.info('AI Handler disposed')
  }
}
