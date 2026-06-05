import { ipcMain, BrowserWindow } from 'electron'
import { logger } from '../services/logger'
import path from 'path'
import fs from 'fs/promises'

export interface LogExportOptions {
  startDate?: number
  endDate?: number
  levels?: ('debug' | 'info' | 'warn' | 'error')[]
  format?: 'json' | 'text'
}

export class LogHandler {
  private mainWindow: BrowserWindow

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
    this.registerIPCHandlers()
  }

  private registerIPCHandlers(): void {
    // 导出日志
    ipcMain.handle('logs:export', this.handleExportLogs.bind(this))
    
    // 获取日志目录
    ipcMain.handle('logs:getPath', this.handleGetLogPath.bind(this))
    
    // 清理旧日志
    ipcMain.handle('logs:cleanup', this.handleCleanupLogs.bind(this))
  }

  private async handleExportLogs(
    _event: Electron.IpcMainInvokeEvent,
    options: LogExportOptions = {}
  ): Promise<string> {
    const {
      startDate,
      endDate,
      levels = ['info', 'warn', 'error'],
      format = 'json',
    } = options

    try {
      const logPath = logger.getLogFilePath()
      const content = await fs.readFile(logPath, 'utf8')
      const lines = content.split('\n').filter((line) => line.trim())

      // 过滤日志
      const filtered = lines.filter((line) => {
        try {
          const log = JSON.parse(line)
          
          // 时间过滤
          if (startDate && log.timestamp < startDate) return false
          if (endDate && log.timestamp > endDate) return false
          
          // 级别过滤
          if (levels && !levels.includes(log.level)) return false
          
          return true
        } catch {
          return false
        }
      })

      // 格式化输出
      if (format === 'json') {
        const logs = filtered.map((line) => {
          try {
            return JSON.parse(line)
          } catch {
            return { raw: line }
          }
        })
        return JSON.stringify(logs, null, 2)
      } else {
        return filtered.join('\n')
      }
    } catch (error) {
      logger.error('Failed to export logs', error)
      throw error
    }
  }

  private async handleGetLogPath(): Promise<string> {
    return logger.getLogFilePath()
  }

  private async handleCleanupLogs(
    _event: Electron.IpcMainInvokeEvent,
    daysToKeep: number = 7
  ): Promise<number> {
    try {
      const logDir = path.dirname(logger.getLogFilePath())
      const files = await fs.readdir(logDir)
      
      const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000
      let deletedCount = 0

      for (const file of files) {
        if (!file.endsWith('.log')) continue

        const filePath = path.join(logDir, file)
        const stats = await fs.stat(filePath)
        
        if (stats.mtimeMs < cutoffTime) {
          await fs.unlink(filePath)
          deletedCount++
          logger.info('Deleted old log file', { file, daysOld: Math.round((Date.now() - stats.mtimeMs) / (24 * 60 * 60 * 1000)) })
        }
      }

      logger.info('Log cleanup complete', { deletedCount })
      return deletedCount
    } catch (error) {
      logger.error('Failed to cleanup logs', error)
      throw error
    }
  }

  dispose(): void {
    logger.info('Log Handler disposed')
  }
}
