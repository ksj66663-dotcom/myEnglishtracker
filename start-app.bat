@echo off
chcp 65001 > nul
title IELTS 打卡启动器

cd /d "%~dp0"

:: 如果 3000 端口已在监听，说明服务器已运行，直接打开浏览器
netstat -ano | find ":3000 " | find "LISTENING" > nul 2>&1
if %errorlevel% == 0 (
    echo 服务器已在运行，直接打开浏览器...
    start http://localhost:3000
    exit /b 0
)

:: 后台启动 dev 服务器（最小化窗口，保留在任务栏）
start "IELTS 打卡 - 服务器" /min cmd /k "npm run dev"

:: 每秒检测一次端口，就绪后自动打开浏览器
echo 正在启动服务器，请稍候
:wait
timeout /t 1 /nobreak > nul
<nul set /p =.
netstat -ano | find ":3000 " | find "LISTENING" > nul 2>&1
if %errorlevel% neq 0 goto wait

echo.
echo 服务器就绪，正在打开浏览器...
start http://localhost:3000
exit /b 0
