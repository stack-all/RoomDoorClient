#!/bin/bash

# GitHub Pages 部署脚本
# 用于本地测试 GitHub Pages 构建过程

echo "🚀 开始 GitHub Pages 部署构建..."

# 设置环境变量
export GITHUB_PAGES=true

echo "📦 安装依赖..."
bun install

echo "🧪 运行测试..."
bun test

echo "🔍 代码检查..."
bun lint

echo "🔨 构建项目..."
bun run build:gh-pages

echo "✅ 构建完成！"
echo "📁 构建产物位于: ./dist"
echo "🌐 可以使用以下命令预览:"
echo "   cd dist && python -m http.server 8080"
echo ""
echo "📋 部署说明:"
echo "1. 确保在 GitHub 仓库设置中启用了 GitHub Pages"
echo "2. 选择 'GitHub Actions' 作为部署源"
echo "3. 推送到 main 分支将自动触发部署"
