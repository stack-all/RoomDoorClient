import { ref } from 'vue'

export function useBiometric() {
    const supportsBiometric = ref(false)
    const biometricSaveEnabled = ref(false)

    // 检查是否支持生物识别
    const checkBiometricSupport = () => {
        // 检查是否支持Web Authentication API
        supportsBiometric.value = 'credentials' in navigator && 'create' in navigator.credentials

        if (supportsBiometric.value) {
            // 检查用户是否已启用生物识别保存
            biometricSaveEnabled.value = localStorage.getItem('biometric_enabled') === 'true'
        }
    }

    // 切换生物识别保存状态
    const toggleBiometricSave = () => {
        biometricSaveEnabled.value = !biometricSaveEnabled.value
        localStorage.setItem('biometric_enabled', biometricSaveEnabled.value.toString())

        if (!biometricSaveEnabled.value) {
            // 如果禁用了生物识别，清除保存的凭据
            clearBiometricCredentials()
        }
    }    // 使用生物识别保存密码
    const savePasswordWithBiometric = async (password) => {
        if (!supportsBiometric.value || !biometricSaveEnabled.value) {
            throw new Error('生物识别不可用')
        }

        try {
            // 生成随机challenge
            const challenge = new Uint8Array(32)
            crypto.getRandomValues(challenge)

            // 创建凭据
            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge: challenge,
                    rp: {
                        name: "蓝牙门锁控制器",
                        id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname
                    },
                    user: {
                        id: new TextEncoder().encode('door-lock-user-' + Date.now()),
                        name: 'door-lock-user',
                        displayName: '门锁用户'
                    },
                    pubKeyCredParams: [
                        { alg: -7, type: "public-key" },  // ES256
                        { alg: -257, type: "public-key" } // RS256
                    ],
                    authenticatorSelection: {
                        authenticatorAttachment: "platform",
                        userVerification: "required",
                        requireResidentKey: false
                    },
                    timeout: 60000,
                    attestation: "none"
                }
            })

            if (credential) {
                // 将密码和凭据信息保存到本地存储
                const credentialData = {
                    id: credential.id,
                    rawId: Array.from(new Uint8Array(credential.rawId)),
                    password: btoa(password), // Base64编码密码
                    timestamp: Date.now(),
                    // 添加密码验证标识
                    passwordHash: await hashPassword(password)
                }

                localStorage.setItem('biometric_credential', JSON.stringify(credentialData))
                // 标记密码已通过指纹保存
                localStorage.setItem('biometric_password_saved', 'true')
                return true
            }
        } catch (error) {
            console.error('生物识别保存失败:', error)
            // 提供更友好的错误信息
            if (error.name === 'NotSupportedError') {
                throw new Error('当前设备不支持生物识别功能')
            } else if (error.name === 'NotAllowedError') {
                throw new Error('用户取消了生物识别设置')
            } else if (error.name === 'InvalidStateError') {
                throw new Error('生物识别功能暂时不可用')
            } else {
                throw new Error('生物识别保存失败，请稍后重试')
            }
        }
    }    // 使用生物识别获取密码
    const getPasswordWithBiometric = async () => {
        if (!supportsBiometric.value || !biometricSaveEnabled.value) {
            throw new Error('生物识别不可用')
        }

        const credentialData = localStorage.getItem('biometric_credential')
        if (!credentialData) {
            throw new Error('未找到生物识别凭据，请先成功开锁一次以保存密码')
        }

        try {
            const data = JSON.parse(credentialData)

            // 生成随机challenge
            const challenge = new Uint8Array(32)
            crypto.getRandomValues(challenge)

            // 验证生物识别
            const assertion = await navigator.credentials.get({
                publicKey: {
                    challenge: challenge,
                    allowCredentials: [{
                        id: new Uint8Array(data.rawId),
                        type: 'public-key',
                        transports: ['internal']
                    }],
                    userVerification: "required",
                    timeout: 60000
                }
            })

            if (assertion) {
                // 验证成功，返回密码
                const password = atob(data.password)
                
                // 验证密码完整性（如果有hash）
                if (data.passwordHash) {
                    const currentHash = await hashPassword(password)
                    if (currentHash !== data.passwordHash) {
                        throw new Error('密码数据已损坏，请重新保存')
                    }
                }
                
                return password
            }
        } catch (error) {
            console.error('生物识别验证失败:', error)
            // 提供更友好的错误信息
            if (error.name === 'NotAllowedError') {
                throw new Error('生物识别验证被取消')
            } else if (error.name === 'InvalidStateError') {
                throw new Error('生物识别功能暂时不可用')
            } else if (error.name === 'NotSupportedError') {
                throw new Error('当前设备不支持生物识别功能')
            } else {
                throw new Error('生物识别验证失败，请重试')
            }
        }
    }    // 清除生物识别凭据
    const clearBiometricCredentials = () => {
        localStorage.removeItem('biometric_credential')
        localStorage.removeItem('biometric_password_saved')
    }

    // 密码哈希函数（用于验证密码完整性）
    const hashPassword = async (password) => {
        const encoder = new TextEncoder()
        const data = encoder.encode(password + 'door-lock-salt')
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    }

    // 检查是否已保存密码
    const hasPasswordSaved = () => {
        return localStorage.getItem('biometric_password_saved') === 'true' && 
               localStorage.getItem('biometric_credential') !== null
    }

    // 初始化检查
    checkBiometricSupport()

    return {
        supportsBiometric,
        biometricSaveEnabled,
        toggleBiometricSave,
        savePasswordWithBiometric,
        getPasswordWithBiometric,
        clearBiometricCredentials,
        hasPasswordSaved
    }
}
