# 🔧 GitHub Pages 部署故障排除

## 常见错误及解决方案

### 1. ACTIONS_ID_TOKEN_REQUEST_URL 错误

**错误信息：**
```
Error: Unable to get ACTIONS_ID_TOKEN_REQUEST_URL env variable
Error: Ensure GITHUB_TOKEN has permission "id-token: write"
```

**原因：** GitHub Actions权限配置不正确

**解决方案：**

#### 方法A：检查仓库设置（推荐）
1. 进入GitHub仓库页面
2. 点击 **Settings** 标签
3. 左侧菜单找到 **Actions** → **General**
4. 在 "Workflow permissions" 中选择：
   - ✅ **Read and write permissions**
   - ✅ **Allow GitHub Actions to create and approve pull requests**
5. 点击 **Save** 保存

#### 方法B：使用替代部署方式
如果权限问题持续存在，使用传统的gh-pages分支部署：

1. **重命名工作流文件：**
   ```bash
   # 禁用当前的Actions工作流
   git mv .github/workflows/deploy.yml .github/workflows/deploy.yml.disabled
   
   # 启用替代工作流
   git mv .github/workflows/deploy-alternative.yml .github/workflows/deploy.yml
   ```

2. **在GitHub Pages设置中：**
   - Source 选择 "**Deploy from a branch**"
   - Branch 选择 "**gh-pages**"
   - Folder 选择 "**/ (root)**"

### 2. 构建失败

**错误信息：**
```
npm ERR! code ELIFECYCLE
npm ERR! errno 1
```

**解决方案：**
1. 检查 `package.json` 中的scripts
2. 确认所有依赖项正确安装
3. 本地测试构建：`npm run build`

### 3. 页面显示404

**原因：** 路径配置问题

**解决方案：**
检查 `vite.config.js` 中的base配置：
```javascript
export default defineConfig({
  base: '/RoomDoorClient/', // 确保与仓库名称匹配
  // ...
})
```

### 4. PWA功能异常

**原因：** Service Worker路径问题

**解决方案：**
确认PWA配置中的路径正确：
```javascript
VitePWA({
  scope: '/RoomDoorClient/',
  start_url: '/RoomDoorClient/',
  // ...
})
```

## 🛠️ 调试步骤

### 1. 检查GitHub Actions日志
1. 进入仓库的 **Actions** 标签
2. 点击最新的工作流运行
3. 查看详细的错误日志
4. 根据错误信息调整配置

### 2. 本地验证
```bash
# 本地构建测试
npm run build

# 本地预览（模拟生产环境）
npm run preview
```

### 3. 权限检查清单
- ✅ Actions权限设置为 "Read and write"
- ✅ Pages功能已启用
- ✅ Source设置正确
- ✅ 工作流文件语法正确

### 4. 网络访问测试
```bash
# 测试GitHub连接
ping github.com

# 测试推送权限
git push origin main
```

## 🔄 备用部署方案

如果GitHub Actions持续出现问题，可以使用手动部署：

### 方案1：gh-pages分支
```bash
# 安装gh-pages工具
npm install -g gh-pages

# 构建并部署
npm run build
gh-pages -d dist
```

### 方案2：手动上传
1. 本地运行 `npm run build`
2. 将 `dist` 目录内容上传到新分支
3. 在Pages设置中选择该分支

## 📞 获取帮助

如果问题仍然存在：
1. 查看GitHub Actions官方文档
2. 检查仓库的Issues页面
3. 联系GitHub支持

---

**💡 提示：** 大多数部署问题都与权限配置有关，确保按照上述步骤正确设置仓库权限。
