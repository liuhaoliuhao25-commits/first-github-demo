import { ipcMain, IpcMainInvokeEvent, BrowserWindow } from 'electron'
import { WhisperService } from './whisper-service'
import { PiperService } from './piper-service'
import { logger } from '../logger'

interface VoiceSettings {
  enableVoiceRecognition: boolean
  enableTextToSpeech: boolean
  whisperModelPath: string
  piperModelPath: string
  piperSpeaker?: string
}

export class VoiceHandler {
  private mainWindow: BrowserWindow
  private whisperService: WhisperService | null = null
  private piperService: PiperService | null = null
  private settings: VoiceSettings | null = null

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
    this.registerIPCHandlers()
    logger.info('Voice Handler initialized')
  }

  private registerIPCHandlers(): void {
    ipcMain.handle('voice:getSettings', this.handleGetSettings.bind(this))
    ipcMain.on('voice:saveSettings', this.handleSaveSettings.bind(this))
    
    ipcMain.handle('voice:startRecording', this.handleStartRecording.bind(this))
    ipcMain.handle('voice:stopRecording', this.handleStopRecording.bind(this))
    ipcMain.handle('voice:cancelRecording', this.handleCancelRecording.bind(this))
    
    ipcMain.handle('voice:speak', this.handleSpeak.bind(this))
    ipcMain.handle('voice:stopSpeaking', this.handleStopSpeaking.bind(this))
    
    ipcMain.handle('voice:status', this.handleStatus.bind(this))
  }

  async initialize(): Promise<void> {
    const defaultSettings: VoiceSettings = {
      enableVoiceRecognition: true,
      enableTextToSpeech: true,
      whisperModelPath: '/path/to/whisper/model.bin',
      piperModelPath: '/path/to/piper/model.onnx',
      piperSpeaker: undefined,
    }

    await this.handleSaveSettings(null as any, defaultSettings)
  }

  private handleGetSettings = async (): Promise<VoiceSettings | null> => {
    return this.settings
  }

  private handleSaveSettings = async (_event: any, settings: VoiceSettings): Promise<void> => {
    this.settings = settings

    // 初始化 Whisper
    if (settings.enableVoiceRecognition) {
      this.whisperService = new WhisperService({
        executablePath: 'whisper-cpp',
        modelPath: settings.whisperModelPath,
        language: 'zh',
      })

      this.whisperService.on('recordingStarted', () => {
        this.mainWindow.webContents.send('voice:recordingStarted')
      })

      this.whisperService.on('transcriptionComplete', (text: string) => {
        this.mainWindow.webContents.send('voice:transcription', text)
      })

      this.whisperService.on('error', (error: Error) => {
        this.mainWindow.webContents.send('voice:error', error.message)
      })
    }

    // 初始化 Piper
    if (settings.enableTextToSpeech) {
      this.piperService = new PiperService({
        executablePath: 'piper',
        modelPath: settings.piperModelPath,
        speaker: settings.piperSpeaker,
      })

      this.piperService.on('speechComplete', () => {
        this.mainWindow.webContents.send('voice:speechComplete')
      })

      this.piperService.on('error', (error: Error) => {
        this.mainWindow.webContents.send('voice:error', error.message)
      })
    }

    logger.info('Voice settings saved', {
      recognition: settings.enableVoiceRecognition,
      tts: settings.enableTextToSpeech,
    })
  }

  private handleStartRecording = async (): Promise<boolean> => {
    if (!this.whisperService) {
      throw new Error('Voice recognition not initialized')
    }

    return await this.whisperService.startRecording()
  }

  private handleStopRecording = async (): Promise<string | null> => {
    if (!this.whisperService) {
      return null
    }

    return await this.whisperService.stopRecording()
  }

  private handleCancelRecording = async (): Promise<void> => {
    this.whisperService?.cancelRecording()
  }

  private handleSpeak = async (_event: IpcMainInvokeEvent, text: string): Promise<boolean> => {
    if (!this.piperService) {
      throw new Error('TTS not initialized')
    }

    return await this.piperService.speak(text)
  }

  private handleStopSpeaking = async (): Promise<void> => {
    await this.piperService?.stop()
  }

  private handleStatus = async (): Promise<{
    isRecording: boolean
    isSpeaking: boolean
  }> => {
    return {
      isRecording: this.whisperService?.isCurrentlyRecording() || false,
      isSpeaking: this.piperService?.isCurrentlySpeaking() || false,
    }
  }

  dispose(): void {
    this.whisperService?.dispose()
    this.piperService?.dispose()
    logger.info('Voice Handler disposed')
  }
}
