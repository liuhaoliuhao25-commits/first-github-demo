import { EventEmitter } from 'events'
import { logger } from './logger'

export interface AIConfig {
  provider: 'ollama' | 'cloud'
  ollamaEndpoint: string
  ollamaModel: string
  cloudApiKey?: string
  cloudEndpoint?: string
  maxContextLength: number
}

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface AIResponse {
  text: string
  emotion?: string
  timestamp: number
}

export class AIService extends EventEmitter {
  private config: AIConfig
  private context: Message[] = []
  private isProcessing: boolean = false
  private abortController: AbortController | null = null

  constructor(config: AIConfig) {
    super()
    this.config = config
    logger.info('AI Service initialized', { provider: config.provider })
  }

  async sendMessage(message: string): Promise<void> {
    if (this.isProcessing) {
      logger.warn('AI is already processing a message')
      return
    }

    this.isProcessing = true
    this.abortController = new AbortController()

    // 添加用户消息到上下文
    this.context.push({
      role: 'user',
      content: message,
      timestamp: Date.now(),
    })

    // 限制上下文长度
    if (this.context.length > this.config.maxContextLength) {
      this.context.shift()
    }

    try {
      const response = await this.sendToAI(message)
      
      // 添加 AI 回复到上下文
      this.context.push({
        role: 'assistant',
        content: response.text,
        timestamp: Date.now(),
      })

      logger.info('AI response received', { 
        text: response.text,
        emotion: response.emotion,
      })
    } catch (error) {
      logger.error('AI request failed', { error })
      this.emit('error', error)
    } finally {
      this.isProcessing = false
      this.abortController = null
    }
  }

  private async sendToAI(message: string): Promise<AIResponse> {
    const { provider } = this.config

    if (provider === 'ollama') {
      return this.sendToOllama(message)
    } else {
      return this.sendToCloud(message)
    }
  }

  private async sendToOllama(message: string): Promise<AIResponse> {
    const { ollamaEndpoint, ollamaModel } = this.config
    const url = `${ollamaEndpoint}/api/chat`

    const requestBody = {
      model: ollamaModel,
      messages: this.context.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      stream: true,
    }

    logger.debug('Sending request to Ollama', { 
      endpoint: ollamaEndpoint,
      model: ollamaModel,
      messageCount: this.context.length,
    })

    let fullResponse = ''
    const startTime = Date.now()

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: this.abortController?.signal,
      })

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`)
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
            if (json.message?.content) {
              fullResponse += json.message.content
              this.emit('stream', json.message.content)
            }
          } catch (e) {
            logger.debug('Parse error', { line })
          }
        }
      }

      const duration = Date.now() - startTime
      logger.info('Ollama response received', { duration, length: fullResponse.length })

      return {
        text: fullResponse,
        emotion: this.detectEmotion(fullResponse),
        timestamp: Date.now(),
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.info('Request aborted')
      }
      throw error
    }
  }

  private async sendToCloud(message: string): Promise<AIResponse> {
    const { cloudApiKey, cloudEndpoint } = this.config

    if (!cloudApiKey || !cloudEndpoint) {
      throw new Error('Cloud API not configured')
    }

    const response = await fetch(cloudEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cloudApiKey}`,
      },
      body: JSON.stringify({
        messages: this.context.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      }),
      signal: this.abortController?.signal,
    })

    if (!response.ok) {
      throw new Error(`Cloud API error: ${response.statusText}`)
    }

    const data: any = await response.json()
    const text = data.choices?.[0]?.message?.content || ''

    return {
      text,
      emotion: this.detectEmotion(text),
      timestamp: Date.now(),
    }
  }

  private detectEmotion(text: string): string {
    // 简单的情绪检测逻辑
    const lowerText = text.toLowerCase()
    
    if (/(^|\s)(哈哈|嘻嘻|lol|haha|高兴|开心|好|太棒)/i.test(lowerText)) {
      return 'happy'
    }
    if (/(^|\s)(难过|伤心|遗憾|sad|unfortunately)/i.test(lowerText)) {
      return 'sad'
    }
    if (/(^|\s)(生气|愤怒|愤怒|angry|mad)/i.test(lowerText)) {
      return 'angry'
    }
    if (/(^|\s)(哇|啊呀|wow|amazing|surprised)/i.test(lowerText)) {
      return 'surprised'
    }

    return 'neutral'
  }

  clearContext(): void {
    this.context = []
    logger.info('AI context cleared')
  }

  getContext(): Message[] {
    return [...this.context]
  }

  abort(): void {
    if (this.abortController) {
      this.abortController.abort()
      logger.info('AI request aborted')
    }
  }

  dispose(): void {
    this.removeAllListeners()
    this.abort()
    this.context = []
  }
}
