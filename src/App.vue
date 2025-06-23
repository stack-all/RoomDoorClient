<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <!-- 标题栏 -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-md mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-bold text-gray-900">智能门锁</h1>
          <button
            @click="showSettings = true"
            class="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="设置"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- 主内容 -->
    <main class="max-w-md mx-auto px-4 py-8">
      <!-- 设备信息组件 -->
      <DeviceInfo ref="deviceInfoRef" />

      <!-- 一键开锁卡片 -->
      <div v-if="showQuickUnlock" class="card mb-6 bg-blue-50 border-blue-200">
        <div class="text-center">
          <h2 class="text-lg font-semibold text-blue-900 mb-4">🚪 一键开锁</h2>
          <p class="text-blue-700 mb-4">点击下方按钮开始开锁流程</p>
          <button
            @click="handleQuickUnlock"
            :disabled="lockStore.lockState.isUnlocking"
            class="btn-primary w-full py-4 text-lg"
          >
            <svg
              v-if="!lockStore.lockState.isUnlocking"
              class="w-6 h-6 mr-3 inline"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
            <svg
              v-else
              class="w-6 h-6 mr-3 inline animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {{
              lockStore.lockState.isUnlocking
                ? '开锁中...'
                : '🔓 立即开锁'
            }}
          </button>
          <button
            @click="showQuickUnlock = false"
            class="mt-3 text-sm text-blue-600 hover:text-blue-800"
          >
            取消
          </button>
        </div>
      </div>

      <div
        v-if="showAutoConnectPrompt"
        class="card mb-6 bg-yellow-50 border-yellow-200"
      >
        <div class="flex items-start">
          <svg
            class="w-6 h-6 text-yellow-600 mt-1 mr-3 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <div class="flex-1">
            <h3 class="font-medium text-yellow-900 mb-2">
              {{
                lockStore.bluetooth
                    ?.checkWebBluetoothSupport?.()
                  ? '智能重连提醒'
                  : '自动连接提醒'
              }}
            </h3>
            <p class="text-yellow-800 text-sm mb-3">
              {{
                lockStore.bluetooth
                    ?.checkWebBluetoothSupport?.()
                  ? '正在尝试连接到您已授权的设备，如果设备不在附近或连接失败，请手动连接。'
                  : '您已启用自动连接，但当前浏览器版本不支持设备记忆功能。建议启用新版权限后端获得更好体验。'
              }}
            </p>
            <div class="flex gap-2">
              <button
                @click="handleConnect(), showAutoConnectPrompt = false"
                class="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
              >
                立即连接
              </button>
              <button
                v-if="
                  !lockStore.bluetooth
                    ?.checkWebBluetoothSupport?.()
                "
                @click="handleOpenChromeFlags"
                class="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                启用新功能
              </button>
              <button
                @click="showAutoConnectPrompt = false"
                class="px-3 py-1 text-yellow-600 hover:text-yellow-800 text-sm"
              >
                忽略
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- PWA 安装提示 -->
      <div v-if="pwa.canInstall" class="card mb-6 bg-green-50 border-green-200">
        <div class="flex items-start">
          <svg
            class="w-6 h-6 text-green-600 mt-1 mr-3 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <div class="flex-1">
            <h3 class="font-medium text-green-900 mb-2">🏠 安装应用到主屏幕</h3>
            <p class="text-green-800 text-sm mb-3">
              将智能门锁添加到主屏幕，享受更快的启动速度和原生应用体验。
            </p>
            <div class="flex gap-2">
              <button
                @click="handleInstallPWA"
                class="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                立即安装
              </button>
              <button
                @click="
                  () => {
                    pwa.canInstall.value = false
                  }
                "
                class="px-3 py-1 text-green-600 hover:text-green-800 text-sm"
              >
                稍后
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 连接状态卡片 -->
      <div class="card mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">连接状态</h2>
          <div class="flex items-center space-x-2">
            <div
              :class="
                {
                  'w-3 h-3 rounded-full': true,
                  'bg-green-500': lockStore.isConnected,
                  'bg-yellow-500 animate-pulse':
                    lockStore.isConnecting,
                  'bg-red-500': !lockStore.isConnected
                    && !lockStore.isConnecting,
                }
              "
            />
            <span class="text-sm text-gray-600">
              {{ connectionStatusText }}
            </span>
          </div>
        </div>

        <div
          v-if="lockStore.connectionError"
          class="p-3 bg-red-50 border border-red-200 rounded-lg mb-4"
        >
          <p class="text-sm text-red-600">{{ lockStore.connectionError }}</p>
        </div>

        <div class="flex space-x-3">
          <button
            @click="handleSmartConnect"
            :disabled="lockStore.isConnecting"
            class="flex-1"
            :class="getConnectButtonClass()"
          >
            {{ getConnectButtonText() }}
          </button>

          <!-- 自动重连切换按钮 -->
          <button
            v-if="lockStore.bluetooth?.checkWebBluetoothSupport?.()"
            @click="toggleAutoReconnect"
            :class="
              {
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors':
                  true,
                'bg-blue-100 text-blue-700 hover:bg-blue-200':
                  lockStore.deviceSettings.autoConnect,
                'bg-gray-100 text-gray-600 hover:bg-gray-200':
                  !lockStore.deviceSettings.autoConnect,
              }
            "
          >
            {{
              lockStore.deviceSettings.autoConnect
                ? '🔄 自动'
                : '🔗 手动'
            }}
          </button>
        </div>
      </div>

      <!-- 开锁卡片 -->
      <div class="card mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">门锁控制</h2>

        <!-- 开锁状态显示 -->
        <div
          v-if="lockStore.lockState.isUnlocked"
          class="p-4 bg-green-50 border border-green-200 rounded-lg mb-4"
        >
          <div class="flex items-center">
            <svg
              class="w-6 h-6 text-green-600 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p class="text-green-800 font-medium">门锁已打开</p>
              <p class="text-green-600 text-sm">
                {{
                  formatTime(
                    lockStore.lockState.lastUnlockTime,
                  )
                }}
              </p>
            </div>
          </div>
        </div>

        <!-- 生物识别开锁 -->
        <div
          v-if="
            lockStore.biometrics.canUse
              && lockStore.deviceSettings.biometricEnabled
          "
          class="mb-4"
        >
          <button
            @click="handleBiometricUnlock"
            :disabled="
              !lockStore.canUnlock
                || lockStore.lockState.isUnlocking
            "
            class="btn-primary w-full py-4 text-lg"
          >
            <svg
              v-if="!lockStore.lockState.isUnlocking"
              class="w-6 h-6 mr-3 inline"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <svg
              v-else
              class="w-6 h-6 mr-3 inline animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {{
              lockStore.lockState.isUnlocking
                ? '验证中...'
                : '生物识别开锁'
            }}
          </button>
        </div>

        <!-- 手动密码开锁 -->
        <div class="space-y-4">
          <div>
            <label
              for="password"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              密码
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="请输入门锁密码"
              class="input"
              @keyup.enter="handlePasswordUnlock"
            >
          </div>

          <button
            @click="handlePasswordUnlock"
            :disabled="
              !password.trim() || !lockStore.canUnlock
                || lockStore.lockState.isUnlocking
            "
            class="btn-primary w-full py-3"
            :title="`可开锁: ${lockStore.canUnlock}, 已连接: ${lockStore.isConnected}, 有挑战: ${lockStore.bluetooth?.hasChallenge}`"
          >
            <svg
              v-if="!lockStore.lockState.isUnlocking"
              class="w-5 h-5 mr-2 inline"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
            <svg
              v-else
              class="w-5 h-5 mr-2 inline animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {{
              lockStore.lockState.isUnlocking
                ? '开锁中...'
                : '密码开锁'
            }}
          </button>
        </div>
      </div>

      <!-- 快速提示 -->
      <div class="card bg-blue-50 border-blue-200">
        <div class="flex items-start">
          <svg
            class="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div class="text-sm text-blue-800">
            <p class="font-medium mb-1">使用提示</p>
            <ul class="space-y-1 text-blue-700">
              <li>• 首次使用需要先连接蓝牙设备</li>
              <li>• 可在设置中启用生物识别快速开锁</li>
              <li>• 支持桌面快捷方式一键开锁</li>
              <li
                v-if="
                  lockStore.bluetooth
                    ?.checkWebBluetoothSupport?.()
                "
              >
                • ✨ 支持设备记忆和自动重连（新功能）
              </li>
              <li v-else>
                • ⚠️ 建议启用chrome://flags中的新版蓝牙权限获得更好体验
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>

    <!-- 设置模态框 -->
    <SettingsModal
      v-if="showSettings"
      @close="showSettings = false"
    />

    <!-- Toast 通知 -->
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import DeviceInfo from '@/components/DeviceInfo.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import ToastContainer from '@/components/ToastContainer.vue'
import { usePWA } from '@/composables/usePWA'
import { useLockStore } from '@/stores/lockStore'
import { computed, onMounted, ref } from 'vue'

