import { app, ipcMain, BrowserWindow } from 'electron'
import { logger } from '../logger'

export interface ErrorReport {
  type: string
  message: string
  stack?: string
  timestamp: number
  context?: Record<string, any>
}

export class ErrorHandler {
  private mainWindow: BrowserWindow
  private errorQueue: ErrorReport[] = []

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
    this.setupGlobalHandlers()
    this.registerIPCHandlers()
    
    logger.info('Error Handler initialized')
  }

  private setupGlobalHandlers(): void {
    // 处理未捕获异常
    process.on('uncaughtException', (error) => {
      this.handleError({
        type: 'uncaughtException',
        message: error.message,
        stack: error.stack,
        timestamp: Date.now(),
      })
    })

    // 处理未处理的 Promise 拒绝
    process.on('unhandledRejection', (reason, promise) => {
      this.handleError({
        type: 'unhandledRejection',
        message: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
        timestamp: Date.now(),
      })
    })

    // 渲染进程错误
    ipcMain.on('reportError', (_event, errorReport: ErrorReport) => {
      this.handleError(errorReport)
    })
  }

  private registerIPCHandlers(): void {
    // 获取错误历史
    ipcMain.handle('errors:get', () => {
      return [...this.errorQueue]
    })

    // 清除错误历史
    ipcMain.on('errors:clear', () => {
      this.errorQueue = []
      logger.info('Error queue cleared')
    })
  }

  private handleError(error: ErrorReport): void {
    logger.error('Error caught', { type: error.type, message: error.message })

    // 添加到队列
    this.errorQueue.push(error)

    // 限制队列长度
    if (this.errorQueue.length > 100) {
      this.errorQueue.shift()
    }

    // 通知渲染进程
    this.mainWindow.webContents.send('error:occurred', error)

    // 写入日志
    const logData = {
      ...error,
      appVersion: app.getVersion(),
      platform: process.platform,
      arch: process.arch,
    }

    logger.error('Error details', logData)
  }

  report(type: string, message: string, context?: Record<string, any>): void {
    this.handleError({
      type,
      message,
      timestamp: Date.now(),
      context,
    })
  }

  dispose(): void {
    this.errorQueue = []
    logger.info('Error Handler disposed')
  }
}
