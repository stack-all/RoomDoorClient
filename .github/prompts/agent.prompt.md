---
mode: agent
---
Agent Prompt
项目任务： 在当前路径（RoomDoorClient）下为 references 子文件夹下 RoomDoorService-main 的智能门锁项目构建一个现代化的、高性能、经过单元测试、可离线使用的 PWA 控制面板。

你的角色： 你是一位经验丰富的前端开发专家，精通 Vue 3、TypeScript、PWA 和现代前端工具链。你的任务是构建一个功能完整、代码优雅、工程化的 Web 应用。

核心技术栈：

包管理器: Bun

构建工具: Vite

框架: Vue 3 (使用 <script setup> 语法)

单元测试: Vitest, happy-dom

UI / CSS: UnoCSS (使用 Attributify 模式), LightningCSS

状态管理: Pinia

类型系统: TypeScript

PWA 支持: vite-plugin-pwa

加密库 (WASM): @originjs/crypto-js-wasm

代码格式化: dprint

Linter: Biome.js

功能实现细节 (Implementation Details):
1. 项目初始化与配置
创建项目: 在当前路径 RoomDoorClient 下创建一个基于 Vue 和 TypeScript 的 Vite 项目。

安装依赖:

核心: pinia, @vueuse/core

UI: unocss

PWA: vite-plugin-pwa

加密: @originjs/crypto-js-wasm

开发/测试: @vitejs/plugin-vue, typescript, vite, lightningcss, dprint, @biomejs/biome, vitest, happy-dom, @vue/test-utils

Vite 配置 (vite.config.ts):

集成 Vue、UnoCSS 和 LightningCSS。

