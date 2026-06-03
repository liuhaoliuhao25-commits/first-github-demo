import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { setupElectronAPI } from './api/electron'

// 设置 Electron API
setupElectronAPI()

const rootElement = document.getElementById('root')

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}
