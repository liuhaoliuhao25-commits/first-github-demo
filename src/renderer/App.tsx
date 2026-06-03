import { useEffect, useRef } from 'react'
import './App.css'

function App() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // TODO: 初始化 Three.js VRM 渲染
    console.log('App mounted, initializing VRM renderer...')
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
