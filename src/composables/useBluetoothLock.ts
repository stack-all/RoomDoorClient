import { encryptChallenge } from '@/services/crypto'
import type { BluetoothConnectionState, ChallengeResponse, UnlockResult } from '@/types'
import { uint8ArrayToHex, uint8ArrayToWordArray, wordArrayToUint8Array } from '@/utils/arrayBuffer'
import { computed, ref } from 'vue'

// 蓝牙服务配置 - 与 ESP32 端保持一致
const BLUETOOTH_CONFIG = {
  serviceUUID: '1f04f3b3-0000-63b0-b612-3a8b9fe101ab',
  challengeCharacteristicUUID: '1f04f3b3-0002-63b0-b612-3a8b9fe101ab', // Read/Notify
  responseCharacteristicUUID: '1f04f3b3-0001-63b0-b612-3a8b9fe101ab', // Write
}

// 存储设备标识符的本地存储键
const SAVED_DEVICE_KEY = 'bluetooth_lock_device_id'
const SAVED_DEVICES_KEY = 'bluetooth_authorized_devices'
const ADVERTISEMENT_WATCH_KEY = 'bluetooth_advertisement_watching'

/**
 * 蓝牙门锁控制 Composable
 */
export function useBluetoothLock() {
  const connectionState = ref<BluetoothConnectionState>({
    isConnected: false,
    isConnecting: false,
    device: null,
    error: null,
  })

  const isUnlocking = ref(false)
  const lastChallenge = ref<ChallengeResponse | null>(null)
  const isWatchingAdvertisements = ref(false)
  const autoReconnectEnabled = ref(false)

  // 蓝牙服务和特征引用
  let service: BluetoothRemoteGATTService | null = null
  let challengeCharacteristic: BluetoothRemoteGATTCharacteristic | null = null
  let responseCharacteristic: BluetoothRemoteGATTCharacteristic | null = null
  let advertisementWatcher: AbortController | null = null

  // 连接控制状态
  let connectionAttemptInProgress = false
  let lastConnectionAttempt = 0
  let reconnectionDebounceTimer: number | null = null
  let deviceSelectionInProgress = false

  /**
   * 检查蓝牙支持
   */
  const checkBluetoothSupport = (): boolean => {
    if (!navigator.bluetooth) {
      connectionState.value.error = '此设备不支持蓝牙功能'
      return false
    }
    return true
  }

  /**
   * 检查是否支持新版 Web Bluetooth API
   */
  const checkWebBluetoothSupport = (): boolean => {
    return 'bluetooth' in navigator && typeof (navigator.bluetooth as any).getDevices === 'function'
  }

  /**
   * 获取已保存的授权设备列表
   */
  const getSavedAuthorizedDevices = (): Array<{ id: string; name?: string; savedAt: number }> => {
    try {
      const saved = localStorage.getItem(SAVED_DEVICES_KEY)
      return saved ? JSON.parse(saved) : []
    } catch (err) {
      console.error('获取保存的授权设备失败:', err)
      return []
    }
  }

  /**
   * 保存授权设备信息
   */
  const saveAuthorizedDevice = (device: BluetoothDevice) => {
    try {
      const savedDevices = getSavedAuthorizedDevices()
      const deviceInfo = {
        id: device.id,
        name: device.name,
        savedAt: Date.now(),
      }

      // 检查设备是否已存在，存在则更新时间戳
      const existingIndex = savedDevices.findIndex(d => d.id === device.id)
      if (existingIndex >= 0) {
        savedDevices[existingIndex] = deviceInfo
      } else {
        savedDevices.push(deviceInfo)
      }

      localStorage.setItem(SAVED_DEVICES_KEY, JSON.stringify(savedDevices))
      console.log('授权设备信息已保存:', deviceInfo)
    } catch (err) {
      console.error('保存授权设备信息失败:', err)
    }
  }

  /**
   * 获取已授权的蓝牙设备列表
   */
  const getAuthorizedDevices = async (): Promise<BluetoothDevice[]> => {
    if (!checkWebBluetoothSupport()) {
      console.log('新版 Web Bluetooth API 不支持，无法获取已授权设备')
      return []
    }

    try {
      const devices = await (navigator.bluetooth as any).getDevices()
      console.log('获取到已授权设备:', devices.length)

      // 获取之前保存的设备信息
      const savedDevices = getSavedAuthorizedDevices()

      // 优先返回之前保存过的设备，如果没有则返回支持我们服务的设备
      const filteredDevices = devices.filter((device: BluetoothDevice) => {
        // 首先检查是否是之前保存的设备
        const isSavedDevice = savedDevices.some(saved => saved.id === device.id)
        if (isSavedDevice) {
          console.log('找到已保存的授权设备:', device.name)
          return true
        }

        // 如果没有保存的设备，检查是否支持我们的服务
        // 注意：这里只能基于设备的基本信息判断，无法直接检查服务
        return device.gatt && device.name
      })

      return filteredDevices
    } catch (err) {
      console.error('获取已授权设备失败:', err)
      return []
    }
  }

  /**
   * 启动广告监听，实现自动重连
   */
  /**
   * 带防抖的自动重连逻辑
   */
  const debouncedReconnect = (device: BluetoothDevice, rssi: number) => {
    const now = Date.now()

    // 防止频繁重连：至少间隔3秒
    if (now - lastConnectionAttempt < 3000) {
      console.log('连接尝试间隔太短，跳过此次重连')
      return
    }

    // 清除之前的定时器
    if (reconnectionDebounceTimer) {
      clearTimeout(reconnectionDebounceTimer)
    }

    // 设置防抖延时：信号强度越强延时越短
    const debounceDelay = rssi > -60 ? 500 : rssi > -80 ? 1000 : 2000

    reconnectionDebounceTimer = window.setTimeout(async () => {
      if (!connectionState.value.isConnected && !connectionAttemptInProgress) {
        console.log(`设备信号强度: ${rssi}dBm, 开始自动连接...`)
        lastConnectionAttempt = now
        await connectToSpecificDevice(device, true)
      }
    }, debounceDelay)
  }

  /**
   * 启动广告监听
   */
  const startAdvertisementWatching = async (): Promise<boolean> => {
    if (!checkWebBluetoothSupport()) {
      console.log('新版 Web Bluetooth API 不支持，无法启动广告监听')
      return false
    }

    if (isWatchingAdvertisements.value || advertisementWatcher) {
      console.log('广告监听已在运行')
      return true
    }

    try {
      const authorizedDevices = await getAuthorizedDevices()
      if (authorizedDevices.length === 0) {
        console.log('没有已授权设备，无法启动广告监听')
        return false
      }

      advertisementWatcher = new AbortController()
      isWatchingAdvertisements.value = true
      autoReconnectEnabled.value = true

      console.log('开始监听设备广告...')

      // 监听所有已授权设备的广告
      for (const device of authorizedDevices) {
        try {
          await (device as any).watchAdvertisements({
            signal: advertisementWatcher.signal,
          })

          device.addEventListener('advertisementreceived', (event: any) => {
            const rssi = event.rssi || -100
            console.log(`收到设备广告: ${event.device.name}, RSSI: ${rssi}dBm`)

            // 只有在未连接且未在连接中时才尝试自动连接
            if (!connectionState.value.isConnected && !connectionState.value.isConnecting) {
              debouncedReconnect(event.device, rssi)
            }
          })

          console.log('已为设备启动广告监听:', device.name)
        } catch (err) {
          console.error('为设备启动广告监听失败:', device.name, err)
        }
      }

      // 保存监听状态
      localStorage.setItem(ADVERTISEMENT_WATCH_KEY, 'true')

      return true
    } catch (err) {
      console.error('启动广告监听失败:', err)
      isWatchingAdvertisements.value = false
      autoReconnectEnabled.value = false
      return false
    }
  }

  /**
   * 停止广告监听
   */
  const stopAdvertisementWatching = () => {
    // 清理定时器
    if (reconnectionDebounceTimer) {
      clearTimeout(reconnectionDebounceTimer)
      reconnectionDebounceTimer = null
    }

    if (advertisementWatcher) {
      advertisementWatcher.abort()
      advertisementWatcher = null
    }

    isWatchingAdvertisements.value = false
    autoReconnectEnabled.value = false
    connectionAttemptInProgress = false
    deviceSelectionInProgress = false

    // 清除存储状态
    localStorage.removeItem(ADVERTISEMENT_WATCH_KEY)

    console.log('已停止广告监听')
  }

  /**
   * 检查是否应该自动启动广告监听
   */
  const checkAutoStartWatching = async () => {
    const shouldWatch = localStorage.getItem(ADVERTISEMENT_WATCH_KEY) === 'true'
    if (shouldWatch && !isWatchingAdvertisements.value) {
      // 检查是否有已授权设备
      const authorizedDevices = await getAuthorizedDevices()
      if (authorizedDevices.length > 0) {
        console.log('检测到之前启用了广告监听，尝试自动启动...')
        await startAdvertisementWatching()
      } else {
        console.log('没有已授权设备，清除广告监听状态')
        localStorage.removeItem(ADVERTISEMENT_WATCH_KEY)
      }
    }
  }

  /**
   * 保存设备信息到本地存储
   */
  const saveDeviceInfo = (device: BluetoothDevice) => {
    try {
      const deviceInfo = {
        id: device.id,
        name: device.name,
        savedAt: Date.now(),
      }
      localStorage.setItem(SAVED_DEVICE_KEY, JSON.stringify(deviceInfo))
      console.log('设备信息已保存:', deviceInfo)
    } catch (err) {
      console.error('保存设备信息失败:', err)
    }
  }

  /**
   * 获取保存的设备信息
   */
  const getSavedDeviceInfo = () => {
    try {
      const saved = localStorage.getItem(SAVED_DEVICE_KEY)
      return saved ? JSON.parse(saved) : null
    } catch (err) {
      console.error('获取保存的设备信息失败:', err)
      return null
    }
  }

  /**
   * 尝试连接到已授权的设备
   */
  const connectToAuthorizedDevice = async (): Promise<boolean> => {
    const authorizedDevices = await getAuthorizedDevices()

    if (authorizedDevices.length === 0) {
      console.log('没有找到已授权的门锁设备')
      return false
    }

    // 优先尝试连接之前保存的设备
    const savedInfo = getSavedDeviceInfo()
    let targetDevice = null

    if (savedInfo) {
      targetDevice = authorizedDevices.find(device => device.id === savedInfo.id)
      if (targetDevice) {
        console.log('找到之前保存的设备:', targetDevice.name)
      }
    }

    // 如果没有找到保存的设备，使用第一个可用设备
    if (!targetDevice && authorizedDevices.length > 0) {
      targetDevice = authorizedDevices[0]
      console.log('使用第一个可用设备:', targetDevice.name)
    }

    if (targetDevice) {
      return await connectToSpecificDevice(targetDevice)
    }

    return false
  }

  /**
   * 连接到指定的设备
   * @param device 要连接的蓝牙设备
   * @param autoConnect 是否为自动连接（影响错误处理和日志）
   */
  const connectToSpecificDevice = async (
    device: BluetoothDevice,
    autoConnect = false,
  ): Promise<boolean> => {
    try {
      // 防止并发连接
      if (connectionAttemptInProgress) {
        if (!autoConnect) console.log('已有连接正在进行中，跳过此次连接')
        return false
      }

      connectionAttemptInProgress = true
      connectionState.value.isConnecting = true
      connectionState.value.error = null

      if (!device.gatt) {
        throw new Error('设备不支持 GATT 连接')
      }

      // 监听设备断开事件
      device.addEventListener('gattserverdisconnected', handleDisconnect)

      // 连接到 GATT 服务器
      const server = await device.gatt.connect()

      // 获取服务
      service = await server.getPrimaryService(BLUETOOTH_CONFIG.serviceUUID)

      // 获取特征
      challengeCharacteristic = await service.getCharacteristic(
        BLUETOOTH_CONFIG.challengeCharacteristicUUID,
      )
      responseCharacteristic = await service.getCharacteristic(
        BLUETOOTH_CONFIG.responseCharacteristicUUID,
      )

      // 启用挑战通知
      await challengeCharacteristic.startNotifications()
      challengeCharacteristic.addEventListener(
        'characteristicvaluechanged',
        handleChallengeReceived,
      )

      // 更新连接状态
      connectionState.value = {
        isConnected: true,
        isConnecting: false,
        device,
        error: null,
      }

      // 保存设备信息
      saveDeviceInfo(device)

      // 保存到授权设备列表
      saveAuthorizedDevice(device)

      const logMessage = autoConnect ? '自动连接成功' : '蓝牙连接成功'
      console.log(`${logMessage}:`, device.name)

      // 自动请求一个挑战
      setTimeout(async () => {
        await requestNewChallenge()
      }, 500)

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '连接失败'
      connectionState.value = {
        isConnected: false,
        isConnecting: false,
        device: null,
        error: errorMessage,
      }

      if (!autoConnect) {
        console.error('连接到指定设备失败:', err)
      } else {
        console.log('自动连接失败:', errorMessage)
      }
      return false
    } finally {
      connectionAttemptInProgress = false
    }
  }

  /**
   * 智能连接 - 优先尝试已授权设备，失败时弹出设备选择
   */
  const smartConnect = async (): Promise<boolean> => {
    if (!checkBluetoothSupport()) return false

    // 防止重复弹出设备选择器
    if (deviceSelectionInProgress) {
      console.log('设备选择器已打开，跳过此次连接')
      return false
    }

    // 首先尝试连接已授权的设备
    const authorizedSuccess = await connectToAuthorizedDevice()
    if (authorizedSuccess) {
      // 连接成功后，启动广告监听以实现自动重连
      if (checkWebBluetoothSupport() && !isWatchingAdvertisements.value) {
        console.log('连接成功，启动广告监听...')
        setTimeout(() => startAdvertisementWatching(), 1000)
      }
      return true
    }

    // 如果没有已授权设备或连接失败，则弹出设备选择
    console.log('尝试通过设备选择器连接...')

    try {
      deviceSelectionInProgress = true
      const manualSuccess = await connect()

      // 手动连接成功后也启动广告监听
      if (manualSuccess && checkWebBluetoothSupport() && !isWatchingAdvertisements.value) {
        console.log('手动连接成功，启动广告监听...')
        setTimeout(() => startAdvertisementWatching(), 1000)
      }

      return manualSuccess
    } finally {
      deviceSelectionInProgress = false
    }
  }

  /**
   * 连接到蓝牙设备（传统方式 - 弹出设备选择器）
   */
  const connect = async (): Promise<boolean> => {
    if (!checkBluetoothSupport()) return false

    try {
      connectionState.value.isConnecting = true
      connectionState.value.error = null

      // 请求蓝牙设备
      const device = await navigator.bluetooth.requestDevice({
        filters: [{
          services: [BLUETOOTH_CONFIG.serviceUUID],
        }],
        optionalServices: [BLUETOOTH_CONFIG.serviceUUID],
      })

      return await connectToSpecificDevice(device)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '连接失败'
      connectionState.value = {
        isConnected: false,
        isConnecting: false,
        device: null,
        error: errorMessage,
      }
      console.error('蓝牙连接失败:', err)
      return false
    }
  }

  /**
   * 断开蓝牙连接
   */
  const disconnect = () => {
    try {
      // 停止广告监听
      stopAdvertisementWatching()

      // 清理连接状态
      connectionAttemptInProgress = false
      deviceSelectionInProgress = false

      // 清理定时器
      if (reconnectionDebounceTimer) {
        clearTimeout(reconnectionDebounceTimer)
        reconnectionDebounceTimer = null
      }

      if (challengeCharacteristic) {
        challengeCharacteristic.removeEventListener(
          'characteristicvaluechanged',
          handleChallengeReceived,
        )
        // 只有在设备仍连接时才尝试停止通知
        if (connectionState.value.device?.gatt?.connected) {
          challengeCharacteristic.stopNotifications().catch(console.error)
        }
        challengeCharacteristic = null
      }

      if (connectionState.value.device?.gatt?.connected) {
        connectionState.value.device.gatt.disconnect()
      }

      if (connectionState.value.device) {
        connectionState.value.device.removeEventListener('gattserverdisconnected', handleDisconnect)
      }

      service = null
      responseCharacteristic = null
      lastChallenge.value = null
    } catch (err) {
      console.error('断开连接时出错:', err)
    } finally {
      connectionState.value = {
        isConnected: false,
        isConnecting: false,
        device: null,
        error: null,
      }
    }
  }

  /**
   * 处理设备断开事件
   */
  const handleDisconnect = () => {
    console.log('蓝牙设备已断开')
    disconnect()
  }

  /**
   * 处理接收到的挑战数据
   */
  const handleChallengeReceived = (event: Event) => {
    const target = event.target as unknown as BluetoothRemoteGATTCharacteristic
    const value = target.value

    console.log('收到挑战事件，数据长度:', value?.byteLength || 0)

    if (value && value.byteLength === 8) {
      const challengeBytes = new Uint8Array(value.buffer)
      lastChallenge.value = {
        challenge: challengeBytes,
        timestamp: Date.now(),
      }

      console.log('接收到有效挑战:', uint8ArrayToHex(challengeBytes))
    } else {
      console.warn('收到无效挑战数据，长度:', value?.byteLength || 0)
    }
  }

  /**
   * 执行开锁操作
   * @param aesKey 原始 AES 密钥 (Uint8Array 格式)
   */
  const unlock = async (aesKey: Uint8Array): Promise<UnlockResult> => {
    if (!connectionState.value.isConnected || !responseCharacteristic) {
      return {
        success: false,
        error: '设备未连接',
        timestamp: Date.now(),
      }
    }

    try {
      isUnlocking.value = true

      // 如果没有挑战或挑战过期，请求新挑战
      if (!lastChallenge.value || (Date.now() - lastChallenge.value.timestamp > 30000)) {
        console.log('请求新挑战...')
        const challengeRequested = await requestNewChallenge()
        if (!challengeRequested) {
          return {
            success: false,
            error: '无法获取挑战数据',
            timestamp: Date.now(),
          }
        }

        // 等待挑战响应
        await new Promise(resolve => setTimeout(resolve, 1000))

        if (!lastChallenge.value) {
          return {
            success: false,
            error: '挑战数据获取超时',
            timestamp: Date.now(),
          }
        }
      }

      // 转换密钥和挑战为 WordArray 格式
      const keyWordArray = uint8ArrayToWordArray(aesKey)
      const challengeWordArray = uint8ArrayToWordArray(lastChallenge.value.challenge)

      // 使用 AES-ECB 加密挑战
      const encryptedChallenge = encryptChallenge(challengeWordArray, keyWordArray)

      // 转换为 Uint8Array 并发送
      const responseBytes = wordArrayToUint8Array(encryptedChallenge)

      console.log('发送加密响应:', uint8ArrayToHex(responseBytes))

      await responseCharacteristic.writeValue(responseBytes)

      // 清除已使用的挑战
      lastChallenge.value = null

      return {
        success: true,
        timestamp: Date.now(),
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '开锁失败'
      console.error('开锁操作失败:', err)
      return {
        success: false,
        error: errorMessage,
        timestamp: Date.now(),
      }
    } finally {
      isUnlocking.value = false
    }
  }

  /**
   * 请求新的挑战（如果需要）
   */
  const requestNewChallenge = async (): Promise<boolean> => {
    if (!connectionState.value.isConnected || !challengeCharacteristic) {
      console.log(
        '无法请求挑战，连接状态:',
        connectionState.value.isConnected,
        '特征:',
        !!challengeCharacteristic,
      )
      return false
    }

    try {
      console.log('请求新挑战...')
      // 读取当前挑战值，这会触发 characteristicvaluechanged 事件
      const value = await challengeCharacteristic.readValue()
      console.log('挑战读取成功，长度:', value.byteLength)

      // 手动触发处理函数，因为有时候事件不会自动触发
      if (value.byteLength > 0) {
        handleChallengeReceived({ target: { value } } as any)
      }

      return true
    } catch (err) {
      console.error('请求新挑战失败:', err)
      return false
    }
  }

  /**
   * 移除已授权设备
   */
  const removeAuthorizedDevice = (deviceId: string) => {
    try {
      const savedDevices = getSavedAuthorizedDevices()
      const filteredDevices = savedDevices.filter(d => d.id !== deviceId)
      localStorage.setItem(SAVED_DEVICES_KEY, JSON.stringify(filteredDevices))

      // 如果删除的是当前保存的设备，也清除该记录
      const savedInfo = getSavedDeviceInfo()
      if (savedInfo && savedInfo.id === deviceId) {
        localStorage.removeItem(SAVED_DEVICE_KEY)
      }

      console.log('已移除授权设备:', deviceId)
      return true
    } catch (err) {
      console.error('移除授权设备失败:', err)
      return false
    }
  }

  /**
   * 清除所有授权设备
   */
  const clearAllAuthorizedDevices = () => {
    try {
      localStorage.removeItem(SAVED_DEVICES_KEY)
      localStorage.removeItem(SAVED_DEVICE_KEY)
      localStorage.removeItem(ADVERTISEMENT_WATCH_KEY)
      stopAdvertisementWatching()
      console.log('已清除所有授权设备')
      return true
    } catch (err) {
      console.error('清除授权设备失败:', err)
      return false
    }
  }

  // 计算属性
  const isConnected = computed(() => connectionState.value.isConnected)
  const isConnecting = computed(() => connectionState.value.isConnecting)
  const hasChallenge = computed(() => !!lastChallenge.value)
  const canUnlock = computed(() => {
    const result = isConnected.value && hasChallenge.value && !isUnlocking.value
    console.log('canUnlock computed:', {
      isConnected: isConnected.value,
      hasChallenge: hasChallenge.value,
      isUnlocking: isUnlocking.value,
      result,
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
    smartConnect,
    disconnect,
    unlock,
    requestNewChallenge,
    checkBluetoothSupport,
    checkWebBluetoothSupport,
    getAuthorizedDevices,
    getSavedAuthorizedDevices,
    connectToAuthorizedDevice,
    startAdvertisementWatching,
    stopAdvertisementWatching,
    checkAutoStartWatching,
    removeAuthorizedDevice,
    clearAllAuthorizedDevices,
  }
}
