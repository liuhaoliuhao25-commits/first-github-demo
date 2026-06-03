import { ipcRenderer } from 'electron'

export interface VoiceSettings {
  enableVoiceRecognition: boolean
  enableTextToSpeech: boolean
  whisperModelPath: string
  piperModelPath: string
  piperSpeaker?: string
}

export const voiceAPI = {
  // 设置管理
  async getSettings(): Promise<VoiceSettings | null> {
    return ipcRenderer.invoke('voice:getSettings')
  },

  async saveSettings(settings: Partial<VoiceSettings>): Promise<void> {
    ipcRenderer.send('voice:saveSettings', settings)
  },

  // 语音识别
  async startRecording(): Promise<boolean> {
    return ipcRenderer.invoke('voice:startRecording')
  },

  async stopRecording(): Promise<string | null> {
    return ipcRenderer.invoke('voice:stopRecording')
  },

  async cancelRecording(): Promise<void> {
    ipcRenderer.invoke('voice:cancelRecording')
  },

  onRecordingStarted(callback: () => void): () => void {
    const handler = () => callback()
    ipcRenderer.on('voice:recordingStarted', handler)
    return () => ipcRenderer.removeListener('voice:recordingStarted', handler)
  },

  onTranscription(callback: (text: string) => void): () => void {
    const handler = (_event: Electron.IpcRendererEvent, text: string) => {
      callback(text)
    }
    ipcRenderer.on('voice:transcription', handler)
    return () => ipcRenderer.removeListener('voice:transcription', handler)
  },

  // 语音合成
  async speak(text: string): Promise<boolean> {
    return ipcRenderer.invoke('voice:speak', text)
  },

  async stopSpeaking(): Promise<void> {
    ipcRenderer.invoke('voice:stopSpeaking')
  },

  onSpeechComplete(callback: () => void): () => void {
    const handler = () => callback()
    ipcRenderer.on('voice:speechComplete', handler)
    return () => ipcRenderer.removeListener('voice:speechComplete', handler)
  },

  // 状态查询
  async getStatus(): Promise<{
    isRecording: boolean
    isSpeaking: boolean
  }> {
    return ipcRenderer.invoke('voice:status')
  },

  onError(callback: (error: string) => void): () => void {
    const handler = (_event: Electron.IpcRendererEvent, error: string) => {
      callback(error)
    }
    ipcRenderer.on('voice:error', handler)
    return () => ipcRenderer.removeListener('voice:error', handler)
  },
}
