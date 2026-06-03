import { useEffect, useRef, useState, useCallback } from 'react'
import { VRMRenderer } from './vrm-renderer'
import type { VRM } from '@pixiv/three-vrm'

export interface UseVRMRendererOptions {
  width?: number
  height?: number
  vrmUrl?: string
}

export interface UseVRMRendererReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>
  vrm: VRM | null
  renderer: VRMRenderer | null
  isLoading: boolean
  error: Error | null
  setExpression: (name: string, weight?: number) => void
  playAnimation: (name: string, fadeInDuration?: number) => void
  resize: (width: number, height: number) => void
}

export function useVRMRenderer(options: UseVRMRendererOptions = {}): UseVRMRendererReturn {
  const {
    width = 400,
    height = 600,
    vrmUrl,
  } = options

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<VRMRenderer | null>(null)
  const [vrm, setVrm] = useState<VRM | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // 初始化 VRM 渲染器
  useEffect(() => {
    if (!canvasRef.current) return

    const renderer = new VRMRenderer({
      canvas: canvasRef.current,
      width,
      height,
    })

    rendererRef.current = renderer
    renderer.setupMouseTracking()

    // 加载 VRM 模型
    if (vrmUrl) {
      renderer.loadVRM(vrmUrl)
        .then((loadedVrm) => {
          setVrm(loadedVrm)
          setIsLoading(false)
        })
        .catch((err) => {
          setError(err)
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }

    // 清理
    return () => {
      renderer.dispose()
      rendererRef.current = null
    }
  }, [])

  const setExpression = useCallback((name: string, weight: number = 1.0) => {
    rendererRef.current?.setExpression(name, weight)
  }, [])

  const playAnimation = useCallback((name: string, fadeInDuration: number = 0.5) => {
    rendererRef.current?.playAnimation(name, fadeInDuration)
  }, [])

  const resize = useCallback((width: number, height: number) => {
    rendererRef.current?.resize(width, height)
  }, [])

  return {
    canvasRef,
    vrm,
    renderer: rendererRef.current,
    isLoading,
    error,
    setExpression,
    playAnimation,
    resize,
  }
}
