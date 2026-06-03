# 独有桌宠 - Desktop Pet

AI 驱动的 3D 虚拟桌面宠物，基于 Electron + Three.js + VRM 技术栈。

## ✨ 特性

- 🖥️ **透明窗口** - 无边框透明设计，始终置顶，鼠标穿透
- 🎭 **3D VRM 形象** - 支持表情/动画/口型同步/物理骨骼
- 🤖 **AI 对话** - 本地 Ollama + 云端混合 AI，智能降级
- 🎤 **语音交互** - Whisper.cpp 语音识别 + Piper TTS 语音合成
- 💬 **主动关怀** - 疲劳检测/久坐提醒/情绪识别
- 🔒 **隐私保护** - 数据本地加密，零默认上传

## 📦 安装

### 系统要求

- **操作系统**: Windows 10+ / macOS 11+ / Ubuntu 20.04+
- **CPU**: Intel i5-8 代 / AMD Ryzen 3000+
- **内存**: 8GB+ (推荐 16GB)
- **存储**: 10GB 可用空间

### 开发环境

```bash
# 克隆项目
git clone <repo-url>
cd desktop-pet

# 安装依赖
npm install

# 开发模式运行
npm run electron:dev

# 构建安装包
npm run electron:build
```

## 🚀 使用

### 快捷键

- `Ctrl+Shift+T` - 切换透明
- `Ctrl+Shift+O` - 切换置顶
- `Ctrl+Shift+P` - 切换鼠标穿透
- `Ctrl+Shift+H` - 隐藏/显示

### 功能

1. 首次启动需同意用户协议和隐私政策
2. 点击系统托盘图标可以打开菜单
3. 右键点击桌宠可以打开设置面板
4. 支持文字对话和语音对话

## 📖 技术架构

前端：React 18 + TypeScript + Three.js + @pixiv/three-vrm  
后端：Electron 28 + Ollama + Whisper.cpp + Piper TTS  
状态管理：Zustand  
构建工具：Vite + electron-builder

## 📄 文档

- [完整技术设计文档](docs/plans/2026-01-03-desktop-pet-design.md)

## 📜 开源协议

MIT License

---

**版本**: 1.0.0  
**作者**: MonkeyCode  
**最后更新**: 2026-01-03
