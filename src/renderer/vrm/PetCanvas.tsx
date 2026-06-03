import React, { useEffect } from 'react'
import { useVRMRenderer } from './use-vrm-renderer'

interface PetCanvasProps {
  vrmUrl?: string
  width?: number
  height?: number
  onExpressionChange?: (expression: string) => void
}

export const PetCanvas: React.FC<PetCanvasProps> = ({
  vrmUrl = '/models/default.vrm',
  width = 400,
  height = 600,
  onExpressionChange,
}) => {
  const {
    canvasRef,
    vrm,
    isLoading,
    error,
    setExpression,
    playAnimation,
    resize,
  } = useVRMRenderer({
    vrmUrl,
    width,
    height,
  })

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        resize(rect.width, rect.height)
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 测试表情控制（后续会替换为实际交互逻辑）
  useEffect(() => {
    if (!vrm || !onExpressionChange) return

    // 示例：定期切换表情
    const interval = setInterval(() => {
      setExpression('happy', 0.8)
      setTimeout(() => setExpression('happy', 0), 2000)
    }, 5000)

    return () => clearInterval(interval)
  }, [vrm, setExpression, onExpressionChange])

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        color: '#ff4444'
      }}>
        加载 VRM 模型失败：{error.message}
      </div>
    )
  }

  return (
    <div 
      style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}
    >
      {isLoading ? (
        <div style={{ color: '#666' }}>正在加载虚拟形象...</div>
      ) : (
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
          }}
        />
      )}
    </div>
  )
}
