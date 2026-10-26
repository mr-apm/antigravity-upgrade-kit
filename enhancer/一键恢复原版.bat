@echo off
chcp 65001 >nul
title Antigravity UI Enhancer - 一键恢复原版
cd /d "%~dp0"
python "%~dp0restore_original.py"
echo.
pause
