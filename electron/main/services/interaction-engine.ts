import { EventEmitter } from 'events'
import { logger } from './logger'

export interface InteractionEvent {
  type: string
  timestamp: number
  context?: Record<string, any>
}

export interface InteractionConfig {
  idleThresholdMinutes: number
  greetingEnabled: boolean
  idleReminderEnabled: boolean
  reminderIntervalMinutes: number
}

export class InteractionEngine extends EventEmitter {
  private config: InteractionConfig
  private lastInteractionTime: number = Date.now()
  private idleTimer: NodeJS.Timeout | null = null
  private greetingSent: boolean = false
  private isActive: boolean = false

  constructor(config: InteractionConfig) {
    super()
    this.config = config
    logger.info('Interaction Engine initialized', config)
  }

  /**
   * 记录用户交互
   */
  recordInteraction(event: InteractionEvent): void {
    this.lastInteractionTime = Date.now()
    this.greetingSent = false
    
    logger.debug('Interaction recorded', { type: event.type })
    this.emit('interaction', event)

    // 重新启动空闲计时器
    this.startIdleTimer()
  }

  /**
   * 启动引擎
   */
  start(): void {
    if (this.isActive) {
      logger.warn('Interaction Engine is already active')
      return
    }

    this.isActive = true
    this.startIdleTimer()
    logger.info('Interaction Engine started')
  }

  /**
   * 停止引擎
   */
  stop(): void {
    this.isActive = false
    this.stopIdleTimer()
    logger.info('Interaction Engine stopped')
  }

  /**
   * 启动空闲计时器
   */
  private startIdleTimer(): void {
    this.stopIdleTimer()

    const idleThreshold = this.config.idleThresholdMinutes * 60 * 1000

    this.idleTimer = setTimeout(() => {
      this.handleIdle()
    }, idleThreshold)

    logger.debug('Idle timer started', { threshold: this.config.idleThresholdMinutes })
  }

  /**
   * 停止空闲计时器
   */
  private stopIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer)
      this.idleTimer = null
    }
  }

  /**
   * 处理空闲状态
   */
  private handleIdle(): void {
    if (!this.isActive) return

    logger.info('User idle detected')

    // 发送问候
    if (this.config.greetingEnabled && !this.greetingSent) {
      this.emit('greeting', {
        type: 'greeting',
        timestamp: Date.now(),
        context: { idleMinutes: this.config.idleThresholdMinutes },
      })
      this.greetingSent = true
    }

    // 启动定期提醒
    if (this.config.idleReminderEnabled) {
      this.startReminderTimer()
    }
  }

  /**
   * 启动定期提醒计时器
   */
  private startReminderTimer(): void {
    const interval = this.config.reminderIntervalMinutes * 60 * 1000

    const reminderFn = () => {
      if (!this.isActive) return

      // 检查是否还在空闲状态
      const idleDuration = Date.now() - this.lastInteractionTime
      if (idleDuration >= interval) {
        this.emit('reminder', {
          type: 'reminder',
          timestamp: Date.now(),
          context: { idleMinutes: Math.round(idleDuration / 60000) },
        })

        logger.debug('Reminder sent', { idleMinutes: Math.round(idleDuration / 60000) })
      }

      // 继续下一轮
      if (this.isActive && this.config.idleReminderEnabled) {
        this.idleTimer = setTimeout(reminderFn, interval)
      }
    }

    this.idleTimer = setTimeout(reminderFn, interval)
  }

  /**
   * 获取空闲时长（分钟）
   */
  getIdleDuration(): number {
    return Math.round((Date.now() - this.lastInteractionTime) / 60000)
  }

  /**
   * 检查是否处于空闲状态
   */
  isIdle(): boolean {
    const idleDuration = Date.now() - this.lastInteractionTime
    return idleDuration >= this.config.idleThresholdMinutes * 60000
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<InteractionConfig>): void {
    this.config = { ...this.config, ...newConfig }
    logger.info('Interaction config updated', newConfig)

    // 如果引擎正在运行，重新启动计时器
    if (this.isActive) {
      this.stopIdleTimer()
      this.startIdleTimer()
    }
  }

  /**
   * 获取状态
   */
  getStatus(): {
    isActive: boolean
    idleDuration: number
    isIdle: boolean
    lastInteraction: number
  } {
    return {
      isActive: this.isActive,
      idleDuration: this.getIdleDuration(),
      isIdle: this.isIdle(),
      lastInteraction: this.lastInteractionTime,
    }
  }

  dispose(): void {
    this.stop()
    this.removeAllListeners()
    logger.info('Interaction Engine disposed')
  }
}
