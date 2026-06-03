import { contextBridge, ipcRenderer } from 'electron'

export interface ErrorReport {
  type: string
  message: string
  stack?: string
  timestamp: number
  context?: Record<string, any>
}

const electronAPI = {
  reportError: (error: ErrorReport) => {
    ipcRenderer.send('reportError', error)
  },
}

export const setupElectronAPI = () => {
  contextBridge.exposeInMainWorld('electronAPI', electronAPI)
}

export type ElectronAPI = typeof electronAPI
