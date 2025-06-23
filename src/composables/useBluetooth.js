import { ref, reactive, computed } from 'vue'
import CryptoJS from 'crypto-js'

export function useBluetooth() {
    const isConnected = ref(false)
    const isConnecting = ref(false)
    const isScanning = ref(false)
    const isUnlocking = ref(false)
    const devices = ref([])
    const selectedDevice = ref(null)
    const connectedDevice = ref(null)

    // 蓝牙服务和特征UUID
    const SERVICE_UUID = "1f04f3b3-0000-63b0-b612-3a8b9fe101ab"
    const RESPONSE_CHARACTERISTIC_UUID = "1f04f3b3-0001-63b0-b612-3a8b9fe101ab"
    const CHALLENGE_CHARACTERISTIC_UUID = "1f04f3b3-0002-63b0-b612-3a8b9fe101ab"

    let bluetoothDevice = null
    let gattServer = null
    let service = null
    let responseCharacteristic = null
    let challengeCharacteristic = null
    let currentChallenge = null

    // 检查浏览器是否支持蓝牙
    const isBluetoothSupported = () => {
        return 'bluetooth' in navigator
    }

    // 扫描蓝牙设备
    const scanDevices = async () => {
        if (!isBluetoothSupported()) {
            throw new Error('当前浏览器不支持蓝牙功能')
        }

        isScanning.value = true
        devices.value = []

        try {
            // 请求蓝牙设备
            const device = await navigator.bluetooth.requestDevice({
                filters: [
                    { services: [SERVICE_UUID] }
                ],
                optionalServices: [SERVICE_UUID]
            })

            devices.value = [{
                id: device.id,
                name: device.name,
                device: device
            }]

            if (devices.value.length > 0) {
                selectedDevice.value = devices.value[0]
            }
        } catch (error) {
            console.error('扫描设备失败:', error)
            if (error.name === 'NotFoundError') {
                throw new Error('未找到门锁设备，请确保设备已开启')
            } else if (error.name === 'SecurityError') {
                throw new Error('需要HTTPS环境才能使用蓝牙功能')
            } else {
                throw new Error('扫描失败: ' + error.message)
            }
        } finally {
            isScanning.value = false
        }
    }

    // 选择设备
    const selectDevice = (device) => {
        selectedDevice.value = device
    }

    // 连接设备
    const connect = async (password) => {
        if (!selectedDevice.value) {
            throw new Error('请先选择设备')
        }

        isConnecting.value = true

        try {
            bluetoothDevice = selectedDevice.value.device || await navigator.bluetooth.requestDevice({
                filters: [{ services: [SERVICE_UUID] }],
                optionalServices: [SERVICE_UUID]
            })

            // 连接GATT服务器
            gattServer = await bluetoothDevice.gatt.connect()

            // 获取服务
            service = await gattServer.getPrimaryService(SERVICE_UUID)

            // 获取特征
            responseCharacteristic = await service.getCharacteristic(RESPONSE_CHARACTERISTIC_UUID)
            challengeCharacteristic = await service.getCharacteristic(CHALLENGE_CHARACTERISTIC_UUID)

            // 监听挑战特征的通知
            await challengeCharacteristic.startNotifications()
            challengeCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
                currentChallenge = new Uint8Array(event.target.value.buffer)
                console.log('收到新挑战数据:', Array.from(currentChallenge).map(b => b.toString(16).padStart(2, '0')).join(''))
            })

            // 监听断开连接事件
            bluetoothDevice.addEventListener('gattserverdisconnected', () => {
                isConnected.value = false
                connectedDevice.value = null
                currentChallenge = null
                console.log('蓝牙设备已断开连接')
            })

            // 连接成功后，尝试读取当前挑战数据
            try {
                const initialChallenge = await challengeCharacteristic.readValue()
                if (initialChallenge && initialChallenge.byteLength > 0) {
                    currentChallenge = new Uint8Array(initialChallenge.buffer)
                    console.log('读取到初始挑战数据:', Array.from(currentChallenge).map(b => b.toString(16).padStart(2, '0')).join(''))
                }
            } catch (readError) {
                console.log('无法读取初始挑战数据，等待通知:', readError.message)
            }

            isConnected.value = true
            connectedDevice.value = selectedDevice.value

            return true
        } catch (error) {
            console.error('连接失败:', error)
            throw new Error('连接失败: ' + error.message)
        } finally {
            isConnecting.value = false
        }
    }

    // 断开连接
    const disconnect = async () => {
        try {
            if (challengeCharacteristic) {
                await challengeCharacteristic.stopNotifications()
            }
            if (gattServer && gattServer.connected) {
                gattServer.disconnect()
            }
        } catch (error) {
            console.error('断开连接时出错:', error)
        }

        isConnected.value = false
        connectedDevice.value = null
        bluetoothDevice = null
        gattServer = null
        service = null
        responseCharacteristic = null
        challengeCharacteristic = null
        currentChallenge = null
    }

    // AES加密函数
    const aesEncrypt = (data, password) => {
        // 将密码转换为32字节的AES密钥
        const key = CryptoJS.SHA256(password).toString()

        // 将数据转换为WordArray
        const dataWordArray = CryptoJS.lib.WordArray.create(data)

        // 使用AES-ECB模式加密（为了与Python代码兼容）
        const encrypted = CryptoJS.AES.encrypt(dataWordArray, CryptoJS.enc.Hex.parse(key), {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        })

        // 返回加密后的字节数组
        const encryptedBytes = encrypted.ciphertext.toString(CryptoJS.enc.Base64)
        return Uint8Array.from(atob(encryptedBytes), c => c.charCodeAt(0))
    }

    // 等待挑战数据
    const waitForChallenge = async (timeoutMs = 5000) => {
        return new Promise((resolve, reject) => {
            if (currentChallenge) {
                resolve(currentChallenge)
                return
            }

            const timeout = setTimeout(() => {
                reject(new Error('等待挑战数据超时'))
            }, timeoutMs)

            // 监听挑战数据更新
            const checkChallenge = () => {
                if (currentChallenge) {
                    clearTimeout(timeout)
                    resolve(currentChallenge)
                } else {
                    setTimeout(checkChallenge, 100)
                }
            }
            checkChallenge()
        })
    }

    // 开门
    const openDoor = async (password) => {
        if (!isConnected.value || !responseCharacteristic) {
            throw new Error('设备未连接')
        }

        isUnlocking.value = true

        try {
            // 等待挑战数据（如果当前没有）
            let challengeData = currentChallenge
            if (!challengeData) {
                console.log('等待挑战数据...')
                challengeData = await waitForChallenge(10000) // 等待10秒
            }

            console.log('使用挑战数据:', Array.from(challengeData).map(b => b.toString(16).padStart(2, '0')).join(''))

            // 使用AES加密挑战数据
            const encryptedChallenge = aesEncrypt(challengeData, password)

            console.log('发送加密响应:', Array.from(encryptedChallenge).map(b => b.toString(16).padStart(2, '0')).join(''))

            // 发送加密的挑战响应
            await responseCharacteristic.writeValue(encryptedChallenge)

            // 等待一段时间让门锁处理
            await new Promise(resolve => setTimeout(resolve, 2000))

            return true
        } catch (error) {
            console.error('开门失败:', error)
            if (error.message.includes('等待挑战数据超时')) {
                throw new Error('未收到门锁挑战数据，请检查连接状态')
            }
            throw new Error('开门失败: ' + error.message)
        } finally {
            isUnlocking.value = false
        }
    }  // 获取当前挑战数据的响应式状态
    const challengeData = computed(() => {
        if (!currentChallenge) return null
        return Array.from(currentChallenge).map(b => b.toString(16).padStart(2, '0')).join('')
    })

    const hasChallengeData = computed(() => {
        return currentChallenge !== null && currentChallenge.length > 0
    })

    return {
        isConnected,
        isConnecting,
        isScanning,
        isUnlocking,
        devices,
        selectedDevice,
        connectedDevice,
        challengeData,
        hasChallengeData,
        scanDevices,
        selectDevice,
        connect,
        disconnect,
        openDoor,
        isBluetoothSupported
    }
}
