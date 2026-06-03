# Phase 1 MVP 实施计划

**阶段目标**: 实现核心桌宠体验，可安装可运行的 MVP 版本  
**开发周期**: 6 周  
**交付物**: 可安装包 + 基础配置面板 + 日志系统 + 测试 VRM 模型

---

## 任务列表

- [ ] 1. 初始化项目结构和开发环境
   - [ ] 1.1 创建 Electron + Vite + React + TypeScript 项目骨架
     - 配置 electron-vite 构建工具链
     - 设置主进程/渲染进程/预加载脚本目录结构
     - 配置 TypeScript tsconfig.json (严格模式)
   
   - [ ] 1.2 配置 ESLint + Prettier 代码规范
     - 创建 .eslintrc.cjs 配置文件
     - 创建 .prettierrc 配置文件
     - 设置 Git Husky pre-commit 钩子
   
   - [ ] 1.3 设置 Vitest 单元测试框架
     - 安装 vitest + @testing-library/react
     - 配置 vitest.config.ts
     - 创建 tests/unit 示例测试文件验证配置
   
   - [ ] 1.4 初始化 Git 仓库和分支策略
     - 创建 main/develop/feature 分支模型
     - 创建 .gitignore (Node + Electron + 构建产物)
     - 提交初始 commit

- [ ] 2. 实现 Electron 主进程核心功能
   - [ ] 2.1 创建透明窗口管理系统
     - 实现 createPetWindow() 函数 (frame: false, transparent: true, alwaysOnTop: true)
     - 配置 webPreferences (nodeIntegration: false, contextIsolation: true)
     - Windows 特定适配 (禁用圆角、DWM 透明增强)
     - macOS 特定适配 (setVibrancy('fullscreen-ui'))
   
   - [ ] 2.2 实现窗口状态控制
     - 实现 setIgnoreMouseEvents() 鼠标穿透功能
     - 实现 alwaysOnTop 切换逻辑
     - 实现透明/不透明切换逻辑
   
   - [ ] 2.3 实现全局快捷键注册
     - Ctrl+Shift+T: 切换透明
     - Ctrl+Shift+O: 切换置顶
     - Ctrl+Shift+P: 切换鼠标穿透
     - Ctrl+Shift+H: 隐藏/显示桌宠
   
   - [ ] 2.4 实现全屏应用检测与避让
     - 定时检测当前聚焦应用 (每 2 秒)
     - 检测全屏状态 (使用 native 模块)
     - 全屏时临时禁用置顶，退出后恢复
   
   - [ ] 2.5 创建 IPC 通信通道
     - 定义 ipcMain 处理函数 (window-control, pet-action, ai-request)
     - 实现 contextBridge 暴露安全 API 给渲染进程
     - 创建 ipc 通道类型定义文件

- [ ] 3. 实现 Three.js VRM 渲染系统
   - [ ] 3.1 配置 Three.js 渲染环境
     - 安装 three @pixiv/three-vrm @pixiv/three-vrm-core
     - 创建 WebGLRenderer (alpha: true, antialias: false)
     - 设置动态分辨率 (小窗口 0.5x, 中窗口 1.0x, 大窗口 1.5x)
     - 实现后台降帧 (document.hidden 时 10fps)
   
   - [ ] 3.2 实现 VRM 模型加载器
     - 使用 GLTFLoader + VRMLoaderPlugin
     - 实现 loadVRM(url) 异步函数
     - 配置 VRM 组件 (humanoid, expressionManager, lookAt, springBone)
     - 错误处理 (文件损坏/格式错误)
   
   - [ ] 3.3 实现表情控制系统
     - 定义表情预设映射 (happy/angry/sad/surprised/neutral)
     - 实现 setExpression(name, weight) 函数
     - 权重限制 (0-1 clamp)
     - 支持自定义 blendshape
   
   - [ ] 3.4 实现基础动画系统
     - 加载 VRM 内置动画 clips
     - 实现 playAnimation(name) 状态机
     - 动画过渡 (fadeIn 0.5s)
     - 支持 idle/walk/sleep 三种基础状态
   
   - [ ] 3.5 实现视线跟随 (LookAt)
     - 配置 lookAt.autoUpdate = true
     - 实现鼠标位置追踪
     - 限制最大旋转角度 (避免脖子折断)
   
   - [ ] 3.6 配置物理骨骼 (SpringBone)
     - 设置重力向量 {x: 0, y: -1, z: 0}
     - 实现 springBone.update() 每帧调用
     - 支持头发/衣物自然摆动

