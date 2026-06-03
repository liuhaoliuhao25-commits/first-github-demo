import React, { useState, useEffect } from 'react'
import { PetCanvas } from './vrm'
import { SettingsPanel } from './components/SettingsPanel'
import { ChatBubble } from './components/ChatBubble'
import { ToastContainer, showToast } from './components/ToastNotification'
import { VoiceInput } from './components/VoiceInput'
import { petWindowAPI } from './api/pet-window'
import { systemTrayAPI } from './api/system-tray'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  emotion?: string
}

export const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isFullScreen, setIsFullScreen] = useState(false)

  // 监听全屏状态
  useEffect(() => {
    const unsubscribe = petWindowAPI.onFullScreenChange((fullScreen) => {
      setIsFullScreen(fullScreen)
      
      if (fullScreen) {
        petWindowAPI.setWindowOpacity(0.3)
        showToast('自动隐藏', '检测到全屏应用，已降低透明度', 'info', 3000)
      } else {
        petWindowAPI.setWindowOpacity(1.0)
      }
    })

    return unsubscribe
  }, [])

  // 监听系统托盘显示事件
  useEffect(() => {
    const unsubscribe = systemTrayAPI.onShowWindow(() => {
      showToast('欢迎回来', '桌宠已唤醒', 'success', 2000)
    })

    return unsubscribe
  }, [])

  // 示例：接收 AI 消息
  useEffect(() => {
    const unsubscribe = petWindowAPI.onAIResponse((response) => {
      const newMessage: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
        emotion: 'happy',
      }
      setMessages((prev) => [...prev, newMessage])
    })

    return unsubscribe
  }, [])

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: 'transparent',
      }}
    >
      {/* VRM 渲染画布 */}
      <PetCanvas
        vrmUrl="/models/default.vrm"
      />

      {/* 设置面板 */}
      <SettingsPanel />

      {/* 对话气泡 */}
      <ChatBubble
        messages={messages}
        isVisible={!isFullScreen}
        onDismiss={() => setMessages([])}
        autoHideMs={8000}
      />

      {/* 通知 Toast */}
      <ToastContainer position="top-right" />

      {/* 语音输入 */}
      <VoiceInput />

      {/* 主窗口控制提示 */}
      <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            display: 'flex',
            gap: '8px',
            zIndex: 9998,
          }}
        >
          <button
            onClick={() => petWindowAPI.minimize()}
            title="最小化"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'rgba(255,255,255,0.9)',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            ➖
          </button>
          <button
            onClick={() => petWindowAPI.close()}
            title="关闭"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'rgba(255,255,255,0.9)',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            ✕
          </button>
        </div>
    </div>
  )
}
