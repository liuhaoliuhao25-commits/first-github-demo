import * as THREE from 'three'
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export interface VRMRendererConfig {
  canvas?: HTMLCanvasElement
  width?: number
  height?: number
  pixelRatio?: number
}

export class VRMRenderer {
  private vrm: VRM | null = null
  private mixer: THREE.AnimationMixer
  private clock: THREE.Clock
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private canvas: HTMLCanvasElement

  // 动画状态
  private currentAction: THREE.AnimationAction | null = null
  private animations: Map<string, THREE.AnimationClip> = new Map()

  constructor(config: VRMRendererConfig = {}) {
    const {
      canvas,
      width = 400,
      height = 600,
      pixelRatio = Math.min(window.devicePixelRatio, 1.5),
    } = config

    // 创建或复用 Canvas
    this.canvas = canvas || document.createElement('canvas')
    this.canvas.id = 'vrm-canvas'
    this.canvas.width = width
    this.canvas.height = height

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
    })

    this.renderer.setPixelRatio(pixelRatio)
    this.renderer.setSize(width, height)

    // 创建场景
    this.scene = new THREE.Scene()

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(
      30.0,
      width / height,
      0.1,
      20.0
    )
    this.camera.position.set(0.0, 1.4, 2.0)

    // 添加光源
    this.setupLights()

    // 初始化时钟和混合器
    this.clock = new THREE.Clock()
    this.mixer = new THREE.AnimationMixer(this.scene)

    // 启动渲染循环
    this.animate()
  }

  private setupLights(): void {
    const light = new THREE.DirectionalLight(0xffffff, 0.8)
    light.position.set(1.0, 1.0, 1.0)
    this.scene.add(light)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
    this.scene.add(ambientLight)
  }

  async loadVRM(url: string): Promise<VRM> {
    const loader = new GLTFLoader()
    loader.crossOrigin = 'anonymous'

    // 注册 VRM 插件
    loader.register((parser: any) => {
      return new VRMLoaderPlugin(parser, {
        autoUpdateHumanBones: true,
      })
    })

    try {
      const gltf = await loader.loadAsync(url)

      const vrm = this.vrm = gltf.userData.vrm

      // 添加到场景
      vrm.scene.name = 'VRMRoot'
      this.scene.add(vrm.scene)

      // 配置 LookAt
      this.setupLookAt()

      // 加载动画
      this.loadAnimations(gltf)

      // 初始化物理骨骼
      this.setupSpringBone()

      console.log('VRM loaded successfully')
      return vrm
    } catch (error) {
      console.error('Failed to load VRM:', error)
      throw error
    }
  }

  private setupLookAt(): void {
    if (!this.vrm?.lookAt) return

    // VRM 3.x: lookAt 已经自动配置
    console.log('LookAt initialized')
  }

  private loadAnimations(gltf: any): void {
    if (!gltf.animations || !this.vrm) return

    gltf.animations.forEach((clip: THREE.AnimationClip) => {
      this.animations.set(clip.name, clip)
    })

    console.log(`Loaded ${this.animations.size} animations`)
  }

  private setupSpringBone(): void {
    if (!this.vrm?.springBoneManager) return

    // VRM 3.x: springBone 自动更新
    console.log('Spring bone initialized')
  }

  // 表情控制
  setExpression(name: string, weight: number = 1.0): void {
    if (!this.vrm?.expressionManager) return

    // 限制权重范围 0-1
    const clampedWeight = Math.max(0, Math.min(1, weight))
    
    this.vrm.expressionManager.setValue(name, clampedWeight)
  }

  // 动画播放
  playAnimation(name: string, fadeInDuration: number = 0.5): void {
    const clip = this.animations.get(name)
    if (!clip || !this.vrm) return

    const action = this.mixer.clipAction(clip)
    
    if (this.currentAction && this.currentAction !== action) {
      this.currentAction.fadeOut(fadeInDuration)
    }

    this.currentAction = action
    action.reset()
    action.fadeIn(fadeInDuration)
    action.play()
  }

  // 更新视线（鼠标跟随）
  updateLookAt(targetX: number, targetY: number): void {
    if (!this.vrm?.lookAt) return

    // VRM 3.x: 使用 target 属性
    this.vrm.lookAt.target?.position.set(targetX, targetY, 0)
  }

  // 鼠标追踪
  setupMouseTracking(): void {
    const canvas = this.canvas

    canvas.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      this.updateLookAt(x, y)
    })
  }

  // 渲染循环
  private animate = (): void => {
    requestAnimationFrame(this.animate)

    const delta = this.clock.getDelta()

    // 更新混合器
    this.mixer.update(delta)

    // 更新物理骨骼
    if (this.vrm?.springBoneManager) {
      this.vrm.springBoneManager.update(delta)
    }

    // 渲染场景
    this.renderer.render(this.scene, this.camera)
  }

  // 调整窗口大小
  resize(width: number, height: number): void {
    this.canvas.width = width
    this.canvas.height = height
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  // 获取 Canvas
  getCanvas(): HTMLCanvasElement {
    return this.canvas
  }

  // 清理资源
  dispose(): void {
    if (this.vrm) {
      VRMUtils.deepDispose(this.vrm.scene)
      this.vrm = null
    }

    this.renderer.dispose()
    this.mixer.stopAllAction()
    this.animations.clear()
  }
}
