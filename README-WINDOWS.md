# Windows 用户快速开始指南

## 🚀 最简单的方式（3 步）

### 第 1 步：下载安装包

访问 GitHub Releases 页面下载：
```
https://github.com/liuhaoliuhao25-commits/first-github-demo/releases

下载最新版本的 .exe 安装文件
```

### 第 2 步：安装

```
双击 AI 桌宠-1.0.0-win-x64.exe
→ 点击"下一步"
→ 选择安装位置（或保持默认）
→ 点击"安装"
→ 等待安装完成
→ 点击"完成"并运行
```

### 第 3 步：使用

```
1. 桌面会出现"AI 桌宠"图标
2. 双击启动
3. 系统托盘（右下角）出现宠物图标
4. 右键托盘图标可打开设置
```

---

## 💻 如果你是想开发或自定义

### 前提条件

#### 1. 安装 Node.js
- 访问：https://nodejs.org/
- 下载 **LTS 版本**（推荐 18.x 或 20.x）
- 一路"下一步"安装
- 验证安装：
  ```cmd
  node --version
  npm --version
  ```

#### 2. 安装 Git（可选）
- 访问：https://git-scm.com/download/win
- 下载安装 Git for Windows
- 验证安装：
  ```cmd
  git --version
  ```

---

### 快速开始（使用批处理脚本）

#### 1. 下载项目
```cmd
方法 1（使用 Git）:
git clone https://github.com/liuhaoliuhao25-commits/first-github-demo.git

方法 2（手动下载）:
1. 访问上述 GitHub 链接
2. 点击 "Code" → "Download ZIP"
3. 解压到任意目录
```

#### 2. 运行启动脚本
```cmd
cd first-github-demo
双击运行 run-windows.bat
```

#### 3. 选择操作
```
1. 开发模式启动 - 实时重载，适合开发
2. 生产模式打包 - 创建安装包
3. 仅检查环境 - 查看配置是否正确
4. 退出
```

---

### 手动命令行操作

#### 1. 安装依赖
```cmd
cd first-github-demo
npm install
```

#### 2. 开发模式运行
```cmd
npm run electron:dev
```
这会同时启动：
- Vite 开发服务器（http://localhost:5173）
- Electron 桌面窗口

#### 3. 打包为安装包
```cmd
npm run electron:build
```

打包完成后，安装包位置：
```
release/AI 桌宠-1.0.0-win-x64.exe
release/AI 桌宠-1.0.0-win-x64-portable.exe
```

---

## 📦 安装包说明

### Windows 安装包类型

| 类型 | 文件名 | 说明 | 推荐 |
|------|--------|------|------|
| NSIS 安装版 | AI 桌宠-1.0.0-win-x64.exe | 标准安装包，可卸载 | ✅ 推荐 |
| 便携版 | AI 桌宠-1.0.0-win-x64-portable.exe | 无需安装，直接运行 | ⚠️ 适合测试 |

### NSIS 安装版特性
- ✅ 自动创建桌面快捷方式
- ✅ 自动添加到开始菜单
- ✅ 支持开机自启动
- ✅ 包含卸载程序
- ✅ 支持静默安装

### 便携版特性
- ✅ 无需安装
- ✅ 可放在 USB 驱动器
- ✅ 适合测试版本
- ❌ 不提供卸载功能

---

## 🔧 常见问题

### Q: 安装后无法启动？
**A:** 
1. 检查是否安装了最新的 Windows 更新
2. 右键应用 → "以管理员身份运行"
3. 查看日志文件：
   ```
   %APPDATA%\AI 桌宠\logs\error.log
   ```

### Q: 杀毒软件报毒？
**A:**
这是误报，Electron 应用常被误判。
解决方法：
1. 添加到杀毒软件白名单
2. 或暂时关闭杀毒软件
3. 向杀毒软件厂商提交误报

### Q: 窗口显示不正常？
**A:**
1. 检查显卡驱动是否最新
2. 尝试更新 Windows
3. 右键快捷方式 → 属性 → 兼容性 → 勾选"禁用全屏优化"

### Q: 如何卸载？
**A:**
```
控制面板 → 程序和功能 → AI 桌宠 → 卸载
```

或：
```
C:\Program Files\AI 桌宠\Uninstall.exe
```

---

## 📊 性能参考

| 指标 | 数值 |
|------|------|
| 安装包大小 | ~150 MB |
| 安装后占用 | ~300 MB |
| 运行内存 | ~200-300 MB |
| CPU 占用 | <5% (空闲时) |
| 启动时间 | ~3-5 秒 |

---

## 📱 系统托盘功能

安装后，桌面右下角系统托盘会显示宠物图标：

**右键菜单：**
- 👁️ 显示/隐藏 - 切换宠物窗口
- ⚙️ 设置 - 打开设置面板
- 🔄 重启应用 - 重新启动
- ❌ 退出 - 完全退出

---

## 🎯 下一步

安装完成后，建议：

1. ✅ 配置 AI 服务（Ollama）
2. ✅ 调整透明度适合你的桌面
3. ✅ 设置开机自启动
4. ✅ 检查更新获取最新版本

详细使用说明请查看：`docs/WINDOWS_USAGE.md`

---

**享受你的 AI 桌宠！** 🎉

遇到问题？访问：https://github.com/liuhaoliuhao25-commits/first-github-demo/issues
