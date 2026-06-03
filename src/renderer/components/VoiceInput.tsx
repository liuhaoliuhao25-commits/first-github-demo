import React, { useState, useEffect } from 'react'
import { voiceAPI } from '../api/voice'

export const VoiceInput: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false)
  const [transcription, setTranscription] = useState('')

  useEffect(() => {
    const unsubscribeStart = voiceAPI.onRecordingStarted(() => {
      setIsRecording(true)
    })

    const unsubscribeTranscription = voiceAPI.onTranscription((text: string) => {
      setTranscription(text)
      setIsRecording(false)
    })

    const unsubscribeComplete = voiceAPI.onSpeechComplete(() => {
      // 语音播放完成
    })

    const unsubscribeError = voiceAPI.onError((error: string) => {
      console.error('Voice error:', error)
      setIsRecording(false)
    })

    return () => {
      unsubscribeStart()
      unsubscribeTranscription()
      unsubscribeComplete()
      unsubscribeError()
    }
  }, [])

  const handleStartRecording = async () => {
    if (isRecording) {
      const result = await voiceAPI.stopRecording()
      if (result) {
        setTranscription(result)
      }
    } else {
      await voiceAPI.startRecording()
    }
  }

  const handleCancel = async () => {
    await voiceAPI.cancelRecording()
    setIsRecording(false)
    setTranscription('')
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '80px',
        right: '20px',
        zIndex: 9998,
      }}
    >
      {/* 语音按钮 */}
      <button
        onClick={handleStartRecording}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: isRecording ? '#ff4444' : '#4a90d9',
          color: 'white',
          cursor: 'pointer',
          fontSize: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          transition: 'background-color 0.3s',
        }}
        title={isRecording ? '点击停止录音' : '按住说话'}
      >
        🎤
      </button>

      {/* 录音状态提示 */}
      {isRecording && (
        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            right: '0',
            padding: '12px 16px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            minWidth: '200px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>🔴</span>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>正在录音...</span>
          </div>
          
          <div style={{ fontSize: '13px', color: '#666' }}>
            点击按钮停止并识别
          </div>

          <button
            onClick={handleCancel}
            style={{
              marginTop: '4px',
              padding: '6px 12px',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            取消
          </button>
        </div>
      )}

      {/* 识别结果 */}
      {transcription && !isRecording && (
        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            right: '0',
            padding: '12px 16px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: '200px',
            maxWidth: '300px',
          }}
        >
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
            识别结果：
          </div>
          <div style={{ fontSize: '14px', color: '#333' }}>
            {transcription}
          </div>
        </div>
      )}
    </div>
  )
}
