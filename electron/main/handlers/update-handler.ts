import { ipcMain, BrowserWindow } from 'electron'
import { AutoUpdaterService } from '../services/auto-updater'
import { logger } from '../services/logger'

export class UpdateHandler {
  private mainWindow: BrowserWindow
  private updater: AutoUpdaterService

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
    this.updater = new AutoUpdaterService(mainWindow)
    this.registerIPCHandlers()
    
    // 应用启动后延迟检查更新
    setTimeout(() => {
      this.updater.checkForUpdates().catch((err) => {
        logger.error('Initial update check failed', err)
      })
    }, 5000)
    
    logger.info('Update Handler initialized')
  }

  private registerIPCHandlers(): void {
    // 手动检查更新
    ipcMain.handle('update:check', async () => {
      try {
        await this.updater.checkForUpdates()
        return { success: true }
      } catch (error) {
        logger.error('Manual update check failed', error)
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
      }
    })

    // 获取更新状态
    ipcMain.handle('update:getStatus', () => {
      return this.updater.getStatus()
    })

    // 下载更新
    ipcMain.handle('update:download', async () => {
      try {
        await this.updater.downloadUpdate()
        return { success: true }
      } catch (error) {
        logger.error('Update download failed', error)
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
      }
    })

    // 退出并安装
    ipcMain.on('update:quitAndInstall', () => {
      this.updater.quitAndInstall()
    })
  }

  dispose(): void {
    this.updater.dispose()
    logger.info('Update Handler disposed')
  }
}
