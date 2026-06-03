import React, { useEffect, useState } from 'react'

interface ToastNotification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  duration?: number
}

interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  maxNotifications?: number
}

const toastHandlers = new Set<(toast: ToastNotification) => void>()

export function showToast(
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  duration: number = 5000
) {
  const toast: ToastNotification = {
    id: Math.random().toString(36).substr(2, 9),
    title,
    message,
    type,
    duration,
  }

  toastHandlers.forEach((handler) => handler(toast))
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  position = 'top-right',
  maxNotifications = 3,
}) => {
  const [notifications, setNotifications] = useState<ToastNotification[]>([])

  useEffect(() => {
    const handler = (toast: ToastNotification) => {
      setNotifications((prev) => {
        const updated = [...prev, toast]
        if (updated.length > maxNotifications) {
          return updated.slice(1)
        }
        return updated
      })

      // 自动移除
      if (toast.duration && toast.duration > 0) {
        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== toast.id))
        }, toast.duration)
      }
    }

    toastHandlers.add(handler)
    return () => {
      toastHandlers.delete(handler)
    }
  }, [maxNotifications])

  const positionStyles = {
    'top-right': { top: '20px', right: '20px' },
    'top-left': { top: '20px', left: '20px' },
    'bottom-right': { bottom: '20px', right: '20px' },
    'bottom-left': { bottom: '20px', left: '20px' },
  }

  const typeColors = {
    info: { bg: '#e3f2fd', border: '#2196f3', icon: 'ℹ️' },
    success: { bg: '#e8f5e9', border: '#4caf50', icon: '✅' },
    warning: { bg: '#fff3e0', border: '#ff9800', icon: '⚠️' },
    error: { bg: '#ffebee', border: '#f44336', icon: '❌' },
  }

  return (
    <div
      style={{
        position: 'fixed',
        ...positionStyles[position],
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {notifications.map((notification) => {
        const colors = typeColors[notification.type]
        return (
          <div
            key={notification.id}
            style={{
              minWidth: '300px',
              maxWidth: '400px',
              padding: '16px',
              backgroundColor: colors.bg,
              borderLeft: `4px solid ${colors.border}`,
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              animation: 'slideInRight 0.3s ease-out',
            }}
          >
            <style>
              {`
                @keyframes slideInRight {
                  from {
                    transform: translateX(100%);
                    opacity: 0;
                  }
                  to {
                    transform: translateX(0);
                    opacity: 1;
                  }
                }
              `}
            </style>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>{colors.icon}</span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '14px',
                    marginBottom: '4px',
                    color: '#333',
                  }}
                >
                  {notification.title}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#666',
                    lineHeight: '1.4',
                  }}
                >
                  {notification.message}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
