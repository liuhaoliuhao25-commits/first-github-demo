import React, { useState, useEffect } from 'react'
import { petWindowAPI } from '../api/pet-window'
import { UpdateChecker } from './UpdateChecker'

interface SettingsState {
  alwaysOnTop: boolean
  showOnAllScreens: boolean
  launchOnStartup: boolean
  enableVoiceResponse: boolean
  enableVoiceActivation: boolean
  modelOpacity: number
  modelSize: number
}

export const SettingsPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [settings, setSettings] = useState<SettingsState>({
    alwaysOnTop: true,
    showOnAllScreens: true,
    launchOnStartup: false,
    enableVoiceResponse: true,
    enableVoiceActivation: false,
    modelOpacity: 100,
    modelSize: 100,
  })

  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'voice' | 'appearance'>('general')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const savedSettings = await petWindowAPI.getSettings()
      if (savedSettings) {
        setSettings(savedSettings)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const saveSettings = async (newSettings: Partial<SettingsState>) => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)

    try {
      await petWindowAPI.saveSettings(updated)
    } catch (error) {
      console.error('Failed to save settings:', error)
      setSettings(settings)
    }
  }

  const togglePanel = () => {
    setIsOpen(!isOpen)
  }

  const handleOpacityChange = (value: number) => {
    saveSettings({ modelOpacity: value })
    petWindowAPI.setWindowOpacity(value / 100)
  }

  const handleSizeChange = (value: number) => {
    saveSettings({ modelSize: value })
    petWindowAPI.setModelScale(value / 100)
  }

  if (!isOpen) {
    return (
      <button
        onClick={togglePanel}
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          zIndex: 9999,
          padding: '8px 16px',
          backgroundColor: '#4a90d9',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        ⚙️ 设置
      </button>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '50px',
        right: '10px',
        width: '400px',
        maxHeight: '500px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        zIndex: 9999,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '18px' }}>设置</h3>
        <button
          onClick={togglePanel}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#f5f5f5',
        }}
      >
        {(['general', 'ai', 'voice', 'appearance'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '12px 8px',
              border: 'none',
              background: activeTab === tab ? 'white' : 'transparent',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: activeTab === tab ? '600' : '400',
              borderBottom: activeTab === tab ? '2px solid #4a90d9' : 'none',
            }}
          >
            {tab === 'general' && '⚙️ 常规'}
            {tab === 'ai' && '🤖 AI'}
            {tab === 'voice' && '🎤 语音'}
            {tab === 'appearance' && '🎨 外观'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
        {activeTab === 'general' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#f9f9f9', 
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: '14px' }}>检查更新</div>
                <div style={{ fontSize: '12px', color: '#666' }}>当前版本：1.0.0</div>
              </div>
              <UpdateChecker />
            </div>

            <SettingToggle
              label="总是置顶"
              description="窗口始终显示在其他窗口上方"
              checked={settings.alwaysOnTop}
              onChange={(checked) => saveSettings({ alwaysOnTop: checked })}
            />
            <SettingToggle
              label="所有屏幕显示"
              description="在多显示器上同时显示"
              checked={settings.showOnAllScreens}
              onChange={(checked) => saveSettings({ showOnAllScreens: checked })}
            />
            <SettingToggle
              label="开机自启动"
              description="系统启动时自动运行"
              checked={settings.launchOnStartup}
              onChange={(checked) => saveSettings({ launchOnStartup: checked })}
            />
          </div>
        )}

        {activeTab === 'ai' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <SettingToggle
              label="语音回复"
              description="AI 回复时自动播放语音"
              checked={settings.enableVoiceResponse}
              onChange={(checked) => saveSettings({ enableVoiceResponse: checked })}
            />
            <SettingToggle
              label="语音唤醒"
              description="通过语音唤醒 AI (需要麦克风)"
              checked={settings.enableVoiceActivation}
              onChange={(checked) => saveSettings({ enableVoiceActivation: checked })}
            />
          </div>
        )}

        {activeTab === 'voice' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '12px', backgroundColor: '#fff3cd', borderRadius: '6px', fontSize: '13px' }}>
              ⚠️ 语音功能需要安装 Whisper.cpp 和 Piper TTS
              <br />
              请确保已正确配置本地 AI 服务
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <SliderControl
              label="透明度"
              value={settings.modelOpacity}
              min={20}
              max={100}
              onChange={handleOpacityChange}
              renderValue={(v) => `${v}%`}
            />
            <SliderControl
              label="模型大小"
              value={settings.modelSize}
              min={50}
              max={150}
              onChange={handleSizeChange}
              renderValue={(v) => `${v}%`}
            />
          </div>
        )}
      </div>
    </div>
  )
}

interface SettingToggleProps {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

const SettingToggle: React.FC<SettingToggleProps> = ({ label, description, checked, onChange }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div>
      <div style={{ fontWeight: 500, fontSize: '14px' }}>{label}</div>
      <div style={{ fontSize: '12px', color: '#666' }}>{description}</div>
    </div>
    <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ opacity: 0, width: 0, height: 0 }}
      />
      <span
        style={{
          position: 'absolute',
          cursor: 'pointer',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: checked ? '#4a90d9' : '#ccc',
          borderRadius: '26px',
          transition: '0.3s',
        }}
      >
        <span
          style={{
            position: 'absolute',
            height: '20px',
            width: '20px',
            left: checked ? '26px' : '3px',
            bottom: '3px',
            backgroundColor: 'white',
            borderRadius: '50%',
            transition: '0.3s',
          }}
        />
      </span>
    </label>
  </div>
)

interface SliderControlProps {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  renderValue: (value: number) => string
}

const SliderControl: React.FC<SliderControlProps> = ({ label, value, min, max, onChange, renderValue }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
      <span style={{ fontWeight: 500, fontSize: '14px' }}>{label}</span>
      <span style={{ fontSize: '13px', color: '#666' }}>{renderValue(value)}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ width: '100%', cursor: 'pointer' }}
    />
  </div>
)
