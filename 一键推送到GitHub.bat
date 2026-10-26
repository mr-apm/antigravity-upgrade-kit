@echo off
chcp 65001 >nul
title 推送 Antigravity Upgrade Kit 到 GitHub

echo ====================================================================
echo   正在推送到 GitHub: https://github.com/mr-apm/antigravity-upgrade-kit
echo ====================================================================
echo.

cd /d "%~dp0"
git push -u origin main

echo.
echo ====================================================================
echo   执行完毕！按任意键退出...
echo ====================================================================
pause >nul
