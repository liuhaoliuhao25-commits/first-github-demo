import { useEffect, useRef } from 'react'
import './App.css'

function App() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.log('App mounted, initializing...')

    // 监听打开设置事件
    window.electronAPI?.onOpenSettings(() => {
      console.log('Open settings requested')
      // TODO: 打开设置面板
    })

    // 监听检查更新事件
    window.electronAPI?.onCheckUpdate(() => {
      console.log('Check update requested')
      // TODO: 检查更新
    })

    return () => {
      console.log('App unmounting...')
    }
  }, [])

  return (
    <div className="app-container" ref={containerRef}>
      {/* VRM 渲染画布 */}
      <canvas id="vrm-canvas" className="vrm-canvas" />

      {/* 对话气泡容器 */}
      <div id="bubble-container" className="bubble-container" />

      {/* TODO: 设置面板 */}
      {/* TODO: 通知 Toast */}
    </div>
  )
}

export default App
