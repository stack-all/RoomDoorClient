<template>
  <div class="container">
    <div class="header">
      <h1>🔐 蓝牙门锁</h1>
      <p>安全便捷的智能开锁体验</p>
    </div>

    <div class="card">
      <div class="form-group">
        <div class="status-section">
          <span class="status-indicator" :class="statusClass"></span>
          <span class="status-text">{{ statusText }}</span>
        </div>
      </div>

      <div v-if="!isConnected" class="connection-section">
        <div class="form-group">
          <label class="form-label">选择门锁设备</label>
          <div v-if="devices.length === 0" class="no-devices">
            <p>未发现设备，请确保门锁已开启并在附近</p>
          </div>
          <div v-else>
            <div 
              v-for="device in devices" 
              :key="device.id"
              class="device-item"
              :class="{ selected: selectedDevice?.id === device.id }"
              @click="selectDevice(device)"
            >
              <div class="device-info">
                <div class="device-name">{{ device.name || '未知设备' }}</div>
                <div class="device-id">{{ device.id }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">门锁密码</label>
          <input 
            v-model="password" 
            type="password" 
            class="input" 
            placeholder="请输入门锁密码"
            @input="clearMessage"
          >
        </div>

        <div class="form-group" v-if="supportsBiometric">
          <button 
            @click="toggleBiometricSave"
            class="btn btn-outline"
            type="button"
          >
            <svg class="biometric-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1C8.96 1 6.21 2.65 4.22 5.1C4.15 5.2 4.13 5.32 4.16 5.43C4.2 5.54 4.28 5.63 4.38 5.68L6.54 6.72C6.66 6.78 6.81 6.75 6.9 6.64C8.18 5.16 9.97 4.2 12 4.2C14.03 4.2 15.82 5.16 17.1 6.64C17.19 6.75 17.34 6.78 17.46 6.72L19.62 5.68C19.72 5.63 19.8 5.54 19.84 5.43C19.87 5.32 19.85 5.2 19.78 5.1C17.79 2.65 15.04 1 12 1M12 6C10.07 6 8.32 6.74 6.97 7.9C6.88 7.98 6.85 8.1 6.88 8.21C6.91 8.32 6.99 8.41 7.09 8.46L9.25 9.5C9.37 9.56 9.52 9.53 9.61 9.42C10.34 8.61 11.12 8.2 12 8.2C12.88 8.2 13.66 8.61 14.39 9.42C14.48 9.53 14.63 9.56 14.75 9.5L16.91 8.46C17.01 8.41 17.09 8.32 17.12 8.21C17.15 8.1 17.12 7.98 17.03 7.9C15.68 6.74 13.93 6 12 6M12 10C11.45 10 10.95 10.22 10.59 10.59C10.22 10.95 10 11.45 10 12C10 12.55 10.22 13.05 10.59 13.41C10.95 13.78 11.45 14 12 14C12.55 14 13.05 13.78 13.41 13.41C13.78 13.05 14 12.55 14 12C14 11.45 13.78 10.95 13.41 10.59C13.05 10.22 12.55 10 12 10Z"/>
            </svg>
            {{ biometricSaveEnabled ? '禁用指纹保存' : '启用指纹保存' }}
          </button>
        </div>

        <button 
          @click="scanDevices" 
          :disabled="isScanning"
          class="btn btn-primary"
          style="margin-bottom: 12px;"
        >
          <span v-if="isScanning" class="spinner"></span>
          {{ isScanning ? '扫描中...' : '扫描设备' }}
        </button>

        <button 
          @click="connect" 
          :disabled="!canConnect"
          class="btn btn-primary"
        >
          <span v-if="isConnecting" class="spinner"></span>
          {{ isConnecting ? '连接中...' : '连接门锁' }}
        </button>
      </div>

      <div v-else class="control-section">
        <div class="form-group">
          <div class="device-info">
            <div class="device-name">{{ connectedDevice?.name || '已连接设备' }}</div>
            <div class="device-id">{{ connectedDevice?.id }}</div>
          </div>
        </div>

        <button 
          @click="openDoor" 
          :disabled="isUnlocking"
          class="btn btn-success"
          style="margin-bottom: 12px; font-size: 18px; padding: 16px;"
        >
          <span v-if="isUnlocking" class="spinner"></span>
          {{ isUnlocking ? '开锁中...' : '🔓 开门' }}
        </button>

        <button 
          @click="disconnect" 
          class="btn btn-outline"
        >
          断开连接
        </button>
      </div>

      <div v-if="message" class="alert" :class="messageClass">
        {{ message }}
      </div>
    </div>

    <div class="card" v-if="lastDevice">
      <h3 style="margin-bottom: 16px;">上次连接的设备</h3>
      <div class="device-item" @click="connectToLastDevice">
        <div class="device-info">
          <div class="device-name">{{ lastDevice.name || '未知设备' }}</div>
          <div class="device-id">{{ lastDevice.id }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useBluetooth } from './composables/useBluetooth'
import { useBiometric } from './composables/useBiometric'
import { useStorage } from './composables/useStorage'

export default {
  name: 'App',
  setup() {
    const password = ref('')
    const message = ref('')
    const messageType = ref('info')
    
    const {
      isConnected,
      isConnecting,
      isScanning,
      isUnlocking,
      devices,
      selectedDevice,
      connectedDevice,
      scanDevices,
      selectDevice,
      connect,
      disconnect,
      openDoor
    } = useBluetooth()

    const {
      supportsBiometric,
      biometricSaveEnabled,
      toggleBiometricSave,
      savePasswordWithBiometric,
      getPasswordWithBiometric
    } = useBiometric()

    const {
      getLastDevice,
      saveLastDevice,
      getStoredPassword,
      saveStoredPassword
    } = useStorage()

    const lastDevice = ref(null)

    const statusClass = computed(() => {
      if (isConnected.value) return 'status-connected'
      if (isConnecting.value) return 'status-connecting'
      return 'status-disconnected'
    })

    const statusText = computed(() => {
      if (isConnected.value) return '已连接'
      if (isConnecting.value) return '连接中...'
      return '未连接'
    })

    const canConnect = computed(() => {
      return selectedDevice.value && password.value.trim() && !isConnecting.value
    })

    const messageClass = computed(() => {
      return `alert-${messageType.value}`
    })

    const showMessage = (msg, type = 'info') => {
      message.value = msg
      messageType.value = type
      setTimeout(() => {
        message.value = ''
      }, 5000)
    }

    const clearMessage = () => {
      message.value = ''
    }

    const connectToLastDevice = async () => {
      if (lastDevice.value) {
        selectedDevice.value = lastDevice.value
        
        // 尝试使用生物识别获取密码
        if (supportsBiometric.value && biometricSaveEnabled.value) {
          try {
            const savedPassword = await getPasswordWithBiometric()
            if (savedPassword) {
              password.value = savedPassword
              await connect(password.value)
              return
            }
          } catch (error) {
            console.log('生物识别验证失败，使用手动输入')
          }
        }
        
        // 尝试获取存储的密码
        const storedPassword = getStoredPassword()
        if (storedPassword) {
          password.value = storedPassword
        }
        
        showMessage('请输入密码以连接到上次使用的设备', 'warning')
      }
    }

    // 重写connect方法以包含密码保存逻辑
    const connectWithPasswordSave = async () => {
      try {
        const success = await connect(password.value)
        if (success) {
          // 保存设备信息
          saveLastDevice(selectedDevice.value)
          
          // 保存密码
          if (supportsBiometric.value && biometricSaveEnabled.value) {
            try {
              await savePasswordWithBiometric(password.value)
              showMessage('密码已通过生物识别保存', 'success')
            } catch (error) {
              console.error('生物识别保存失败:', error)
              saveStoredPassword(password.value)
              showMessage('密码已保存（未使用生物识别）', 'success')
            }
          } else {
            saveStoredPassword(password.value)
          }
          
          showMessage('连接成功！', 'success')
        }
      } catch (error) {
        showMessage(`连接失败: ${error.message}`, 'error')
      }
    }

    // 重写openDoor方法以包含反馈
    const openDoorWithFeedback = async () => {
      try {
        const success = await openDoor(password.value)
        if (success) {
          showMessage('开门成功！', 'success')
        } else {
          showMessage('开门失败，请检查密码', 'error')
        }
      } catch (error) {
        showMessage(`开门失败: ${error.message}`, 'error')
      }
    }

    onMounted(async () => {
      // 加载上次连接的设备
      lastDevice.value = getLastDevice()
      
      // 自动连接上次的设备
      if (lastDevice.value) {
        selectedDevice.value = lastDevice.value
        
        // 尝试使用生物识别获取密码并自动连接
        if (supportsBiometric.value && biometricSaveEnabled.value) {
          try {
            const savedPassword = await getPasswordWithBiometric()
            if (savedPassword) {
              password.value = savedPassword
              await connect(password.value)
              showMessage('自动连接成功！', 'success')
              return
            }
          } catch (error) {
            console.log('自动连接失败，等待手动操作')
          }
        }
        
        // 如果有存储的密码，也尝试自动连接
        const storedPassword = getStoredPassword()
        if (storedPassword) {
          password.value = storedPassword
          try {
            await connect(password.value)
            showMessage('自动连接成功！', 'success')
          } catch (error) {
            showMessage('自动连接失败，请手动连接', 'warning')
          }
        }
      }
    })

    return {
      password,
      message,
      messageClass,
      isConnected,
      isConnecting,
      isScanning,
      isUnlocking,
      devices,
      selectedDevice,
      connectedDevice,
      lastDevice,
      statusClass,
      statusText,
      canConnect,
      supportsBiometric,
      biometricSaveEnabled,
      scanDevices,
      selectDevice,
      connect: connectWithPasswordSave,
      disconnect,
      openDoor: openDoorWithFeedback,
      connectToLastDevice,
      toggleBiometricSave,
      showMessage,
      clearMessage
    }
  }
}
</script>