配置 vite-plugin-pwa，包括 manifest 选项和 Service Worker 的 globPatterns 以缓存所有必要资产 (**/*.{js,css,html,ico,png,svg,wasm}) 实现完全离线。

开启 build.target: 'esnext' 以支持 Top-Level Await。

集成 Vitest: 在配置文件中添加 test 选项，配置 globals: true 和 environment: 'happy-dom'。

工具链配置:

创建 dprint.json 和 biome.json 的基础配置文件。

在 package.json 的 scripts 中添加 lint, format, 和 "test": "vitest"、"test:ui": "vitest --ui" 命令。

2. 项目结构
请遵循以下模块化的目录结构 (在 RoomDoorClient 文件夹内)：

RoomDoorClient/
├── public/
│   └── ...
├── src/
│   ├── assets/
│   ├── components/
│   ├── composables/
│   ├── services/
│   ├── stores/
│   ├── tests/                # 单元测试目录
│   │   ├── services/
│   │   │   └── crypto.spec.ts  # 针对加密服务的测试
│   │   ├── stores/
│   │   │   └── lockStore.spec.ts # 针对 Pinia Store 的测试
│   │   └── utils/
│   │       └── arrayBuffer.spec.ts
│   ├── types/
│   ├── utils/
│   └── ...
├── biome.json
├── dprint.json
└── vite.config.ts

3. 单元测试 (src/tests/)
测试目标: 重点测试无副作用的纯逻辑单元，如 services 和 utils。

crypto.spec.ts:

必须创建！ 这是最关键的测试。

创建一个测试用例，使用一个已知的密码和已知的挑战数据。

调用 deriveKey 和 encryptChallenge 函数。

断言（Assert）生成的加密结果是否与一个预先计算好的、正确的十六进制字符串完全相等。这能确保 PWA 的加密逻辑与 ESP32 完全兼容。

arrayBuffer.spec.ts:

测试 WordArray 和 Uint8Array 之间的相互转换是否正确无误，数据无丢失。

lockStore.spec.ts:

测试 Pinia store 的状态变更逻辑。

模拟（Mock）composables 和 services 的依赖，只测试 store 自身的 actions 和 state 变化。

4. BLE 通信 (src/composables/useBluetoothLock.ts)
此 Composable 必须与 OpenDoorTask.py 的蓝牙逻辑完全匹配。

服务 UUID: 1f04f3b3-0000-63b0-b612-3a8b9fe101ab

挑战特征 (Challenge):

UUID: 1f04f3b3-0002-63b0-b612-3a8b9fe101ab

权限: Read / Notify

响应特征 (Response):

UUID: 1f04f3b3-0001-63b0-b612-3a8b9fe101ab

权限: Write

核心功能: 暴露 connect, disconnect, isConnected, unlock 等响应式状态和方法。unlock 方法应接收 Uint8Array 格式的未加密密钥，内部处理完整的挑战-响应流程。

5. 加密服务 (src/services/crypto.ts)
此服务必须与 OpenDoorTask.py 和 AES.py 的加密逻辑完全一致。

导入: import CryptoJS from '@originjs/crypto-js-wasm';

密钥派生:

实现 deriveKey(password: string): CryptoJS.lib.WordArray 函数。

使用 CryptoJS.SHA256(password) 将密码字符串直接转换为 32 字节的 WordArray 密钥。

加密:

ESP32 使用的是 AES-ECB 模式和 PKCS7 填充。

实现 encryptChallenge(challenge: CryptoJS.lib.WordArray, key: CryptoJS.lib.WordArray): CryptoJS.lib.WordArray。

使用 CryptoJS.AES.encrypt(challenge, key, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 })。

从返回结果中提取密文: result.ciphertext。

6. 数据类型转换 (src/utils/arrayBuffer.ts)
由于蓝牙和 Web Crypto API 使用 ArrayBuffer/Uint8Array，而 @originjs/crypto-js-wasm 使用其自己的 WordArray 格式，必须创建转换工具。

wordArrayToUint8Array(wordArray: CryptoJS.lib.WordArray): Uint8Array

uint8ArrayToWordArray(uint8Array: Uint8Array): CryptoJS.lib.WordArray

7. 用户认证 (useBiometrics.ts 和 lockStore.ts)
手动输入: 在组件中提示用户输入密码，调用 crypto.ts 的 deriveKey 生成临时密钥 (WordArray 格式)，然后执行开锁。

生物识别 (useBiometrics.ts):

register(keyToWrap: Uint8Array): Promise<void>:

接收 Uint8Array 格式的原始 AES 密钥。

调用 navigator.credentials.create。

生成一个不可提取的 CryptoKey 作为 wrappingKey。

使用 Web Crypto 的 wrapKey (AES-GCM 模式) 加密 keyToWrap。

将加密后的 wrappedKey 和 credentialId 存入 localStorage。

authenticateAndUnwrap(): Promise<Uint8Array | null>:

调用 navigator.credentials.get。

成功后，加载 wrappingKey 和 wrappedKey。

使用 unwrapKey 解密，返回 Uint8Array 格式的原始 AES 密钥。

状态管理 (lockStore.ts):

管理当前认证模式（'manual' 或 'biometric')。

封装完整的开锁流程 unlockWithPassword(password) 和 unlockWithBiometrics()。

8. PWA & 一键开锁
vite-plugin-pwa 配置:

在 manifest 选项中定义 shortcuts：

"shortcuts": [{
  "name": "一键开门",
  "short_name": "开门",
  "url": "/?action=unlock",
  "icons": [{"src": "/icons/shortcut-unlock-icon.png", "sizes": "96x96"}]
}]

启动逻辑 (main.ts):

应用启动时，检查 URLSearchParams 中是否存在 action=unlock。

如果存在，立即调用 lockStore 中的自动化开锁动作，该动作应优先尝试生物识别。

UI 应为此自动化流程提供清晰的状态反馈。

9. UI/UX
主界面: 简洁明了，包含一个大的“连接/开锁”按钮和状态指示器。

设置: 提供一个模态框或独立页面，让用户可以：

设置/更改门锁密码。

启用/禁用生物识别登录。

保存/清除已记住的蓝牙设备。

响应式设计: 确保在各种尺寸的移动设备上都有良好的显示效果。

用户反馈: 对连接、断开、成功、失败等所有操作提供清晰的 Toast 通知或状态文本。

最终交付物:
请根据以上所有要求，生成一个完整的、结构化的项目文件夹和文件内容。所有代码都应是类型安全的、模块化的，并遵循 Vue 3 Composition API 的最佳实践。