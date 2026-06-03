import React from 'react'
import { systemTrayAPI } from '../api/system-tray'

interface SystemTrayMenuProps {
  isVisible: boolean
  position: { x: number; y: number }
  onClose: () => void
}

export const SystemTrayMenu: React.FC<SystemTrayMenuProps> = ({
  isVisible,
  position,
  onClose,
}) => {
  if (!isVisible) return null

  const handleMenuItem = async (action: string) => {
    onClose()

    switch (action) {
      case 'toggle':
        await systemTrayAPI.toggleWindow()
        break
      case 'settings':
        await systemTrayAPI.openSettings()
        break
      case 'restart':
        await systemTrayAPI.restartApp()
        break
      case 'quit':
        await systemTrayAPI.quitApp()
        break
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9997,
        }}
        onClick={onClose}
      />

      {/* Menu */}
      <div
        style={{
          position: 'fixed',
          top: position.y,
          left: position.x,
          minWidth: '180px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          zIndex: 9998,
          padding: '8px 0',
        }}
      >
        <MenuItem
          icon="👁️"
          label="显示/隐藏"
          onClick={() => handleMenuItem('toggle')}
        />
        <MenuItem
          icon="⚙️"
          label="设置"
          onClick={() => handleMenuItem('settings')}
        />
        <div style={{ height: '1px', backgroundColor: '#e0e0e0', margin: '8px 0' }} />
        <MenuItem
          icon="🔄"
          label="重启应用"
          onClick={() => handleMenuItem('restart')}
        />
        <MenuItem
          icon="❌"
          label="退出"
          onClick={() => handleMenuItem('quit')}
          danger
        />
      </div>
    </>
  )
}

interface MenuItemProps {
  icon: string
  label: string
  onClick: () => void
  danger?: boolean
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onClick, danger }) => (
  <div
    onClick={onClick}
    style={{
      padding: '10px 16px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '14px',
      color: danger ? '#d93025' : '#333',
      transition: 'background-color 0.2s',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = danger ? '#ffebee' : '#f5f5f5'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent'
    }}
  >
    <span style={{ fontSize: '16px' }}>{icon}</span>
    <span>{label}</span>
  </div>
)
