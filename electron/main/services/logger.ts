import { app } from 'electron'
import fs from 'fs'
import path from 'path'

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export class LoggerService {
  private logDir: string
  private logFiles: Map<LogLevel, string>

  constructor() {
    this.logDir = path.join(app.getPath('userData'), 'logs')
    this.ensureLogDir()

    this.logFiles = new Map([
      [LogLevel.DEBUG, path.join(this.logDir, 'debug.log')],
      [LogLevel.INFO, path.join(this.logDir, 'info.log')],
      [LogLevel.WARN, path.join(this.logDir, 'warn.log')],
      [LogLevel.ERROR, path.join(this.logDir, 'error.log')],
    ])
  }

  private ensureLogDir(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true })
    }
  }

  log(level: LogLevel, message: string, context?: any): void {
    const logFile = this.logFiles.get(level)
    if (!logFile) return

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    }

    const logLine = JSON.stringify(logEntry) + '\n'

    // 异步写入，不阻塞主进程
    fs.appendFile(logFile, logLine, (err) => {
      if (err) {
        console.error('Failed to write log:', err)
      }
    })

    // ERROR 级别同时输出到控制台
    if (level === LogLevel.ERROR) {
      console.error(logEntry)
    }
  }

  debug(message: string, context?: any): void {
    this.log(LogLevel.DEBUG, message, context)
  }

  info(message: string, context?: any): void {
    this.log(LogLevel.INFO, message, context)
  }

  warn(message: string, context?: any): void {
    this.log(LogLevel.WARN, message, context)
  }

  error(message: string, context?: any): void {
    this.log(LogLevel.ERROR, message, context)
  }

  getLogFilePath(): string {
    return path.join(this.logDir, 'debug.log')
  }

  getLogDir(): string {
    return this.logDir
  }
}

// 导出单例
export const logger = new LoggerService()
