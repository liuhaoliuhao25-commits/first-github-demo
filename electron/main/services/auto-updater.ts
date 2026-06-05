import { app, dialog, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import { logger } from './logger'

export class AutoUpdaterService {
  private mainWindow: BrowserWindow | null = null
  private updateAvailable: boolean = false
  private downloadProgress: number = 0

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
    
    // 配置自动下载
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = true
    
    this.setupListeners()
    logger.info('Auto Updater Service initialized')
  }

  private setupListeners(): void {
    // 检查更新开始
    autoUpdater.on('checking-for-update', () => {
      logger.info('Checking for updates...')
      this.mainWindow?.webContents.send('update:checking')
    })

    // 有可用更新
    autoUpdater.on('update-available', (info) => {
      logger.info('Update available', { version: info.version })
      this.updateAvailable = true
      this.mainWindow?.webContents.send('update:available', info)
      
      // 询问用户是否下载
      this.showUpdateDialog(info.version)
    })

    // 没有可用更新
    autoUpdater.on('update-not-available', () => {
      logger.info('No updates available')
      this.mainWindow?.webContents.send('update:not-available')
    })

    // 下载进度
    autoUpdater.on('download-progress', (progressObj) => {
      this.downloadProgress = progressObj.percent
      logger.debug('Download progress', { percent: progressObj.percent })
      this.mainWindow?.webContents.send('update:progress', progressObj)
    })

    // 下载完成
    autoUpdater.on('update-downloaded', (info) => {
      logger.info('Update downloaded', { version: info.version })
      this.mainWindow?.webContents.send('update:downloaded', info)
      
      // 提示用户重启安装
      this.showRestartDialog()
    })

    // 更新错误
    autoUpdater.on('error', (error) => {
      logger.error('Update error', error)
      this.mainWindow?.webContents.send('update:error', {
        message: error.message,
      })
    })
  }

  private showUpdateDialog(version: string): void {
    dialog.showMessageBox(this.mainWindow!, {
      type: 'info',
      title: '发现新版本',
      message: `发现新版本 ${version}，是否立即下载更新？`,
      buttons: ['稍后', '立即下载'],
      defaultId: 1,
      cancelId: 0,
    }).then(({ response }) => {
      if (response === 1) {
        logger.info('User accepted update, starting download')
        autoUpdater.downloadUpdate()
      } else {
        logger.info('User declined update')
      }
    })
  }

  private showRestartDialog(): void {
    dialog.showMessageBox(this.mainWindow!, {
      type: 'info',
      title: '更新已就绪',
      message: '更新已下载完成，需要重启应用以安装更新。是否立即重启？',
      buttons: ['稍后', '立即重启'],
      defaultId: 1,
      cancelId: 0,
    }).then(({ response }) => {
      if (response === 1) {
        logger.info('User accepted restart, installing update')
        autoUpdater.quitAndInstall()
      } else {
        logger.info('User declined restart')
      }
    })
  }

  /**
   * 手动检查更新
   */
  async checkForUpdates(): Promise<void> {
    try {
      await autoUpdater.checkForUpdates()
    } catch (error) {
      logger.error('Failed to check for updates', error)
      throw error
    }
  }

  /**
   * 下载更新
   */
  async downloadUpdate(): Promise<void> {
    if (!this.updateAvailable) {
      throw new Error('No update available')
    }
    
    try {
      await autoUpdater.downloadUpdate()
    } catch (error) {
      logger.error('Failed to download update', error)
      throw error
    }
  }

  /**
   * 退出并安装
   */
  quitAndInstall(): void {
    autoUpdater.quitAndInstall()
  }

  getStatus(): {
    updateAvailable: boolean
    downloadProgress: number
  } {
    return {
      updateAvailable: this.updateAvailable,
      downloadProgress: this.downloadProgress,
    }
  }

  dispose(): void {
    this.mainWindow = null
    logger.info('Auto Updater Service disposed')
  }
}
