import React, { useEffect, useState, useRef } from 'react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  emotion?: string
}

interface ChatBubbleProps {
  messages: ChatMessage[]
  isVisible: boolean
  onDismiss: () => void
  autoHideMs?: number
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  messages,
  isVisible,
  onDismiss,
  autoHideMs = 8000,
}) => {
  const [currentMessage, setCurrentMessage] = useState<ChatMessage | null>(null)
  const messageQueue = useRef<ChatMessage[]>([])
  const hideTimer = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (messages.length > 0) {
      const newMessages = messages.filter(
        (m) => !messageQueue.current.find((qm) => qm.id === m.id)
      )
      messageQueue.current.push(...newMessages)
    }
  }, [messages])

  useEffect(() => {
    if (messageQueue.current.length > 0 && !currentMessage) {
      const next = messageQueue.current.shift()!
      setCurrentMessage(next)

      if (hideTimer.current) {
        clearTimeout(hideTimer.current)
      }

      hideTimer.current = setTimeout(() => {
        setCurrentMessage(null)
        if (messageQueue.current.length > 0) {
          const nextInQueue = messageQueue.current[0]
          setCurrentMessage(nextInQueue)
        }
      }, autoHideMs)
    }
  }, [messages, currentMessage, autoHideMs])

  useEffect(() => {
    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current)
      }
    }
  }, [])

  if (!isVisible || !currentMessage) {
    return null
  }

  const emotionEmoji: Record<string, string> = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    surprised: '😮',
    neutral: '😐',
  }

  const emoji = currentMessage.emotion ? emotionEmoji[currentMessage.emotion] || '💬' : '💬'

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        maxWidth: '320px',
        padding: '16px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        zIndex: 9998,
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          @keyframes fadeOut {
            from {
              opacity: 1;
            }
            to {
              opacity: 0;
            }
          }
        `}
      </style>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div
          style={{
            fontSize: '24px',
            minWidth: '32px',
          }}
        >
          {emoji}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '14px',
              lineHeight: '1.5',
              color: '#333',
              wordBreak: 'break-word',
            }}
          >
            {currentMessage.content}
          </div>

          <div
            style={{
              fontSize: '11px',
              color: '#999',
              marginTop: '8px',
            }}
          >
            {new Date(currentMessage.timestamp).toLocaleTimeString()}
          </div>
        </div>

        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '0 4px',
            color: '#999',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
