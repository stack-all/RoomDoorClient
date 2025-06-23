# 智能门锁控制面板

一个基于 Vue 3 + TypeScript 的现代化智能门锁 PWA 控制面板，支持蓝牙通信、生物识别认证和离线使用。

## 🚀 功能特性

### 核心功能

- **蓝牙通信**: 与 ESP32 智能门锁设备进行安全的蓝牙 LE 通信
- **加密安全**: 使用 AES-ECB 加密算法确保通信安全
- **生物识别**: 支持 WebAuthn API 进行指纹/面部识别快速开锁
- **PWA 支持**: 可安装为原生应用，支持离线使用和推送通知
- **一键开锁**: 桌面快捷方式支持快速开锁
- **设备记忆**: 支持设备授权记忆和自动重连（需启用新版 Chrome 蓝牙权限）
- **智能安装**: 自动检测平台并提供相应的 PWA 安装指导

### 技术特性

- **现代框架**: Vue 3 Composition API + TypeScript
- **响应式 UI**: UnoCSS + 移动端优化设计
- **状态管理**: Pinia 状态管理
- **单元测试**: Vitest + Happy DOM 测试环境
- **代码质量**: oxlint 代码检查 + dprint 格式化
- **轻量图标**: 使用 emoji 作为应用图标，无需额外资源文件

## 🛠️ 技术栈

- **包管理器**: Bun
- **构建工具**: Vite
- **框架**: Vue 3 (Composition API + `<script setup>`)
- **类型系统**: TypeScript
- **状态管理**: Pinia
- **样式框架**: UnoCSS (Attributify 模式)
- **CSS 处理**: LightningCSS
- **PWA**: vite-plugin-pwa
- **加密库**: crypto-js (已从 crypto-js-wasm 迁移以提高稳定性)
- **测试框架**: Vitest + Happy DOM
- **代码规范**: oxlint + dprint

## 📁 项目结构

```
RoomDoorClient/
├── public/
│   └── .nojekyll           # GitHub Pages 配置
├── src/
│   ├── components/         # Vue 组件
│   │   ├── SettingsModal.vue
│   │   └── ToastContainer.vue
│   ├── composables/        # 组合式函数
│   │   ├── useBluetoothLock.ts
│   │   ├── useBiometrics.ts
│   │   ├── usePWA.ts       # PWA 安装管理
│   │   └── useToast.ts
│   ├── services/           # 服务层
│   │   └── crypto.ts       # 加密服务
│   ├── stores/             # Pinia 状态管理
│   │   └── lockStore.ts
│   ├── tests/              # 单元测试
│   │   ├── services/
│   │   ├── stores/
│   │   └── utils/
│   ├── types/              # TypeScript 类型定义
│   │   └── index.ts
│   ├── utils/              # 工具函数
│   │   ├── arrayBuffer.ts
│   │   └── pwa.ts
│   ├── App.vue             # 主应用组件
│   └── main.ts             # 应用入口
├── .oxlintrc.json          # oxlint 配置
├── dprint.json             # dprint 配置
├── uno.config.ts           # UnoCSS 配置
├── vite.config.ts          # Vite 配置
└── tsconfig.json           # TypeScript 配置
```

## 🔧 开发

### 安装依赖

```bash
bun install
```

### 启动开发服务器

```bash
bun dev
```

### 运行测试

```bash
bun test
```

### 代码检查和格式化

```bash
bun lint          # 代码检查
bun lint:fix      # 自动修复
bun format        # 代码格式化
```

### 构建生产版本

```bash
bun build
```

## 🔐 安全设计

### 加密通信

- 使用 SHA256 从密码派生 AES 密钥
- AES-ECB 模式加密挑战数据
- 与 ESP32 端保持完全兼容的加密实现

### 生物识别安全

- 基于 WebAuthn API 的生物识别认证
- 密钥使用 Web Crypto API 安全包装
- 支持平台认证器（TouchID、FaceID 等）

### 蓝牙安全

- 挑战-响应认证机制
- 30 秒挑战过期机制防止重放攻击
- 设备连接状态管理

## 📱 PWA 功能

- **离线支持**: Service Worker 缓存关键资源
- **安装提示**: 可添加到主屏幕
- **快捷方式**: 桌面快捷方式一键开锁
- **推送通知**: 设备状态通知

## 🧪 测试

项目包含完整的单元测试覆盖：

- **加密服务测试**: 验证与 ESP32 的加密兼容性
- **工具函数测试**: ArrayBuffer 转换等工具函数
- **状态管理测试**: Pinia store 逻辑测试

## 🔗 与 ESP32 集成

本项目设计为与以下 ESP32 项目配套使用：

```python
# ESP32 端配置（参考）
SERVICE_UUID = "1F04F3B3-0000-63B0-B612-3A8B9FE101AB"
CHALLENGE_CHARACTERISTIC = "1F04F3B3-0002-63B0-B612-3A8B9FE101AB"  # Read/Notify
RESPONSE_CHARACTERISTIC = "1F04F3B3-0001-63B0-B612-3A8B9FE101AB"   # Write
```

### 通信流程

1. PWA 连接到 ESP32 蓝牙设备
2. 接收 8 字节随机挑战数据
3. 使用 AES-ECB 加密挑战数据
4. 发送加密响应到 ESP32
5. ESP32 验证后控制门锁开启

## 📄 许可证

[MIT License](LICENSE)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系

如有问题，请通过 GitHub Issues 联系。
