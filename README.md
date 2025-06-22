# 蓝牙门锁控制器

一个基于Vue3的PWA应用，用于通过蓝牙连接控制智能门锁。支持设备自动识别、密码保存、指纹验证等功能。

## 功能特点

- 🔐 **安全加密**: 使用AES加密与门锁通信
- 📱 **PWA支持**: 可安装到手机和电脑桌面
- 🔍 **设备识别**: 自动扫描并连接门锁设备
- 💾 **智能记忆**: 自动保存上次连接的设备
- 👆 **指纹验证**: 支持生物识别保存和验证密码
- 🎨 **美观界面**: 现代化的响应式设计
- 🌐 **跨平台**: 支持Android、iOS、Windows、macOS

## 技术栈

- Vue 3 + Composition API
- Vite 构建工具
- Pinia 状态管理
- Web Bluetooth API
- Web Authentication API (WebAuthn)
- PWA (Progressive Web App)
- CryptoJS 加密库

## 开发环境要求

- Node.js 16+
- 支持蓝牙的设备
- HTTPS环境（蓝牙API要求）

## 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd RoomDoorClient
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **生成SSL证书（用于本地HTTPS开发）**
   ```bash
   # Windows (需要安装OpenSSL)
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout private-key.pem -out certificate.pem -config ssl.conf
   
   # 或者使用mkcert工具（推荐）
   mkcert localhost 127.0.0.1 ::1
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

5. **构建生产版本**
   ```bash
   npm run build
   ```

6. **预览生产版本**
   ```bash
   npm run preview
   ```

## 使用说明

### 首次使用

1. 打开应用，确保门锁设备已开启
2. 点击"扫描设备"按钮搜索附近的门锁
3. 选择要连接的门锁设备
4. 输入门锁密码
5. （可选）启用指纹保存功能
6. 点击"连接门锁"

### 开门操作

1. 连接成功后，点击"🔓 开门"按钮
2. 如果启用了指纹验证，会要求验证指纹
3. 验证成功后门锁会自动开启

### 自动连接

- 应用会记住上次连接的设备
- 再次打开应用时会自动尝试连接
- 如果启用了指纹保存，会自动进行指纹验证并连接

## 浏览器兼容性

### 支持的浏览器
- Chrome 56+ (推荐)
- Edge 79+
- Opera 43+
- Samsung Internet 6.0+

### 不支持的浏览器
- Safari (不支持Web Bluetooth API)
- Firefox (需要手动启用实验性功能)
- IE (完全不支持)

## 移动端安装

### Android
1. 使用Chrome浏览器访问应用
2. 点击地址栏右侧的"安装"图标
3. 或点击菜单中的"添加到主屏幕"

### iOS
1. 使用Safari浏览器访问应用
2. 点击分享按钮
3. 选择"添加到主屏幕"
4. 注意：iOS Safari不支持蓝牙功能，建议使用支持的浏览器

## 安全说明

- 密码使用SHA256哈希后作为AES密钥
- 挑战-响应机制防止重放攻击
- 生物识别数据仅存储在本地设备
- 所有通信都经过AES加密

## 故障排除

### 无法扫描到设备
- 确保门锁设备已开启蓝牙广播
- 检查浏览器是否支持蓝牙功能
- 确保使用HTTPS访问应用
- 检查设备权限设置

### 连接失败
- 检查门锁是否在可连接状态
- 确认密码是否正确
- 尝试刷新页面重新连接
- 检查设备距离是否过远

### 指纹验证失败
- 确保设备支持生物识别
- 检查浏览器权限设置
- 尝试重新启用指纹保存功能

## 开发说明

### 项目结构
```
src/
├── App.vue                 # 主应用组件
├── main.js                # 应用入口
├── style.css              # 全局样式
└── composables/           # 组合式API
    ├── useBluetooth.js    # 蓝牙功能
    ├── useBiometric.js    # 生物识别
    └── useStorage.js      # 本地存储
```

### API说明

#### 蓝牙服务UUID
- 服务: `1f04f3b3-0000-63b0-b612-3a8b9fe101ab`
- 响应特征: `1f04f3b3-0001-63b0-b612-3a8b9fe101ab`
- 挑战特征: `1f04f3b3-0002-63b0-b612-3a8b9fe101ab`

#### 通信协议
1. 门锁定期广播8字节随机挑战数据
2. 客户端接收挑战数据
3. 使用密码AES加密挑战数据
4. 发送加密后的响应到门锁
5. 门锁验证响应并控制开门

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交Issue或联系开发者。