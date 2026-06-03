import { ipcRenderer } from 'electron'

export interface PetWindowSettings {
  alwaysOnTop: boolean
  showOnAllScreens: boolean
  launchOnStartup: boolean
  enableVoiceResponse: boolean
  enableVoiceActivation: boolean
  modelOpacity: number
  modelSize: number
}

export const petWindowAPI = {
  // 窗口控制
  async minimize(): Promise<void> {
    ipcRenderer.send('pet-window:minimize')
  },

  async close(): Promise<void> {
    ipcRenderer.send('pet-window:close')
  },

  async setAlwaysOnTop(alwaysOnTop: boolean): Promise<void> {
    ipcRenderer.send('pet-window:setAlwaysOnTop', alwaysOnTop)
  },

  async setWindowOpacity(opacity: number): Promise<void> {
    ipcRenderer.send('pet-window:setOpacity', opacity)
  },

  async setModelScale(scale: number): Promise<void> {
    ipcRenderer.send('pet-window:setModelScale', scale)
  },

  // 设置管理
  async getSettings(): Promise<PetWindowSettings | null> {
    return ipcRenderer.invoke('settings:get')
  },

  async saveSettings(settings: Partial<PetWindowSettings>): Promise<void> {
    ipcRenderer.send('settings:save', settings)
  },

  // 全屏检测
  onFullScreenChange(callback: (isFullScreen: boolean) => void): () => void {
    const handler = (_event: Electron.IpcRendererEvent, isFullScreen: boolean) => {
      callback(isFullScreen)
    }
    ipcRenderer.on('fullscreen:changed', handler)
    return () => ipcRenderer.removeListener('fullscreen:changed', handler)
  },

  // AI 对话
  async sendMessage(message: string): Promise<void> {
    ipcRenderer.invoke('ai:sendMessage', message)
  },

  onAIResponse(callback: (response: string) => void): () => void {
    const handler = (_event: Electron.IpcRendererEvent, response: string) => {
      callback(response)
    }
    ipcRenderer.on('ai:response', handler)
    return () => ipcRenderer.removeListener('ai:response', handler)
  },

  onAIStream(callback: (chunk: string) => void): () => void {
    const handler = (_event: Electron.IpcRendererEvent, chunk: string) => {
      callback(chunk)
    }
    ipcRenderer.on('ai:stream', handler)
    return () => ipcRenderer.removeListener('ai:stream', handler)
  },

  onAIError(callback: (error: string) => void): () => void {
    const handler = (_event: Electron.IpcRendererEvent, error: string) => {
      callback(error)
    }
    ipcRenderer.on('ai:error', handler)
    return () => ipcRenderer.removeListener('ai:error', handler)
  },

  clearAIContext(): void {
    ipcRenderer.send('ai:clearContext')
  },
}
