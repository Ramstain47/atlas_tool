@echo off
chcp 65001 >nul
title 图鉴数值配置工具 - 开发服务器
echo.
echo ════════════════════════════════════════
echo    图鉴数值配置工具 - 一键启动脚本
echo ════════════════════════════════════════
echo.
echo 正在启动开发服务器...
echo 启动后会自动打开浏览器访问 http://localhost:5173
echo.
echo 按 Ctrl+C 可停止服务器
echo.

:: 启动服务器并等待其准备好
timeout /t 1 >nul

:: 启动浏览器（后台运行）
start http://localhost:5173

:: 启动开发服务器
npm run dev

pause
