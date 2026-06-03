import { ipcRenderer } from 'electron'

export const systemTrayAPI = {
  async toggleWindow(): Promise<void> {
    ipcRenderer.send('tray:toggleWindow')
  },

  async openSettings(): Promise<void> {
    ipcRenderer.send('tray:openSettings')
  },

  async restartApp(): Promise<void> {
    ipcRenderer.send('tray:restartApp')
  },

  async quitApp(): Promise<void> {
    ipcRenderer.send('tray:quitApp')
  },

  onShowWindow(callback: () => void): () => void {
    const handler = () => callback()
    ipcRenderer.on('tray:showWindow', handler)
    return () => ipcRenderer.removeListener('tray:showWindow', handler)
  },
}
