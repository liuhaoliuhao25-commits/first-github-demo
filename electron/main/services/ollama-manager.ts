import { spawn, ChildProcess } from 'child_process'
import { logger } from './logger'

export interface OllamaConfig {
  executablePath: string
  model: string
  autoStart: boolean
}

export class OllamaManager {
  private config: OllamaConfig
  private process: ChildProcess | null = null
  private isRunning: boolean = false
  private healthCheckInterval: NodeJS.Timeout | null = null

  constructor(config: OllamaConfig) {
    this.config = config
    logger.info('Ollama Manager initialized', {
      path: config.executablePath,
      model: config.model,
      autoStart: config.autoStart,
    })
  }

  async start(): Promise<any> {
    if (this.isRunning) {
      logger.info('Ollama is already running')
      return true
    }

    if (!this.config.autoStart) {
      logger.info('Ollama auto-start is disabled')
      return false
    }

    try {
      // 检查 Ollama 是否已经在运行
      const isRunning = await this.checkHealth()
      if (isRunning) {
        logger.info('Ollama is already running (detected by health check)')
        this.isRunning = true
        this.startHealthCheck()
        return true
      }

      // 启动 Ollama serve
      logger.info('Starting Ollama serve...')
      this.process = spawn(this.config.executablePath, ['serve'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
        windowsHide: true,
      })

      this.process.stdout?.on('data', (data) => {
        logger.debug('Ollama stdout', { message: data.toString() })
      })

      this.process.stderr?.on('data', (data) => {
        logger.debug('Ollama stderr', { message: data.toString() })
      })

      this.process.on('exit', (code) => {
        logger.warn('Ollama process exited', { code })
        this.isRunning = false
        this.stopHealthCheck()
      })

      // 等待 Ollama 启动
      await this.waitForStartup(30000)
      
      this.isRunning = true
      this.startHealthCheck()
      
      logger.info('Ollama started successfully')
      return true
    } catch (error) {
      logger.error('Failed to start Ollama', { error })
      return false
    }
  }

  async stop(): Promise<void> {
    if (this.process) {
      logger.info('Stopping Ollama...')
      
      this.process.kill('SIGTERM')
      this.process = null
      this.isRunning = false
      this.stopHealthCheck()
      
      logger.info('Ollama stopped')
    }
  }

  async checkHealth(): Promise<any> {
    try {
      const response = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        
      })
      
      return response.ok
    } catch (error) {
      return false
    }
  }

  async isModelAvailable(modelName: string): Promise<any> {
    try {
      const response = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        
      })

      if (!response.ok) {
        return false
      }

      const data: any = await response.json()
      const models = data.models || []
      
      return models.some((m: any) => m.name === modelName || m.name.startsWith(`${modelName}:`))
    } catch (error) {
      logger.error('Failed to check model availability', { error })
      return false
    }
  }

  async pullModel(modelName: string, onProgress?: (progress: number) => void): Promise<void> {
    logger.info('Pulling model', { model: modelName })

    const response = await fetch('http://localhost:11434/api/pull', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: modelName }),
    })

    if (!response.ok) {
      throw new Error(`Failed to pull model: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n').filter((line) => line.trim())

      for (const line of lines) {
        try {
          const json = JSON.parse(line)
          if (json.status === 'success') {
            logger.info('Model pulled successfully', { model: modelName })
            return
          }
          if (json.completed && json.total) {
            const progress = Math.round((json.completed / json.total) * 100)
            onProgress?.(progress)
            logger.debug('Pull progress', { progress })
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }

  private async waitForStartup(timeout: number): Promise<void> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
      const isHealthy = await this.checkHealth()
      if (isHealthy) {
        return
      }
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    throw new Error('Ollama failed to start within timeout')
  }

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      const isHealthy = await this.checkHealth()
      if (!isHealthy) {
        logger.warn('Ollama health check failed')
        this.isRunning = false
      }
    }, 30000) // Check every 30 seconds
  }

  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
  }

  isServiceRunning(): boolean {
    return this.isRunning
  }

  dispose(): void {
    this.stop()
    this.stopHealthCheck()
  }
}
