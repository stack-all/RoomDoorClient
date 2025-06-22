@echo off
echo ========================================
echo GitHub Pages 部署脚本
echo ========================================
echo.
echo 此脚本将构建项目并推送到GitHub Pages
echo.
pause

echo 正在构建项目...
call npm run build

if %errorlevel% neq 0 (
    echo 构建失败！
    pause
    exit /b 1
)

echo.
echo 构建成功！
echo.
echo 正在提交更改...
git add .
git commit -m "🚀 部署到GitHub Pages

- 更新构建配置
- 添加GitHub Actions工作流
- 优化PWA设置"

echo.
echo 正在推送到远程仓库...
git push origin main

if %errorlevel% eq 0 (
    echo.
    echo ✅ 部署成功！
    echo.
    echo GitHub Pages 将在几分钟内更新
    echo 访问地址: https://stack-all.github.io/RoomDoorClient/
    echo.
    echo 请到 GitHub 仓库设置中启用 Pages：
    echo 1. 进入仓库 Settings 页面
    echo 2. 找到 Pages 设置
    echo 3. Source 选择 "GitHub Actions"
    echo 4. 保存设置
) else (
    echo.
    echo ❌ 推送失败，请检查网络连接或权限
)

echo.
pause
