import { contextBridge, ipcRenderer } from 'electron'

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 窗口控制
  windowControl: (action: string) => {
    ipcRenderer.send('window-control', action)
  },

  // 打开设置
  openSettings: () => {
    ipcRenderer.send('open-settings')
  },

  // 检查更新
  checkUpdate: () => {
    ipcRenderer.send('check-update')
  },

  // 监听事件
  onOpenSettings: (callback: () => void) => {
    ipcRenderer.on('open-settings', () => callback())
  },

  OnCheckUpdate: (callback: () => void) => {
    ipcRenderer.on('check-update', () => callback())
  },
})
