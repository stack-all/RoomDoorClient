<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <!-- 背景遮罩 -->
    <div 
      class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
      @click="$emit('close')"
    />
    
    <!-- 模态框内容 -->
    <div class="flex items-center justify-center min-h-screen p-4">
      <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <!-- 标题栏 -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900">设置</h2>
          <button
            @click="$emit('close')"
            class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 设置内容 -->
        <div class="p-6 space-y-6">
          <!-- 连接设置 -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">连接设置</h3>
            
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <label class="text-sm font-medium text-gray-700">模拟模式</label>
                  <p class="text-sm text-gray-500">使用模拟设备进行测试（密码：123456）</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="settings.mockMode"
                    @change="updateSettings"
                    class="sr-only peer"
                  >
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                </label>
              </div>
              
              <div class="flex items-center justify-between">
                <div>
                  <label class="text-sm font-medium text-gray-700">自动连接</label>
                  <p class="text-sm text-gray-500">
                    {{ lockStore.bluetooth.checkWebBluetoothSupport() 
                      ? '打开应用时自动连接到已授权设备' 
                      : '需要启用 Chrome 新版蓝牙权限后端' }}
                  </p>
                  <div v-if="!lockStore.bluetooth.checkWebBluetoothSupport()" class="mt-1">
                    <a
                      href="chrome://flags/#enable-web-bluetooth-new-permissions-backend"
                      target="_blank"
                      class="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      前往 chrome://flags 启用 "Use the new permissions backend for Web Bluetooth"
                    </a>
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="settings.autoConnect"
                    @change="updateSettings"
                    :disabled="!lockStore.bluetooth.checkWebBluetoothSupport()"
                    class="sr-only peer"
                  >
                  <div :class="{
                    'w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[\'\'] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all': true,
                    'bg-gray-200 peer-checked:bg-primary-600': lockStore.bluetooth.checkWebBluetoothSupport(),
                    'bg-gray-100 peer-checked:bg-gray-300 cursor-not-allowed': !lockStore.bluetooth.checkWebBluetoothSupport()
                  }" />
                </label>
              </div>

              <!-- 显示已保存的设备 -->
              <div v-if="lockStore.bluetooth.checkWebBluetoothSupport() && savedDevices.length > 0" class="mt-4">
                <h4 class="text-sm font-medium text-gray-700 mb-2">已记住的设备</h4>
                <div class="space-y-2">
                  <div
                    v-for="device in savedDevices"
                    :key="device.id"
                    class="p-2 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="text-sm font-medium text-gray-900">{{ device.name || '未知设备' }}</p>
                        <p class="text-xs text-gray-500">保存于 {{ formatSaveTime(device.savedAt) }}</p>
                      </div>
                      <button
                        @click="removeDevice(device.id)"
                        class="text-xs text-red-600 hover:text-red-800"
                      >
                        移除
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="lockStore.isConnected" class="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div class="flex items-center">
                  <svg class="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-sm text-green-800">当前设备已连接</span>
                </div>
                <p class="text-xs text-green-600 mt-1">
                  设备名称: {{ lockStore.lockState.connectionState.device?.name || '未知设备' }}
                </p>
              </div>
            </div>
          </div>

          <!-- 生物识别设置 -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">生物识别</h3>
            
            <div class="space-y-4">
              <div v-if="!lockStore.biometrics.isSupported" class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div class="flex items-center">
                  <svg class="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span class="text-sm text-yellow-800">此设备不支持生物识别</span>
                </div>
              </div>

              <div v-else-if="!lockStore.biometrics.isRegistered" class="space-y-4">
                <p class="text-sm text-gray-600">使用生物识别可以快速安全地开锁，无需每次输入密码。</p>
                
                <div>
                  <label for="biometric-password" class="block text-sm font-medium text-gray-700 mb-2">
                    请输入门锁密码以注册生物识别
                  </label>
                  <input
                    id="biometric-password"
                    v-model="biometricPassword"
                    type="password"
                    placeholder="门锁密码"
                    class="input"
                  >
                </div>
                
                <button
                  @click="registerBiometrics"
                  :disabled="!biometricPassword.trim() || isRegistering"
                  class="btn-primary w-full"
                >
                  {{ isRegistering ? '注册中...' : '注册生物识别' }}
                </button>
              </div>

              <div v-else class="space-y-4">
                <div class="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center">
                      <svg class="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span class="text-sm text-green-800">生物识别已启用</span>
                    </div>
                    <button
                      @click="clearBiometrics"
                      class="text-xs text-red-600 hover:text-red-800 underline"
                    >
                      清除
                    </button>
                  </div>
                </div>

                <div class="flex items-center justify-between">
                  <div>
                    <label class="text-sm font-medium text-gray-700">启用生物识别开锁</label>
                    <p class="text-sm text-gray-500">在主界面显示生物识别开锁按钮</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      v-model="settings.biometricEnabled"
                      @change="updateSettings"
                      class="sr-only peer"
                    >
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- PWA 设置 -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">应用设置</h3>
            
            <div class="space-y-4">
              <!-- PWA 安装 -->
              <div v-if="pwa.canInstall" class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center mb-2">
                      <svg class="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span class="text-sm text-blue-800 font-medium">安装应用</span>
                    </div>
                    <p class="text-xs text-blue-600 mb-3">
                      将智能门锁添加到主屏幕，享受更好的使用体验。
                    </p>
                  </div>
                </div>
                <button
                  @click="handleInstallPWA"
                  :disabled="isInstalling"
                  class="btn-primary w-full text-sm py-2"
                >
                  {{ isInstalling ? '安装中...' : '🏠 安装到主屏幕' }}
                </button>
              </div>

              <!-- PWA 功能介绍 -->
              <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div class="flex items-start">
                  <svg class="w-5 h-5 text-blue-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div class="text-sm text-blue-800">
                    <p class="font-medium mb-1">PWA 功能特性</p>
                    <ul class="space-y-1 text-blue-700">
                      <li>• 🚀 快速启动，像原生应用一样</li>
                      <li>• 📱 添加到主屏幕，便捷访问</li>
                      <li>• 🔗 支持深度链接和快捷方式</li>
                      <li>• 💾 离线缓存，无网络时也能使用基本功能</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 关于信息 -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">关于</h3>
            
            <div class="space-y-2 text-sm text-gray-600">
              <div class="flex justify-between">
                <span>版本</span>
                <span>1.0.0</span>
              </div>
              <div class="flex justify-between">
                <span>构建时间</span>
                <span>{{ buildTime }}</span>
              </div>
              <div class="flex justify-between">
                <span>支持的功能</span>
                <div class="text-right">
                  <div>蓝牙 LE: {{ bluetoothSupported ? '✓' : '✗' }}</div>
                  <div>生物识别: {{ lockStore.biometrics.isSupported ? '✓' : '✗' }}</div>
                  <div>PWA: ✓</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部按钮 -->
        <div class="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200">
          <button
            @click="$emit('close')"
            class="btn-secondary"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useLockStore } from '@/stores/lockStore'
