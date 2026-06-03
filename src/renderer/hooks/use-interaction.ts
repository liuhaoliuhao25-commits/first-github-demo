import { useEffect, useState } from 'react'
import { ipcRenderer } from 'electron'

export interface InteractionSettings {
  idleThresholdMinutes: number
  greetingEnabled: boolean
  idleReminderEnabled: boolean
  reminderIntervalMinutes: number
}

export interface InteractionStatus {
  isActive: boolean
  idleDuration: number
  isIdle: boolean
  lastInteraction: number
}

export function useInteractionEngine() {
  const [settings, setSettings] = useState<InteractionSettings | null>(null)
  const [status, setStatus] = useState<InteractionStatus>({
    isActive: false,
    idleDuration: 0,
    isIdle: false,
    lastInteraction: Date.now(),
  })

  useEffect(() => {
    // 加载设置
    ipcRenderer.invoke('interaction:getSettings').then((s) => {
      setSettings(s)
    })

    // 监听问候事件
    const onGreeting = (_event: Electron.IpcRendererEvent, event: any) => {
      console.log('Greeting from engine:', event)
      // 可以在这里触发表情或显示提示
    }

    // 监听提醒事件
    const onReminder = (_event: Electron.IpcRendererEvent, event: any) => {
      console.log('Reminder from engine:', event)
      // 可以在这里触发表情或显示提示
    }

    ipcRenderer.on('interaction:greeting', onGreeting)
    ipcRenderer.on('interaction:reminder', onReminder)

    return () => {
      ipcRenderer.removeListener('interaction:greeting', onGreeting)
      ipcRenderer.removeListener('interaction:reminder', onReminder)
    }
  }, [])

  // 记录用户交互
  const recordInteraction = (eventType: string, context?: any) => {
    ipcRenderer.send('interaction:record', eventType, context)
  }

  // 更新设置
  const updateSettings = (newSettings: Partial<InteractionSettings>) => {
    ipcRenderer.invoke('interaction:getSettings').then((current) => {
      const updated = { ...current, ...newSettings }
      ipcRenderer.send('interaction:saveSettings', updated)
      setSettings(updated)
    })
  }

  // 刷新状态
  const refreshStatus = async () => {
    const s = await ipcRenderer.invoke('interaction:getStatus')
    setStatus(s)
    return s
  }

  return {
    settings,
    status,
    recordInteraction,
    updateSettings,
    refreshStatus,
  }
}
