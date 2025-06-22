export function useStorage() {
    const LAST_DEVICE_KEY = 'last_connected_device'
    const STORED_PASSWORD_KEY = 'stored_password'

    // 获取上次连接的设备
    const getLastDevice = () => {
        try {
            const deviceData = localStorage.getItem(LAST_DEVICE_KEY)
            return deviceData ? JSON.parse(deviceData) : null
        } catch (error) {
            console.error('获取上次连接设备失败:', error)
            return null
        }
    }

    // 保存上次连接的设备
    const saveLastDevice = (device) => {
        try {
            const deviceData = {
                id: device.id,
                name: device.name,
                timestamp: Date.now()
            }
            localStorage.setItem(LAST_DEVICE_KEY, JSON.stringify(deviceData))
        } catch (error) {
            console.error('保存设备信息失败:', error)
        }
    }

    // 获取存储的密码
    const getStoredPassword = () => {
        try {
            const passwordData = localStorage.getItem(STORED_PASSWORD_KEY)
            if (passwordData) {
                const data = JSON.parse(passwordData)
                // 检查密码是否过期（7天）
                if (Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000) {
                    return atob(data.password) // Base64解码
                } else {
                    // 密码已过期，清除
                    localStorage.removeItem(STORED_PASSWORD_KEY)
                }
            }
            return null
        } catch (error) {
            console.error('获取存储密码失败:', error)
            return null
        }
    }

    // 保存密码
    const saveStoredPassword = (password) => {
        try {
            const passwordData = {
                password: btoa(password), // Base64编码
                timestamp: Date.now()
            }
            localStorage.setItem(STORED_PASSWORD_KEY, JSON.stringify(passwordData))
        } catch (error) {
            console.error('保存密码失败:', error)
        }
    }

    // 清除存储的密码
    const clearStoredPassword = () => {
        localStorage.removeItem(STORED_PASSWORD_KEY)
    }

    // 清除所有存储数据
    const clearAllStorage = () => {
        localStorage.removeItem(LAST_DEVICE_KEY)
        localStorage.removeItem(STORED_PASSWORD_KEY)
        localStorage.removeItem('biometric_enabled')
        localStorage.removeItem('biometric_credential')
    }

    return {
        getLastDevice,
        saveLastDevice,
        getStoredPassword,
        saveStoredPassword,
        clearStoredPassword,
        clearAllStorage
    }
}