- [ ] 4. 实现 React 渲染进程 UI
   - [ ] 4.1 创建设置面板组件
     - 实现左侧 Tab 导航 (形象/AI/语音/互动)
     - 形象配置 Tab: 模型预览区 + [选择/导入/删除] 按钮
     - AI 配置 Tab: 模式选择 + 模型下拉框 + 上下文长度滑块
     - 语音配置 Tab: 音色选择 + 语速滑块 + 降噪开关
     - 使用 Design Tokens (颜色/圆角/阴影)
   
   - [ ] 4.2 实现对话气泡组件
     - 半透明背景 (rgba(255,255,255,0.95))
     - 圆角 16px + 阴影 + 毛玻璃效果
     - 尾巴连接 (CSS border 实现)
     - popIn 动画 (0.3s cubic-bezier)
     - 最大宽度 280px 自动换行
   
   - [ ] 4.3 实现系统托盘菜单
     - 创建 tray 图标 (多分辨率)
     - 菜单项：显示/隐藏、设置、检查更新、退出
     - 点击托盘图标弹出菜单
   
   - [ ] 4.4 实现通知 Toast 组件
     - 右下角滑入动画
     - 支持 success/warning/error/info 类型
     - 5 秒自动消失
     - 支持手动关闭

- [ ] 5. 集成 Ollama 本地 AI 对话
   - [ ] 5.1 创建 Ollama 进程管理器
     - 实现 checkOllamaRunning() 检测
     - 实现 autoStartOllama() 自动启动
     - 进程守护 (崩溃自动重启)
     - 应用退出时清理进程
   
   - [ ] 5.2 实现 AI 路由器 (混合模式)
     - 定义优先级策略 (LOCAL_FIRST/CLOUD_FIRST/LOCAL_ONLY)
     - 实现 localChat() 调用 Ollama API
     - 实现 cloudChat() 调用云端 API (备用)
     - 失败自动降级逻辑
   
   - [ ] 5.3 实现对话上下文管理
     - 创建 Zustand store 管理 messages 数组
     - 限制历史记录长度 (最多 20 条)
     - 实现 getRecentHistory(limit) 函数
     - 系统提示词构建 (人设锁定)
   
   - [ ] 5.4 实现流式响应处理
     - 使用 fetch + ReadableStream
     - 逐字显示 AI 回复
     - 支持中断生成 (用户打断)
   
   - [ ] 5.5 实现离线降级方案
     - 检测 Ollama 不可用时展示友好提示
     - 提供 [打开 Ollama] [切换云端] 按钮
     - 实现极简规则引擎回复 (可选)

- [ ] 6. 集成语音识别与合成
   - [ ] 6.1 集成 Whisper.cpp
     - 安装 whisper.cpp Node.js 绑定
     - 加载 ggml-base.bin 模型
     - 实现 transcribe(audioBuffer) 函数
     - 配置中文识别 (language: 'zh')
   
   - [ ] 6.2 实现麦克风录音管理
     - 使用 navigator.mediaDevices.getUserMedia
     - 实现 MediaRecorder 录音
     - 转换为 Float32Array 给 Whisper
     - 权限检测与错误处理
   
   - [ ] 6.3 集成 Piper TTS
     - 安装 Piper TTS Node.js 绑定
     - 加载中文语音模型 (zh_CN_female.bin)
     - 实现 speak(text, options) 函数
     - 支持语速/音量调节
   
   - [ ] 6.4 实现语音对话流程
     - 按住说话 → 录音 → Whisper 识别 → 显示文字
     - AI 回复 → TTS 合成 → 播放音频
     - 语音/文字切换开关

- [ ] 7. 实现日志与错误处理系统
   - [ ] 7.1 创建分级日志服务
     - 定义 LogLevel 枚举 (DEBUG/INFO/WARN/ERROR)
     - 实现 log(level, message, context) 函数
     - 分级存储到 logs/debug.log / info.log / error.log
   
   - [ ] 7.2 实现错误捕获与导出
     - 全局 uncaughtException 监听
     - 捕获渲染进程错误 (window.onerror)
     - 实现 exportErrorReport(errorId) 导出 JSON 报告
     - 包含系统信息 + 最近日志
   
   - [ ] 7.3 实现用户友好错误提示
     - 定义错误消息映射表
     - "Ollama 未启动" → "请在系统托盘菜单中启动 Ollama"
     - "麦克风权限缺失" → "请在系统设置中授予麦克风权限"
     - 实现 showUserFriendlyError(error) 函数
   
   - [ ] 7.4 创建性能监控
     - 监控 FPS (低于 24 记录指标)
     - 监控内存使用 (process.getProcessMemoryInfo)
     - 定时上报 metrics (每 5-10 秒)

- [ ] 8. 实现数据持久化与加密
   - [ ] 8.1 创建本地存储工具
     - 使用 electron-store 存储配置
     - 实现 get/set/delete API
     - 配置文件路径 (~/独有桌宠/config.json)
   
   - [ ] 8.2 实现敏感数据加密
     - 使用 crypto 模块 AES-256-GCM 算法
     - 实现 encrypt(data, category) 函数
     - 密钥派生 (PBKDF2-SHA256, 100000 次迭代)
     - 加密存储 API Key/聊天记录
   
   - [ ] 8.3 实现数据清理功能
     - 清空聊天记录 (DELETE FROM messages)
     - 清空缓存目录 (cache/)
     - 清空音色模型 (voices/)
     - 一键恢复出厂设置

