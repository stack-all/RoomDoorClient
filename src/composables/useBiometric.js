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
    }
    // 使用生物识别保存密码
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
                    timestamp: Date.now()
                }

                localStorage.setItem('biometric_credential', JSON.stringify(credentialData))
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
    }
    // 使用生物识别获取密码
    const getPasswordWithBiometric = async () => {
        if (!supportsBiometric.value || !biometricSaveEnabled.value) {
            throw new Error('生物识别不可用')
        }

        const credentialData = localStorage.getItem('biometric_credential')
        if (!credentialData) {
            throw new Error('未找到生物识别凭据')
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
                return atob(data.password)
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
    }

    // 清除生物识别凭据
    const clearBiometricCredentials = () => {
        localStorage.removeItem('biometric_credential')
    }

    // 初始化检查
    checkBiometricSupport()

    return {
        supportsBiometric,
        biometricSaveEnabled,
        toggleBiometricSave,
        savePasswordWithBiometric,
        getPasswordWithBiometric,
        clearBiometricCredentials
    }
}
