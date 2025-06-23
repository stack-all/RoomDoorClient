import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LockState, AuthMode, DeviceSettings, UnlockResult } from '@/types'
import { useBluetoothLock } from '@/composables/useBluetoothLock'
import { useMockBluetoothLock } from '@/composables/useMockBluetoothLock'
import { useBiometrics } from '@/composables/useBiometrics'
import { useToast } from '@/composables/useToast'
import { deriveKey } from '@/services/crypto'
import { wordArrayToUint8Array } from '@/utils/arrayBuffer'

const SETTINGS_STORAGE_KEY = 'door_lock_settings'

export const useLockStore = defineStore('lock', () => {
  // 状态
  const lockState = ref<LockState>({
    isUnlocking: false,
    isUnlocked: false,
    lastUnlockTime: null,
    connectionState: {
      isConnected: false,
      isConnecting: false,
      device: null,
      error: null
    }
  })

  const authMode = ref<AuthMode>({
    type: 'manual',
    isEnabled: true
  })

  const deviceSettings = ref<DeviceSettings>({
    autoConnect: false,
    biometricEnabled: false,
    mockMode: false
  })

  // 组合式函数
  const realBluetooth = useBluetoothLock()
  const mockBluetooth = useMockBluetoothLock()
  const bluetooth = computed(() => deviceSettings.value.mockMode ? mockBluetooth : realBluetooth)
  const biometrics = useBiometrics()
  const toast = useToast()

  // 计算属性
  const isConnected = computed(() => bluetooth.value.isConnected.value)
  const isConnecting = computed(() => bluetooth.value.isConnecting.value)
  const canUnlock = computed(() => bluetooth.value.canUnlock.value)
  const connectionError = computed(() => bluetooth.value.connectionState.value.error)

  // 私有方法
  const loadSettings = () => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (stored) {
        const settings = JSON.parse(stored) as DeviceSettings
        deviceSettings.value = { ...deviceSettings.value, ...settings }
        
        if (settings.biometricEnabled && biometrics.isSupported.value) {
          authMode.value.type = 'biometric'
        }
      }
    } catch (err) {
      console.error('加载设置失败:', err)
    }
  }

  /**
   * 自动连接功能
   */
  const autoConnect = async () => {
    if (!deviceSettings.value.autoConnect || isConnected.value) {
      return
    }

    try {
      console.log('尝试自动连接...')
      toast.info('正在尝试自动连接设备...')
      
      // 使用智能连接，优先尝试已授权设备
      const success = await bluetooth.value.smartConnect()
      if (success) {
        toast.success('自动连接成功！')
      } else {
        console.log('自动连接失败，建议用户手动连接')
        toast.warning('自动连接失败，请手动连接设备')
      }
    } catch (err) {
      console.error('自动连接失败:', err)
      // 静默失败，不显示错误消息
    }
  }

  /**
   * 初始化自动重连功能
   */
  const initializeAutoReconnect = async () => {
    if (deviceSettings.value.autoConnect && bluetooth.value.checkWebBluetoothSupport()) {
      console.log('初始化自动重连功能...')
      
      // 检查是否应该自动启动广告监听
      await bluetooth.value.checkAutoStartWatching()
      
      // 如果当前未连接，尝试自动连接
      if (!isConnected.value) {
        setTimeout(() => autoConnect(), 500)
      }
    }
  }

  const saveSettings = () => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(deviceSettings.value))
    } catch (err) {
      console.error('保存设置失败:', err)
    }
  }

  // 公共方法

  /**
   * 连接到蓝牙设备
   */
  const connect = async (): Promise<boolean> => {
    try {
      lockState.value.connectionState.isConnecting = true
      const success = await bluetooth.value.connect()
      
      if (success) {
        lockState.value.connectionState = {
          isConnected: true,
          isConnecting: false,
          device: bluetooth.value.connectionState.value.device,
          error: null
        }
        toast.success('设备连接成功')
        return true
      }
      
      lockState.value.connectionState = bluetooth.value.connectionState.value
      toast.error(bluetooth.value.connectionState.value.error || '连接失败')
      return false
    } catch (err) {
      const error = err instanceof Error ? err.message : '连接失败'
      lockState.value.connectionState = {
        isConnected: false,
        isConnecting: false,
        device: null,
        error
      }
      toast.error(error)
      return false
    }
  }

  /**
   * 断开蓝牙连接
   */
  const disconnect = () => {
    bluetooth.value.disconnect()
    lockState.value.connectionState = {
      isConnected: false,
      isConnecting: false,
      device: null,
      error: null
    }
    lockState.value.isUnlocked = false
    toast.info('设备已断开连接')
  }

  /**
   * 使用密码开锁
   */
  const unlockWithPassword = async (password: string): Promise<UnlockResult> => {
    if (!isConnected.value) {
      const error = '设备未连接'
      toast.error(error)
      return { success: false, error, timestamp: Date.now() }
    }

    try {
      lockState.value.isUnlocking = true
      toast.info('正在验证密码...')

      // 派生密钥
      const keyWordArray = deriveKey(password)
      const keyBytes = wordArrayToUint8Array(keyWordArray)

      // 执行开锁
      const result = await bluetooth.value.unlock(keyBytes)

      if (result.success) {
        lockState.value.isUnlocked = true
        lockState.value.lastUnlockTime = result.timestamp
        toast.success('开锁成功！')
        
        // 5秒后重置状态
        setTimeout(() => {
          lockState.value.isUnlocked = false
        }, 5000)
      } else {
        toast.error(result.error || '开锁失败')
      }

      return result
    } catch (err) {
      const error = err instanceof Error ? err.message : '开锁失败'
      toast.error(error)
      return { success: false, error, timestamp: Date.now() }
    } finally {
      lockState.value.isUnlocking = false
    }
  }

  /**
   * 使用生物识别开锁
   */
  const unlockWithBiometrics = async (): Promise<UnlockResult> => {
    if (!biometrics.canUse.value) {
      const error = '生物识别不可用'
      toast.error(error)
      return { success: false, error, timestamp: Date.now() }
    }

    if (!isConnected.value) {
      const error = '设备未连接'
      toast.error(error)
      return { success: false, error, timestamp: Date.now() }
    }

    try {
      lockState.value.isUnlocking = true
      toast.info('请进行生物识别验证...')

      // 生物识别认证并获取密钥
      const keyBytes = await biometrics.authenticateAndUnwrap()
      
      if (!keyBytes) {
        const error = '生物识别认证失败'
        toast.error(error)
        return { success: false, error, timestamp: Date.now() }
      }

      // 执行开锁
      const result = await bluetooth.value.unlock(keyBytes)

      if (result.success) {
        lockState.value.isUnlocked = true
        lockState.value.lastUnlockTime = result.timestamp
        toast.success('开锁成功！')
        
        // 5秒后重置状态
        setTimeout(() => {
          lockState.value.isUnlocked = false
        }, 5000)
      } else {
        toast.error(result.error || '开锁失败')
      }

      return result
    } catch (err) {
      const error = err instanceof Error ? err.message : '生物识别认证失败'
      toast.error(error)
      return { success: false, error, timestamp: Date.now() }
    } finally {
      lockState.value.isUnlocking = false
    }
  }

  /**
   * 注册生物识别
   */
  const registerBiometrics = async (password: string): Promise<boolean> => {
    if (!biometrics.isSupported.value) {
      toast.error('设备不支持生物识别')
      return false
    }

    try {
      toast.info('正在注册生物识别...')
      
      // 派生密钥
      const keyWordArray = deriveKey(password)
      const keyBytes = wordArrayToUint8Array(keyWordArray)

      // 注册生物识别
      await biometrics.register(keyBytes)

      // 更新设置
      deviceSettings.value.biometricEnabled = true
      authMode.value.type = 'biometric'
      saveSettings()

      toast.success('生物识别注册成功')
      return true
    } catch (err) {
      const error = err instanceof Error ? err.message : '注册生物识别失败'
      toast.error(error)
      return false
    }
  }

  /**
   * 清除生物识别
   */
  const clearBiometrics = () => {
    biometrics.clearBiometrics()
    deviceSettings.value.biometricEnabled = false
    authMode.value.type = 'manual'
    saveSettings()
    toast.info('生物识别已清除')
  }

  /**
   * 自动开锁（用于快捷方式）
   */
  const autoUnlock = async (): Promise<UnlockResult> => {
    // 首先尝试连接
    if (!isConnected.value) {
      const connected = await connect()
      if (!connected) {
        return { success: false, error: '无法连接到设备', timestamp: Date.now() }
      }
      
      // 等待挑战数据
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // 优先使用生物识别
    if (biometrics.canUse.value && deviceSettings.value.biometricEnabled) {
      return await unlockWithBiometrics()
    }

    // 如果没有生物识别，显示错误
    const error = '需要生物识别或手动输入密码'
    toast.error(error)
    return { success: false, error, timestamp: Date.now() }
  }

  /**
   * 更新设备设置
   */
  const updateSettings = (newSettings: Partial<DeviceSettings>) => {
    deviceSettings.value = { ...deviceSettings.value, ...newSettings }
    saveSettings()
  }

  // 初始化
  loadSettings()

  // 页面加载时自动初始化自动重连功能
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      initializeAutoReconnect()
    }, 500)
  }
  
  // 延迟初始化自动重连，确保页面加载完成
  if (typeof window !== 'undefined') {
    setTimeout(() => initializeAutoReconnect(), 1000)
  }

  return {
    // 状态
    lockState: computed(() => lockState.value),
    authMode: computed(() => authMode.value),
    deviceSettings: computed(() => deviceSettings.value),
    
    // 计算属性
    isConnected,
    isConnecting,
    canUnlock,
    connectionError,
    
    // 方法
    connect,
    disconnect,
    unlockWithPassword,
    unlockWithBiometrics,
    registerBiometrics,
    clearBiometrics,
    autoUnlock,
    autoConnect,
    initializeAutoReconnect,
    updateSettings,
    
    // 组合式函数
    bluetooth,
    biometrics,
    toast
  }
})
