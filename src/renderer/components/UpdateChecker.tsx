import React, { useState, useEffect } from 'react'
import { ipcRenderer } from 'electron'
import { showToast } from './ToastNotification'

interface UpdateInfo {
  version: string
  releaseDate: string
  releaseNotes?: string
}

export const UpdateChecker: React.FC = () => {
  const [checking, setChecking] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [currentVersionInfo, setCurrentVersionInfo] = useState<UpdateInfo | null>(null)

  useEffect(() => {
    const onChecking = () => {
      setChecking(true)
    }

    const onAvailable = (_event: Electron.IpcRendererEvent, info: UpdateInfo) => {
      setChecking(false)
      setUpdateAvailable(true)
      setCurrentVersionInfo(info)
    }

    const onNotAvailable = () => {
      setChecking(false)
      showToast('已是最新版本', '无需更新', 'success', 3000)
    }

    const onProgress = (_event: Electron.IpcRendererEvent, progressObj: any) => {
      setDownloading(true)
      setProgress(progressObj.percent)
    }

    const onDownloaded = () => {
      setDownloading(false)
      setProgress(0)
      showToast('更新已就绪', '请重启应用以安装更新', 'success', 5000)
    }

    const onError = (_event: Electron.IpcRendererEvent, error: { message: string }) => {
      setChecking(false)
      setDownloading(false)
      showToast('更新失败', error.message, 'error', 5000)
    }

    ipcRenderer.on('update:checking', onChecking)
    ipcRenderer.on('update:available', onAvailable)
    ipcRenderer.on('update:not-available', onNotAvailable)
    ipcRenderer.on('update:progress', onProgress)
    ipcRenderer.on('update:downloaded', onDownloaded)
    ipcRenderer.on('update:error', onError)

    return () => {
      ipcRenderer.removeListener('update:checking', onChecking)
      ipcRenderer.removeListener('update:available', onAvailable)
      ipcRenderer.removeListener('update:not-available', onNotAvailable)
      ipcRenderer.removeListener('update:progress', onProgress)
      ipcRenderer.removeListener('update:downloaded', onDownloaded)
      ipcRenderer.removeListener('update:error', onError)
    }
  }, [])

  const handleCheckUpdate = async () => {
    setChecking(true)
    await ipcRenderer.invoke('update:check')
  }

  const handleDownload = async () => {
    setDownloading(true)
    await ipcRenderer.invoke('update:download')
  }

  const handleRestart = () => {
    ipcRenderer.send('update:quitAndInstall')
  }

  return (
    <div style={{ display: 'inline-block' }}>
      {!updateAvailable ? (
        <button
          onClick={handleCheckUpdate}
          disabled={checking || downloading}
          style={{
            padding: '8px 16px',
            backgroundColor: checking || downloading ? '#ccc' : '#4a90d9',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: checking || downloading ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            opacity: checking || downloading ? 0.7 : 1,
          }}
        >
          {checking ? '检查中...' : '检查更新'}
        </button>
      ) : (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#666' }}>
            新版本 {currentVersionInfo?.version} 可用
          </span>
          <button
            onClick={handleDownload}
            disabled={downloading}
            style={{
              padding: '6px 12px',
              backgroundColor: downloading ? '#ccc' : '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: downloading ? 'not-allowed' : 'pointer',
              fontSize: '12px',
            }}
          >
            {downloading ? `下载中 ${progress.toFixed(0)}%` : '立即下载'}
          </button>
          {!downloading && (
            <button
              onClick={handleRestart}
              style={{
                padding: '6px 12px',
                backgroundColor: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              重启安装
            </button>
          )}
        </div>
      )}

      {downloading && (
        <div
          style={{
            marginTop: '8px',
            width: '200px',
            height: '4px',
            backgroundColor: '#f0f0f0',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: '#4a90d9',
              transition: 'width 0.3s',
            }}
          />
        </div>
      )}
    </div>
  )
}
