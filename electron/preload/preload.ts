import { contextBridge, ipcRenderer } from 'electron'

// 类型定义
export interface ElectronAPI {
  windowControl: (action: string) => void
  openSettings: () => void
  checkUpdate: () => void
  onOpenSettings: (callback: () => void) => void
  onCheckUpdate: (callback: () => void) => void
}

// 暴露安全的 API 给渲染进程
const electronAPI: ElectronAPI = {
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

  onCheckUpdate: (callback: () => void) => {
    ipcRenderer.on('check-update', () => callback())
  },
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
