# 🚀 GitHub Pages 部署指南

## 为什么选择 Static HTML 而不是 Jekyll？

### ✅ Static HTML 的优势：
- **Vue应用兼容** - 直接部署构建后的静态文件
- **PWA完美支持** - Service Worker和离线功能正常工作
- **HTTPS默认** - 满足蓝牙API的HTTPS要求
- **简单快速** - 无需额外配置，开箱即用
- **性能最佳** - 纯静态文件，加载速度最快

### ❌ Jekyll 的问题：
- **处理冲突** - 可能错误处理Vue文件和现代前端资源
- **PWA干扰** - Jekyll可能影响Service Worker注册
- **配置复杂** - 需要大量ignores和特殊配置
- **构建时间长** - 不必要的Jekyll处理步骤

## 🛠️ 部署配置

### 1. 已配置文件：
- ✅ `.github/workflows/deploy.yml` - GitHub Actions自动部署
- ✅ `.nojekyll` - 禁用Jekyll处理
- ✅ `vite.config.js` - 设置正确的base路径
- ✅ `deploy-github-pages.bat` - 一键部署脚本

### 2. GitHub Pages 设置步骤：

#### 方法一：使用一键部署脚本（推荐）
```bash
# 双击运行
deploy-github-pages.bat
```

#### 方法二：手动部署
```bash
# 1. 构建项目
npm run build

# 2. 提交更改
git add .
git commit -m "部署到GitHub Pages"
git push origin main
```

### 3. GitHub仓库设置：
1. 进入GitHub仓库页面
2. 点击 **Settings** 标签
3. 在左侧菜单找到 **Pages**
4. **Source** 选择 "**GitHub Actions**"
5. 点击 **Save** 保存

## 🌐 访问地址

部署成功后，应用将在以下地址可用：
```
https://stack-all.github.io/RoomDoorClient/
```

## 🔧 自动部署流程

每次推送到main分支时，GitHub Actions会自动：
1. 检出代码
2. 安装Node.js依赖
3. 执行 `npm run build`
4. 将dist目录部署到GitHub Pages

## 📱 PWA功能验证

部署后验证PWA功能：
1. **可安装性** - 浏览器地址栏显示安装图标
2. **离线功能** - 断网后仍可访问缓存页面
3. **HTTPS支持** - 蓝牙API正常工作
4. **响应式设计** - 手机端适配良好

## 🔍 故障排除

### 部署失败
- 检查GitHub Actions日志
- 确认package.json中的scripts正确
- 验证依赖项完整性

### 页面显示空白
- 检查vite.config.js中的base路径
- 确认.nojekyll文件存在
- 清除浏览器缓存

### PWA功能异常
- 确认Service Worker正确注册
- 检查manifest.webmanifest文件
- 验证HTTPS证书有效

## 📈 性能优化

GitHub Pages部署已包含：
- **资源压缩** - Vite自动压缩CSS/JS
- **缓存策略** - Service Worker离线缓存
- **CDN加速** - GitHub CDN全球分发
- **HTTP/2支持** - 现代网络协议

## 🎉 部署完成

部署成功后，您的蓝牙门锁控制器将：
- ✅ 支持全球HTTPS访问
- ✅ 可安装到任何设备
- ✅ 完整的PWA功能
- ✅ 优秀的性能表现

---

**🔗 快速访问**: https://stack-all.github.io/RoomDoorClient/