- [ ] 9. 实现主动交互引擎 (基础版)
   - [ ] 9.1 创建用户活动监测
     - 监听 mousemove/keydown/click 事件
     - 记录最后活跃时间
     - 计算闲置时长
   
   - [ ] 9.2 实现定时提醒触发器
     - 工作 45 分钟 → 提醒休息
     - 工作 90 分钟 → 提醒活动
     - 凌晨 1-5 点活跃 → 提醒睡觉
     - 冷却时间防止骚扰
   
   - [ ] 9.3 实现关怀通知
     - 触发时弹出对话气泡
     - 播放温柔提示音
     - 支持 snooze 10 分钟

- [ ] 10. 配置打包与分发
   - [ ] 10.1 配置 electron-builder
     - 创建 electron-builder.config.js
     - Windows: NSIS (安装版) + portable (便携版)
     - macOS: DMG + ZIP
     - Linux: AppImage + deb
   
   - [ ] 10.2 配置代码签名
     - Windows: signtool (避免杀软误报)
     - macOS: notarize (公证)
     - 存储签名证书到 CI secrets
   
   - [ ] 10.3 配置自动更新
     - 安装 electron-updater
     - 配置 publish.provider = 'github'
     - 禁用 autoDownload (手动确认)
     - 实现检查更新 UI
   
   - [ ] 10.4 创建安装包测试
     - 在 Windows 10/11 测试安装
     - 在 macOS 11+ 测试安装
     - 验证杀毒软件不误报
     - 验证自动更新功能

- [ ] 11. 编写内置资源与文档
   - [ ] 11.1 准备测试用 VRM 模型
     - 内置 1 个默认角色 (小艾)
     - 确认版权 (CC0 或商用授权)
     - 优化文件大小 (<15MB)
   
   - [ ] 11.2 编写用户协议与隐私政策
     - 创建用户服务协议文档
     - 创建隐私政策文档
     - 实现启动页勾选同意 UI
   
   - [ ] 11.3 编写 README 与安装指南
     - 项目介绍与特性
     - 系统要求 (Win/Mac/Linux)
     - 安装步骤截图
     - 常见问题 FAQ

- [ ] 12. 测试与质量保证
   - [ ] 12.1 单元测试
     - [ ] 12.1.1 VRM 渲染器单元测试 *
       - 测试加载 VRM 成功/失败
       - 测试表情权重范围限制
       - 测试动画切换
     
     - [ ] 12.1.2 AI 路由器单元测试 *
       - 测试本地优先策略
       - 测试降级逻辑
       - 测试 AI 都不可用时错误抛出
   
   - [ ] 12.2 集成测试
     - [ ] 12.2.1 透明窗口测试 *
       - 测试背景透明度
       - 测试 alwaysOnTop
       - 测试鼠标穿透功能
     
     - [ ] 12.2.2 语音对话流程测试 *
       - 测试完整对话链路
       - 测试录音 → 识别 → 回复 → 合成
   
   - [ ] 12.3 性能基准测试 *
     - 测试冷启动时间 (<3s)
     - 测试内存占用 (<300MB)
     - 测试 FPS (>=30)
     - 测试 AI 响应延迟 (<2s)

- [ ] 13. 检查点 - Phase 1 验收
   - [ ] 13.1 确保所有核心功能正常运行
     - 透明窗口渲染正常
     - VRM 模型加载并显示
     - AI 对话正常响应
     - 语音识别与合成可用
     - 设置面板可操作
   
   - [ ] 13.2 确保所有测试通过
     - 运行 npm test 无失败
     - 性能指标达标
     - 如有疑问请询问用户
   
   - [ ] 13.3 准备发布
     - 生成安装包
     - 验证安装流程
     - 准备发布说明

---

## 开发里程碑

| 周次 | 任务 | 交付物 |
|------|------|--------|
| Week 1-2 | 任务 1-2 | Electron 框架 + 透明窗口 |
| Week 3 | 任务 3-4 | VRM 渲染 + UI 组件 |
| Week 4 | 任务 5 | Ollama AI 对话 |
| Week 5 | 任务 6 | 语音识别与合成 |
| Week 6 | 任务 7-13 | 日志/加密/打包/测试 |

---

## 验收标准

- [x] 可安装 exe/dmg/AppImage 包生成
- [x] 透明窗口正常工作 (置顶/穿透/透明)
- [x] VRM 模型加载并支持表情/动画
- [x] Ollama 本地 AI 对话可用
- [x] 语音识别与合成可用
- [x] 设置面板功能完整
- [x] 日志系统正常工作
- [x] 安装包无杀毒软件误报
- [x] 所有单元测试通过
- [x] 性能指标达标 (启动<3s/内存<300MB/FPS>=30)

---

**文档信息**:
- **创建日期**: 2026-01-03
- **阶段**: Phase 1 MVP
- **预计周期**: 6 周
- **优先级**: 高

**下一步**:
1. 确认任务列表无需补充
2. 准备开发环境 (Node 18/Yarn/Git)
3. 开始任务 1: 初始化项目结构
