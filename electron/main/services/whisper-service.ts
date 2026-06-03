import { spawn, ChildProcess } from 'child_process'
import { EventEmitter } from 'events'
import { logger } from '../logger'

export interface WhisperConfig {
  executablePath: string
  modelPath: string
  language: string
}

export class WhisperService extends EventEmitter {
  private config: WhisperConfig
  private process: ChildProcess | null = null
  private isRecording: boolean = false
  private audioBuffer: Buffer[] = []

  constructor(config: WhisperConfig) {
    super()
    this.config = config
    logger.info('Whisper Service initialized', {
      model: config.modelPath,
      language: config.language,
    })
  }

  async startRecording(): Promise<boolean> {
    if (this.isRecording) {
      logger.warn('Already recording')
      return false
    }

    try {
      this.isRecording = true
      this.audioBuffer = []

      logger.info('Starting microphone recording')
      this.emit('recordingStarted')
      return true
    } catch (error) {
      logger.error('Failed to start recording', error)
      this.emit('error', error)
      return false
    }
  }

  async stopRecording(): Promise<string | null> {
    if (!this.isRecording) {
      return null
    }

    this.isRecording = false
    logger.info('Stopping recording, processing with Whisper...')

    try {
      // 这里应该将音频数据写入临时文件并调用 whisper.cpp
      // 简化版本：直接调用 whisper 命令行工具
      const result = await this.transcribeAudio()
      this.emit('transcriptionComplete', result)
      return result
    } catch (error) {
      logger.error('Transcription failed', error)
      this.emit('error', error)
      return null
    }
  }

  private async transcribeAudio(): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = [
        '-m', this.config.modelPath,
        '-f', 'recording.wav',
        '-l', this.config.language,
        '-otxt',
      ]

      logger.debug('Running whisper.cpp', { args })

      const process = spawn(this.config.executablePath, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      })

      let output = ''
      let errorOutput = ''

      process.stdout.on('data', (data) => {
        output += data.toString()
      })

      process.stderr.on('data', (data) => {
        errorOutput += data.toString()
        logger.debug('Whisper stderr', { message: data.toString() })
      })

      process.on('close', (code) => {
        if (code === 0) {
          logger.info('Transcription complete', { length: output.length })
          resolve(output.trim())
        } else {
          reject(new Error(`Whisper exited with code ${code}: ${errorOutput}`))
        }
      })

      process.on('error', (err) => {
        reject(err)
      })
    })
  }

  addAudioData(data: Buffer): void {
    if (this.isRecording) {
      this.audioBuffer.push(data)
    }
  }

  cancelRecording(): void {
    this.isRecording = false
    this.audioBuffer = []
    this.emit('recordingCancelled')
    logger.info('Recording cancelled')
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording
  }

  dispose(): void {
    this.cancelRecording()
    this.removeAllListeners()
  }
}
