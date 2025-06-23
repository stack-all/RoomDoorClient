# GitHub Pages 部署指南

本文档说明如何将智能门锁控制面板部署到 GitHub Pages。

## 🚀 自动部署设置

### 1. 启用 GitHub Pages

1. 在 GitHub 仓库页面，转到 **Settings** → **Pages**
2. 在 **Source** 下选择 **GitHub Actions**
3. 保存设置

### 2. 自动部署触发

部署将在以下情况自动触发：

- 推送代码到 `main` 分支
- 手动触发工作流（在 Actions 页面）

### 3. 部署流程

GitHub Actions 工作流将执行以下步骤：

1. 检出代码
2. 设置 Bun 环境
3. 缓存依赖
4. 安装依赖
5. 运行测试
6. 代码检查
7. 构建项目（启用 GitHub Pages 模式）
8. 部署到 GitHub Pages

## 🛠️ 本地测试

### 测试 GitHub Pages 构建

```bash
# 使用脚本测试完整的构建流程
bun run deploy:gh-pages

# 或者直接构建 GitHub Pages 版本
bun run build:gh-pages
```

### 本地预览

```bash
# 构建后预览
bun run preview:gh-pages

# 或者使用其他静态服务器
cd dist
npx serve .
```

## 📁 构建配置

### Vite 配置

项目配置了环境检测，在生产环境且启用 `GITHUB_PAGES` 环境变量时：

- 基础路径设置为 `/RoomDoorClient/`
- PWA 清单文件相应调整

### 文件结构

```
dist/
├── index.html          # 主页面
├── assets/            # 静态资源
├── icons/             # PWA 图标
├── sw.js              # Service Worker
└── .nojekyll          # 禁用 Jekyll 处理
```

## 🔧 配置选项

### 环境变量

- `GITHUB_PAGES=true`: 启用 GitHub Pages 模式
- 在此模式下，应用将正确处理子路径

### PWA 配置

GitHub Pages 部署时，PWA 功能完全可用：

- 应用可安装到主屏幕
- 支持离线使用
- 快捷方式正常工作

## 📋 部署检查清单

- [ ] GitHub Pages 已启用且配置为 GitHub Actions
- [ ] 仓库具有必要的权限（Pages 写入权限）
- [ ] 代码已推送到 `main` 分支
- [ ] GitHub Actions 工作流成功运行
- [ ] 应用可通过 `https://[username].github.io/RoomDoorClient/` 访问

## 🐛 故障排除

### 常见问题

1. **404 错误**
   - 检查基础路径配置
   - 确认 `.nojekyll` 文件存在

2. **PWA 功能异常**
   - 检查 Service Worker 路径
   - 确认 HTTPS 环境

3. **构建失败**
   - 检查依赖版本
   - 查看 Actions 日志

### 调试步骤

1. 查看 GitHub Actions 运行日志
2. 本地运行 `bun run deploy:gh-pages` 测试
3. 检查构建产物的路径配置
4. 验证 PWA 清单文件的路径

## 📊 性能优化

GitHub Pages 部署包含以下优化：

- 静态资源压缩
- Service Worker 缓存
- 图片优化
- 代码分割

## 🔄 更新部署

要更新已部署的应用：

1. 提交更改到 `main` 分支
2. GitHub Actions 自动构建和部署
3. 大约 2-5 分钟后更新生效

---

_注意：GitHub Pages 可能需要几分钟来传播更改。首次部署后，请等待几分钟再访问应用。_
