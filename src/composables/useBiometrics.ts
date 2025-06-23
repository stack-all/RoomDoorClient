import { ref, computed } from 'vue'
import type { BiometricCredential } from '@/types'
import { generateRandomBytes, uint8ArrayToHex, hexToUint8Array } from '@/utils/arrayBuffer'

const STORAGE_KEY = 'biometric_credential'
const CREDENTIAL_ID_KEY = 'credential_id'

/**
 * 生物识别认证 Composable
 */
export function useBiometrics() {
  const isSupported = ref(false)
  const isRegistered = ref(false)
  const isAuthenticating = ref(false)
  const error = ref<string | null>(null)

  // 检查是否支持 WebAuthn API
  const checkSupport = async () => {
    try {
      isSupported.value = 
        'credentials' in navigator &&
        'create' in navigator.credentials &&
        'get' in navigator.credentials &&
        typeof PublicKeyCredential !== 'undefined'
      
      if (isSupported.value) {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        isSupported.value = available
      }
      
      // 检查是否已注册
      const stored = localStorage.getItem(CREDENTIAL_ID_KEY)
      isRegistered.value = !!stored
    } catch (err) {
      console.error('检查生物识别支持时出错:', err)
      isSupported.value = false
    }
  }

  /**
   * 注册生物识别认证并保存加密密钥
   * @param keyToWrap 要保护的原始 AES 密钥 (Uint8Array)
   */
  const register = async (keyToWrap: Uint8Array): Promise<void> => {
    if (!isSupported.value) {
      throw new Error('设备不支持生物识别认证')
    }

    try {
      isAuthenticating.value = true
      error.value = null

      // 生成随机挑战
      const challenge = generateRandomBytes(32)
      
      // 创建凭据
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: '智能门锁控制面板',
            id: window.location.hostname
          },
          user: {
            id: generateRandomBytes(32),
            name: 'user@doorlock.local',
            displayName: '门锁用户'
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' }, // ES256
            { alg: -257, type: 'public-key' }  // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            requireResidentKey: false
          },
          timeout: 60000,
          attestation: 'none'
        }
      }) as PublicKeyCredential

      if (!credential) {
        throw new Error('创建生物识别凭据失败')
      }

      // 使用固定的本地密钥材料来生成包装密钥
      // 在生产环境中，应该使用更安全的密钥派生方案
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode('door-lock-biometric-key-2024'), // 固定的本地密钥材料
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      )

      const wrappingKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: new TextEncoder().encode('door-lock-salt'),
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        {
          name: 'AES-GCM',
          length: 256
        },
        false,
        ['wrapKey']
      )

      // 创建临时密钥以包装原始密钥
      const tempKey = await crypto.subtle.importKey(
        'raw',
        keyToWrap,
        { name: 'AES-GCM' },
        true,
        ['encrypt', 'decrypt']
      )

      // 生成随机 IV
      const iv = generateRandomBytes(12)

      // 包装密钥
      const wrappedKey = await crypto.subtle.wrapKey(
        'raw',
        tempKey,
        wrappingKey,
        {
          name: 'AES-GCM',
          iv
        }
      )

      // 保存凭据信息
      const credentialData: BiometricCredential = {
        credentialId: uint8ArrayToHex(new Uint8Array(credential.rawId)),
        wrappedKey: uint8ArrayToHex(new Uint8Array(wrappedKey)),
        iv: uint8ArrayToHex(iv)
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(credentialData))
      localStorage.setItem(CREDENTIAL_ID_KEY, credentialData.credentialId)
      
      isRegistered.value = true
    } catch (err) {
      error.value = err instanceof Error ? err.message : '注册生物识别认证失败'
      throw err
    } finally {
      isAuthenticating.value = false
    }
  }

  /**
   * 使用生物识别认证并解包密钥
   * @returns 解包后的原始 AES 密钥或 null
   */
  const authenticateAndUnwrap = async (): Promise<Uint8Array | null> => {
    if (!isSupported.value || !isRegistered.value) {
      throw new Error('生物识别认证不可用')
    }

    try {
      isAuthenticating.value = true
      error.value = null

      // 获取存储的凭据信息
      const storedData = localStorage.getItem(STORAGE_KEY)
      if (!storedData) {
        throw new Error('未找到生物识别凭据')
      }

      const credentialData: BiometricCredential = JSON.parse(storedData)
      const challenge = generateRandomBytes(32)

      // 请求认证
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{
            id: hexToUint8Array(credentialData.credentialId),
            type: 'public-key',
            transports: ['internal']
          }],
          userVerification: 'required',
          timeout: 60000
        }
      }) as PublicKeyCredential

      if (!assertion) {
        throw new Error('生物识别认证失败')
      }

      // 生物识别认证成功
      // 由于WebAuthn的限制，我们简化处理：
      // 实际的密钥应该通过服务器验证签名后返回，或者使用其他安全存储方案
      // 这里我们直接从加密存储中解密密钥（需要用户输入密码或使用设备密钥）
      
      // 临时解决方案：使用固定的本地包装密钥
      // 在生产环境中，应该使用更安全的密钥派生方案
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode('door-lock-biometric-key-2024'), // 固定的本地密钥材料
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      )

      const wrappingKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: new TextEncoder().encode('door-lock-salt'),
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        {
          name: 'AES-GCM',
          length: 256
        },
        false,
        ['unwrapKey']
      )

      // 解包密钥
      const unwrappedKey = await crypto.subtle.unwrapKey(
        'raw',
        hexToUint8Array(credentialData.wrappedKey),
        wrappingKey,
        {
          name: 'AES-GCM',
          iv: hexToUint8Array(credentialData.iv)
        },
        { name: 'AES-GCM' },
        true,
        ['encrypt', 'decrypt']
      )

      // 导出为原始字节
      const keyBuffer = await crypto.subtle.exportKey('raw', unwrappedKey)
      return new Uint8Array(keyBuffer)
    } catch (err) {
      console.error('生物识别认证解包失败:', err)
      error.value = err instanceof Error ? err.message : '认证失败'
      return null
    } finally {
      isAuthenticating.value = false
    }
  }

  /**
   * 清除生物识别凭据
   */
  const clearBiometrics = () => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(CREDENTIAL_ID_KEY)
    isRegistered.value = false
    error.value = null
  }

  // 计算属性
  const canUse = computed(() => isSupported.value && isRegistered.value)

  // 初始化检查
  checkSupport()

  return {
    isSupported: computed(() => isSupported.value),
    isRegistered: computed(() => isRegistered.value),
    isAuthenticating: computed(() => isAuthenticating.value),
    canUse,
    error: computed(() => error.value),
    register,
    authenticateAndUnwrap,
    clearBiometrics,
    checkSupport
  }
}
