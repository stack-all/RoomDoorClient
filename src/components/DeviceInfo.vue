<template>
  <div class="card mb-6" v-if="showDeviceInfo">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-900">设备信息</h2>
      <button
        @click="showDeviceInfo = false"
        class="text-gray-400 hover:text-gray-600"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <!-- 新版API支持状态 -->
    <div
      class="p-3 rounded-lg mb-4"
      :class="
        supportsNewAPI
          ? 'bg-green-50 border border-green-200'
          : 'bg-orange-50 border border-orange-200'
      "
    >
      <div class="flex items-center">
        <svg
          class="w-5 h-5 mr-2"
          :class="supportsNewAPI ? 'text-green-600' : 'text-orange-600'"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            v-if="supportsNewAPI"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z"
            v-else
          />
        </svg>
        <div>
          <p
            class="font-medium"
            :class="supportsNewAPI ? 'text-green-800' : 'text-orange-800'"
          >
            {{
              supportsNewAPI
                ? '✨ 新版蓝牙权限已启用'
                : '⚠️ 建议启用新版蓝牙权限'
            }}
          </p>
          <p
            class="text-sm"
            :class="supportsNewAPI ? 'text-green-600' : 'text-orange-600'"
          >
            {{
              supportsNewAPI
                ? '支持设备记忆和自动重连功能'
                : '在 chrome://flags 中启用 "Web Bluetooth new permissions backend"'
            }}
          </p>
        </div>
      </div>
    </div>

    <!-- 已授权设备列表 -->
    <div v-if="supportsNewAPI">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-medium text-gray-900">已授权设备</h3>
        <button
          @click="refreshDevices"
          :disabled="isRefreshing"
          class="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          {{ isRefreshing ? '刷新中...' : '刷新' }}
        </button>
      </div>

      <div
        v-if="authorizedDevices.length === 0"
        class="text-sm text-gray-500 p-3 bg-gray-50 rounded"
      >
        暂无已授权设备
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="device in authorizedDevices"
          :key="device.id"
          class="p-3 border rounded-lg flex items-center justify-between"
        >
          <div>
            <p class="font-medium text-gray-900">
              {{ device.name || '未知设备' }}
            </p>
            <p class="text-sm text-gray-500">ID: {{ device.id }}</p>
          </div>
          <div class="flex items-center space-x-2">
            <span
              v-if="isCurrentDevice(device)"
              class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
            >
              当前连接
            </span>
            <button
              @click="connectToDevice(device)"
              :disabled="isCurrentDevice(device) || isConnecting"
              class="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {{ isCurrentDevice(device) ? '已连接' : '连接' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 当前连接的设备 -->
    <div
      v-if="currentDevice"
      class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
    >
      <h3 class="font-medium text-blue-900 mb-2">当前设备</h3>
      <div class="text-sm text-blue-800">
        <p>名称: {{ currentDevice.name || '未知设备' }}</p>
        <p>状态: {{ isConnected ? '已连接' : '未连接' }}</p>
        <p v-if="currentDevice.id">ID: {{ currentDevice.id }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLockStore } from '@/stores/lockStore'
import { computed, onMounted, ref } from 'vue'

const lockStore = useLockStore()
const showDeviceInfo = ref(false)
const authorizedDevices = ref<BluetoothDevice[]>([])
const isRefreshing = ref(false)

// 计算属性
const supportsNewAPI = computed(() =>
  lockStore.bluetooth?.checkWebBluetoothSupport?.() ?? false
)
const isConnected = computed(() => lockStore.isConnected)
const isConnecting = computed(() => lockStore.isConnecting)
const currentDevice = computed(() =>
  lockStore.bluetooth?.connectionState.value?.device
)

// 检查是否为当前设备
const isCurrentDevice = (device: BluetoothDevice): boolean => {
  return currentDevice.value?.id === device.id
}

// 刷新设备列表
const refreshDevices = async () => {
  if (!supportsNewAPI.value) return

  try {
    isRefreshing.value = true
    const devices = await lockStore.bluetooth?.getAuthorizedDevices?.()
    authorizedDevices.value = devices || []
  } catch (err) {
    console.error('刷新设备列表失败:', err)
  } finally {
    isRefreshing.value = false
  }
}

// 连接到指定设备
const connectToDevice = async (device: BluetoothDevice) => {
  try {
    // 这里可以实现连接到指定设备的逻辑
    console.log('尝试连接到设备:', device.name)
    await lockStore.connect()
  } catch (err) {
    console.error('连接设备失败:', err)
  }
}

// 暴露方法给父组件
defineExpose({
  show: () => {
    showDeviceInfo.value = true
    refreshDevices()
  },
})

// 初始化
onMounted(() => {
  if (supportsNewAPI.value) {
    refreshDevices()
  }
})
</script>