import { usePWA } from '@/composables/usePWA'
import type { DeviceSettings } from '@/types'

// 事件定义
defineEmits<{
  close: []
}>()

const lockStore = useLockStore()
const pwa = usePWA()

// 响应式数据
const settings = ref<DeviceSettings>({ ...lockStore.deviceSettings })
const biometricPassword = ref('')
const isRegistering = ref(false)
const isInstalling = ref(false)
const bluetoothSupported = ref(false)
const savedDevices = ref<Array<{id: string, name?: string, savedAt: number}>>([])

// 计算属性
const buildTime = computed(() => {
  return new Date().toLocaleDateString('zh-CN')
})

// 方法
const updateSettings = () => {
  lockStore.updateSettings(settings.value)
}

const loadSavedDevices = () => {
  if (lockStore.bluetooth.checkWebBluetoothSupport()) {
    savedDevices.value = lockStore.bluetooth.getSavedAuthorizedDevices()
  }
}

const removeDevice = (deviceId: string) => {
  // 使用新的API移除设备
  try {
    const success = (lockStore.bluetooth as any).removeAuthorizedDevice(deviceId)
    if (success) {
      loadSavedDevices()
      lockStore.toast.info('设备已移除')
    } else {
      lockStore.toast.error('移除设备失败')
    }
  } catch (err) {
    console.error('移除设备失败:', err)
    lockStore.toast.error('移除设备失败')
  }
}

const formatSaveTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const registerBiometrics = async () => {
  if (!biometricPassword.value.trim()) return
  
  try {
    isRegistering.value = true
    const success = await lockStore.registerBiometrics(biometricPassword.value)
    
    if (success) {
      settings.value.biometricEnabled = true
      updateSettings()
      biometricPassword.value = ''
    }
  } finally {
    isRegistering.value = false
  }
}

const clearBiometrics = () => {
  lockStore.clearBiometrics()
  settings.value.biometricEnabled = false
  updateSettings()
}

const handleInstallPWA = async () => {
  try {
    isInstalling.value = true
    const success = await pwa.install()
    
    if (success) {
      lockStore.toast.success('应用安装成功！')
    } else {
      lockStore.toast.info('安装已取消')
    }
  } catch (err) {
    console.error('PWA 安装失败:', err)
    lockStore.toast.error('安装失败，请手动添加到主屏幕')
  } finally {
    isInstalling.value = false
  }
}

// 生命周期
onMounted(() => {
  // 检查蓝牙支持
  bluetoothSupported.value = lockStore.bluetooth.checkBluetoothSupport()
  
  // 加载保存的设备
  loadSavedDevices()
})
</script>