const lockStore = useLockStore()
const pwa = usePWA()
const password = ref('')
const showSettings = ref(false)
const showQuickUnlock = ref(false) // 显示一键开锁按钮
const showAutoConnectPrompt = ref(false) // 显示自动连接提示
const deviceInfoRef = ref() // 设备信息组件引用

// 计算属性
const connectionStatusText = computed(() => {
  if (lockStore.isConnecting) return '连接中...'
  if (lockStore.isConnected) return '已连接'
  return '未连接'
})

// 方法
const handleConnect = async () => {
  await lockStore.connect()
}

// 新的智能连接控制
const handleSmartConnect = async () => {
  await lockStore.smartConnectControl()
}

// 切换自动重连
const toggleAutoReconnect = async () => {
  if (lockStore.deviceSettings.autoConnect) {
    await lockStore.stopAutoReconnect()
  } else {
    await lockStore.startAutoReconnect()
  }
}

// 获取连接按钮样式
const getConnectButtonClass = () => {
  if (lockStore.deviceSettings.autoConnect) {
    if (lockStore.isConnected) {
      return 'btn-warning' // 黄色：停止自动重连
    } else {
      return 'btn-primary' // 蓝色：选择设备
    }
  } else {
    if (lockStore.isConnected) {
      return 'btn-secondary' // 灰色：断开连接
    } else {
      return 'btn-primary' // 蓝色：连接设备
    }
  }
}

