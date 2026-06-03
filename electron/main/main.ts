import { app, BrowserWindow, ipcMain, Tray, Menu } from 'electron'
import path from 'path'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

const isDev = process.env.NODE_ENV === 'development'

function createPetWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    focusable: false,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webgl: true,
      webgl2: true,
      backgroundThrottling: false,
      powerSaveBlocker: false,
      preload: path.join(__dirname, '../preload.js'),
    },
  })

  // Windows 特定优化
  if (process.platform === 'win32') {
    mainWindow.setWindowButtonVisibility(false)
    mainWindow.setBackgroundColor('#00000000')
  }

  // macOS 特定优化
  if (process.platform === 'darwin') {
    mainWindow.setVibrancy('fullscreen-ui')
  }

  // 加载页面
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // 鼠标穿透逻辑
  let isMouseOver = false
  mainWindow.on('leave-html-full-screen', () => {
    mainWindow?.setIgnoreMouseEvents(true, { forward: true })
  })

  return mainWindow
}

function createTray() {
  tray = new Tray(path.join(__dirname, '../resources/icon.png'))
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示/隐藏',
      click: () => {
        if (mainWindow?.isVisible()) {
          mainWindow.hide()
        } else {
          mainWindow?.show()
        }
      },
    },
    {
      label: '设置',
      click: () => {
        mainWindow?.webContents.send('open-settings')
      },
    },
    { type: 'separator' },
    {
      label: '检查更新',
      click: () => {
        mainWindow?.webContents.send('check-update')
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit()
      },
    },
  ])

  tray.setToolTip('独有桌宠')
  tray.setContextMenu(contextMenu)
}

// IPC 处理
ipcMain.on('window-control', (event, action: string) => {
  if (!mainWindow) return

  switch (action) {
    case 'toggle-transparent':
      // TODO: 实现透明切换
      break
    case 'toggle-ontop':
      // TODO: 实现置顶切换
      break
    case 'toggle-mouse-through':
      // TODO: 实现鼠标穿透切换
      break
  }
})

app.whenReady().then(() => {
  createPetWindow()
  createTray()

  // 注册全局快捷键
  // TODO: 实现快捷键注册
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createPetWindow()
  }
})
