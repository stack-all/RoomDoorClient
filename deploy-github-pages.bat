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
    echo ✅ 代码推送成功！
    echo.
    echo 📋 接下来需要在GitHub中完成设置：
    echo.
    echo 🔧 方法一：GitHub Actions部署（推荐）
    echo 1. 进入仓库: https://github.com/stack-all/RoomDoorClient
    echo 2. 点击 Settings 标签
    echo 3. 左侧菜单找到 Pages
    echo 4. Source 选择 "GitHub Actions"
    echo 5. 保存设置
    echo.
    echo 🔧 方法二：如果Actions失败，使用gh-pages分支
    echo 1. 在仓库Settings → Pages中
    echo 2. Source 选择 "Deploy from a branch"
    echo 3. Branch 选择 "gh-pages"
    echo 4. 文件夹选择 "/ (root)"
    echo.
    echo ⏰ 部署需要几分钟时间
    echo 🌐 访问地址: https://stack-all.github.io/RoomDoorClient/
    echo.
    echo 💡 提示：如果GitHub Actions部署失败，请查看Actions日志
    echo    或使用替代的gh-pages分支部署方式
) else (
    echo.
    echo ❌ 推送失败，请检查网络连接或权限
    echo.
    echo 🔧 可能的解决方案：
    echo 1. 检查网络连接
    echo 2. 验证GitHub访问权限
    echo 3. 确认仓库地址正确
)

echo.
pause
