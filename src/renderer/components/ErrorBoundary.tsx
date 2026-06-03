import React, { useEffect } from 'react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // 报告到主进程
    if (window.electronAPI) {
      window.electronAPI.reportError({
        type: 'react-error',
        message: error.message,
        stack: error.stack,
        timestamp: Date.now(),
        context: {
          componentStack: errorInfo.componentStack,
        },
      })
    }

    console.error('React Error Boundary caught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '20px',
            backgroundColor: '#ffebee',
            borderRadius: '8px',
            border: '1px solid #f44336',
            color: '#c62828',
          }}
        >
          <h3 style={{ marginTop: 0 }}>出错了</h3>
          <p style={{ marginBottom: '8px' }}>
            {this.state.error?.message || '未知错误'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.reload()
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            重新加载
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook 形式的全局错误监听
export function useGlobalErrorHandler(onError?: (error: string) => void) {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error)
      
      if (window.electronAPI) {
        window.electronAPI.reportError({
          type: 'window-error',
          message: event.message,
          timestamp: Date.now(),
          context: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        })
      }

      onError?.(event.message)
    }

    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)
      
      if (window.electronAPI) {
        window.electronAPI.reportError({
          type: 'promise-rejection',
          message: event.reason?.message || String(event.reason),
          timestamp: Date.now(),
        })
      }

      onError?.(event.reason?.message || String(event.reason))
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [onError])
}
