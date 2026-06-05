@echo off
chcp 65001 >nul
echo ========================================
echo    AI 桌宠 - Windows 快速启动脚本
echo ========================================
echo.

REM 检查 Node.js 是否安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js
    echo.
    echo 请先安装 Node.js:
    echo 1. 访问 https://nodejs.org/
    echo 2. 下载并安装 LTS 版本
    echo 3. 重新运行此脚本
    echo.
    pause
    exit /b 1
)

echo [√] Node.js 已安装
node --version

REM 检查依赖是否安装
if not exist "node_modules" (
    echo.
    echo [提示] 检测到未安装依赖，开始安装...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
    echo [√] 依赖安装完成
) else (
    echo [√] 依赖已安装
)

echo.
echo ========================================
echo    启动选项
echo ========================================
echo.
echo 1. 开发模式启动（实时重载，适合开发）
echo 2. 生产模式打包（创建安装包）
echo 3. 仅检查环境
echo 4. 退出
echo.
set /p choice="请选择 (1-4): "

if "%choice%"=="1" goto dev
if "%choice%"=="2" goto build
if "%choice%"=="3" goto check
if "%choice%"=="4" goto end
goto invalid

:dev
echo.
echo [提示] 启动开发模式...
echo 这将打开 Vite 开发服务器和 Electron 窗口
echo 按 Ctrl+C 可停止服务
echo.
call npm run electron:dev
goto end

:build
echo.
echo [提示] 开始打包应用...
echo 这可能需要几分钟时间
echo 安装包将生成在 release\ 目录
echo.
call npm run electron:build
if %errorlevel% equ 0 (
    echo.
    echo [√] 打包完成！
    echo 安装包位置：release\AI 桌宠-*.exe
) else (
    echo [错误] 打包失败，请检查错误信息
)
goto end

:check
echo.
echo ========================================
echo    环境检查
echo ========================================
echo.
echo [系统信息]
echo OS: %OS%
echo 架构: %PROCESSOR_ARCHITECTURE%
echo.
echo [Node.js 环境]
node --version
npm --version
echo.
echo [项目状态]
if exist "node_modules" (
    echo [√] 依赖已安装
) else (
    echo [!] 依赖未安装
)

if exist "dist" (
    echo [√] 已构建
) else (
    echo [!] 未构建
)
echo.
goto end

:invalid
echo [错误] 无效的选择：%choice%
echo.
goto end

:end
echo.
echo 按任意键退出...
pause >nul
