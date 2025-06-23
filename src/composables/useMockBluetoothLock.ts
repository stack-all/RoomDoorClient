import { ref, computed } from 'vue'
import type { BluetoothConnectionState, UnlockResult, ChallengeResponse } from '@/types'
import { mockDevice } from '@/utils/mockBluetooth'
import { generateRandomBytes, uint8ArrayToHex } from '@/utils/arrayBuffer'

/**
 * 模拟蓝牙锁连接器
 */
export function useMockBluetoothLock() {
  // 状态管理
  const connectionState = ref<BluetoothConnectionState>({
    isConnected: false,
    isConnecting: false,
    device: null,
    error: null
  })

  const isUnlocking = ref(false)
  const lastChallenge = ref<ChallengeResponse | null>(null)
  const isWatchingAdvertisements = ref(false)
  const autoReconnectEnabled = ref(false)

  /**
   * 连接到模拟设备
   */
  const connect = async (): Promise<boolean> => {
    if (connectionState.value.isConnected) {
      return true
    }

    try {
      connectionState.value.isConnecting = true
      connectionState.value.error = null

      console.log('模拟蓝牙：开始连接...')
      const success = await mockDevice.connect()

      if (success) {
        connectionState.value = {
          isConnected: true,
          isConnecting: false,
          device: { name: '模拟设备 ESP32_BLE_Server' } as BluetoothDevice,
          error: null
        }

        // 自动生成一个模拟挑战
        setTimeout(() => {
          generateMockChallenge()
        }, 500)

        console.log('模拟蓝牙：连接成功')
        return true
      }

      return false
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '连接失败'
      connectionState.value = {
        isConnected: false,
        isConnecting: false,
        device: null,
        error: errorMessage
      }
      console.error('模拟蓝牙连接失败:', err)
      return false
    }
  }

  /**
   * 断开模拟设备连接
   */
  const disconnect = () => {
    try {
      mockDevice.disconnect()
      lastChallenge.value = null
    } catch (err) {
      console.error('断开模拟连接时出错:', err)
    } finally {
      connectionState.value = {
        isConnected: false,
        isConnecting: false,
        device: null,
        error: null
      }
    }
  }

  /**
   * 生成模拟挑战
   */
  const generateMockChallenge = () => {
    const challengeBytes = generateRandomBytes(8)
    lastChallenge.value = {
      challenge: challengeBytes,
      timestamp: Date.now()
    }
    console.log('模拟蓝牙：生成挑战', uint8ArrayToHex(challengeBytes))
  }

  /**
   * 模拟开锁操作
   */
  const unlock = async (aesKey: Uint8Array): Promise<UnlockResult> => {
    if (!connectionState.value.isConnected) {
      return {
        success: false,
        error: '设备未连接',
        timestamp: Date.now()
      }
    }

    try {
      isUnlocking.value = true

      // 确保有挑战
      if (!lastChallenge.value) {
        generateMockChallenge()
      }

      console.log('模拟蓝牙：开始开锁操作')
      
      // 对于模拟模式，我们简化验证过程
      // 如果密钥长度为 32 字节（256位），我们使用前 6 位作为密码
      // 如果密钥长度为 6 字节，我们直接使用
      let passwordFromKey: string
      
      if (aesKey.length >= 6) {
        // 将前 6 字节转换为字符串
        passwordFromKey = Array.from(aesKey.slice(0, 6))
          .map(byte => String.fromCharCode(byte))
          .join('')
      } else {
        // 如果密钥太短，使用默认测试密码
        passwordFromKey = '123456'
      }
      
      console.log('模拟蓝牙：使用密码验证:', passwordFromKey)
      
      const result = await mockDevice.unlock(passwordFromKey)
      
      if (result.success) {
        // 清除已使用的挑战
        lastChallenge.value = null
        
        // 生成新挑战供下次使用
        setTimeout(() => {
          generateMockChallenge()
        }, 1000)
      }

      return {
        success: result.success,
        error: result.error,
        timestamp: Date.now()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '开锁失败'
      console.error('模拟开锁操作失败:', err)
      return {
        success: false,
        error: errorMessage,
        timestamp: Date.now()
      }
    } finally {
      isUnlocking.value = false
    }
  }

  /**
   * 请求新的模拟挑战
   */
  const requestNewChallenge = async (): Promise<boolean> => {
    if (!connectionState.value.isConnected) {
      return false
    }

    try {
      generateMockChallenge()
      return true
    } catch (err) {
      console.error('请求新模拟挑战失败:', err)
      return false
    }
  }

  /**
   * 检查模拟蓝牙支持
   */
  const checkBluetoothSupport = (): boolean => {
    return true // 模拟模式始终支持
  }

  /**
   * 智能连接（模拟）
   */
  const smartConnect = async (): Promise<boolean> => {
    return await connect()
  }

  /**
   * 检查是否支持新版 Web Bluetooth API（模拟）
   */
  const checkWebBluetoothSupport = (): boolean => {
    return true // 模拟模式下总是返回支持
  }

  /**
   * 获取已授权的蓝牙设备列表（模拟）
   */
  const getAuthorizedDevices = async (): Promise<BluetoothDevice[]> => {
    return [{ name: '模拟设备 ESP32_BLE_Server' } as BluetoothDevice]
  }

  /**
   * 连接到已授权设备（模拟）
   */
  const connectToAuthorizedDevice = async (): Promise<boolean> => {
    return await connect()
  }

  /**
   * 模拟获取保存的授权设备
   */
  const getSavedAuthorizedDevices = () => {
    console.log('模拟蓝牙：获取保存的授权设备')
    return [
      { id: 'mock-device-1', name: '模拟设备 ESP32_BLE_Server', savedAt: Date.now() }
    ]
  }

  /**
   * 模拟启动广告监听
   */
  const startAdvertisementWatching = async (): Promise<boolean> => {
    console.log('模拟蓝牙：启动广告监听')
    isWatchingAdvertisements.value = true
    autoReconnectEnabled.value = true
    return true
  }

  /**
   * 模拟停止广告监听
   */
  const stopAdvertisementWatching = () => {
    console.log('模拟蓝牙：停止广告监听')
    isWatchingAdvertisements.value = false
    autoReconnectEnabled.value = false
  }

  /**
   * 模拟检查自动启动监听
   */
  const checkAutoStartWatching = async () => {
    console.log('模拟蓝牙：检查自动启动监听')
    // 模拟器不需要实际检查
  }

  // 计算属性
  const isConnected = computed(() => connectionState.value.isConnected)
  const isConnecting = computed(() => connectionState.value.isConnecting)
  const hasChallenge = computed(() => !!lastChallenge.value)
  const canUnlock = computed(() => {
    const result = isConnected.value && hasChallenge.value && !isUnlocking.value
    console.log('模拟蓝牙 canUnlock:', { 
      isConnected: isConnected.value, 
      hasChallenge: hasChallenge.value, 
      isUnlocking: isUnlocking.value,
      result 
    })
    return result
  })

  return {
    // 状态
    connectionState: computed(() => connectionState.value),
    isConnected,
    isConnecting,
    isUnlocking: computed(() => isUnlocking.value),
    hasChallenge,
    canUnlock,
    lastChallenge: computed(() => lastChallenge.value),
    isWatchingAdvertisements: computed(() => isWatchingAdvertisements.value),
    autoReconnectEnabled: computed(() => autoReconnectEnabled.value),

    // 方法
    connect,
    disconnect,
    unlock,
    requestNewChallenge,
    checkBluetoothSupport,
    smartConnect,
    checkWebBluetoothSupport,
    getAuthorizedDevices,
    getSavedAuthorizedDevices,
    connectToAuthorizedDevice,
    startAdvertisementWatching,
    stopAdvertisementWatching,
    checkAutoStartWatching
  }
}