// 获取连接按钮文本
const getConnectButtonText = () => {
  if (lockStore.isConnecting) {
    return '连接中...'
  }

  if (lockStore.deviceSettings.autoConnect) {
    if (lockStore.isConnected) {
      return '停止自动重连'
    } else {
      return '选择设备连接'
    }
  } else {
    if (lockStore.isConnected) {
      return '断开连接'
    } else {
      return '连接设备'
    }
  }
}

const handlePasswordUnlock = async () => {
  if (!password.value.trim()) {
    return
  }

  if (!lockStore.canUnlock) {
    return
  }

  const result = await lockStore.unlockWithPassword(password.value)
  if (result.success) {
    password.value = '' // 清空密码输入
  }
}

const handleBiometricUnlock = async () => {
  await lockStore.unlockWithBiometrics()
}

const handleQuickUnlock = async () => {
  const result = await lockStore.autoUnlock()

  if (result.success) {
    showQuickUnlock.value = false
  }
}

const handleInstallPWA = async () => {
  try {
    const success = await pwa.install()

    if (success) {
      lockStore.toast.success('应用安装成功！')
    } else {
      lockStore.toast.info('安装已取消')
    }
  } catch (err) {
    lockStore.toast.error('安装失败，请手动添加到主屏幕')
  }
}

const handleOpenChromeFlags = () => {
  window.open(
    'chrome://flags/#enable-web-bluetooth-new-permissions-backend',
    '_blank',
  )
}

const formatTime = (timestamp: number | null): string => {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleTimeString('zh-CN')
}

// 生命周期
onMounted(() => {
  // 检查 URL 参数，支持快捷方式开锁
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('action') === 'unlock') {
    // 显示一键开锁按钮，而不是自动执行
    showQuickUnlock.value = true
    // 如果已经连接且有生物识别，可以直接开锁
    if (
      lockStore.isConnected && lockStore.biometrics.canUse
      && lockStore.deviceSettings.biometricEnabled
    ) {
      setTimeout(() => {
        lockStore.unlockWithBiometrics()
      }, 500)
    }
  }

  // 自动连接逻辑
  if (lockStore.deviceSettings.autoConnect) {
    // 延迟尝试自动连接
    setTimeout(async () => {
      if (!lockStore.isConnected) {
        try {
          await lockStore.autoConnect()
        } catch (err) {
          // 如果自动连接失败，显示提示
          setTimeout(() => {
            if (!lockStore.isConnected) {
              showAutoConnectPrompt.value = true
            }
          }, 2000)
        }
      }
    }, 1000)
  }
})
</script>
