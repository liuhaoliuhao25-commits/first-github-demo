import { spawn, ChildProcess } from 'child_process'
import { EventEmitter } from 'events'
import { logger } from './logger'

export interface PiperConfig {
  executablePath: string
  modelPath: string
  speaker?: string
  lengthScale?: number
}

export class PiperService extends EventEmitter {
  private config: PiperConfig
  private process: ChildProcess | null = null
  private isSpeaking: boolean = false

  constructor(config: PiperConfig) {
    super()
    this.config = config
    logger.info('Piper TTS Service initialized', {
      model: config.modelPath,
    })
  }

  async speak(text: string): Promise<boolean> {
    if (this.isSpeaking) {
      logger.warn('Already speaking')
      return false
    }

    this.isSpeaking = true
    logger.info('Starting TTS synthesis', { textLength: text.length })

    const args = [
      '--model', this.config.modelPath,
      '--output_raw',
    ]

    if (this.config.speaker) {
      args.push('--speaker', this.config.speaker)
    }

    if (this.config.lengthScale) {
      args.push('--length_scale', this.config.lengthScale.toString())
    }

    try {
      this.process = spawn(this.config.executablePath, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      })

      this.process.stdout?.on('data', (data) => {
        // 音频数据输出到系统音频设备
        this.emit('audioData', data)
      })

      this.process.stderr?.on('data', (data) => {
        logger.debug('Piper stderr', { message: data.toString() })
      })

      this.process.on('close', (code) => {
        this.isSpeaking = false
        if (code === 0) {
          logger.info('TTS synthesis complete')
          this.emit('speechComplete')
        } else {
          logger.warn('TTS synthesis failed', { code })
          this.emit('error', new Error(`Piper exited with code ${code}`))
        }
      })

      this.process.on('error', (err) => {
        this.isSpeaking = false
        this.emit('error', err)
      })

      // 写入文本
      this.process.stdin?.write(text)
      this.process.stdin?.end()

      return true
    } catch (error) {
      this.isSpeaking = false
      logger.error('TTS synthesis failed', error)
      this.emit('error', error)
      return false
    }
  }

  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill('SIGTERM')
      this.process = null
      this.isSpeaking = false
      logger.info('TTS stopped')
    }
  }

  isCurrentlySpeaking(): boolean {
    return this.isSpeaking
  }

  async listSpeakers(): Promise<string[]> {
    // 获取模型支持的说话人列表
    return new Promise((resolve) => {
      if (this.config.speaker) {
        resolve([this.config.speaker])
      } else {
        resolve(['default'])
      }
    })
  }

  dispose(): void {
    this.stop()
    this.removeAllListeners()
  }
}
