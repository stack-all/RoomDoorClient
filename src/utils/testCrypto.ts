import { deriveKey, encryptChallenge } from '@/services/crypto'
import { uint8ArrayToHex, uint8ArrayToWordArray, wordArrayToUint8Array } from '@/utils/arrayBuffer'

/**
 * 测试加密流程是否正确
 */
export function testCryptoFlow() {
  console.log('=== 测试加密流程 ===')

  // 测试密码
  const password = '123456'
  console.log('测试密码:', password)

  // 派生密钥
  const keyWordArray = deriveKey(password)
  const keyBytes = wordArrayToUint8Array(keyWordArray)
  console.log('派生密钥 (hex):', uint8ArrayToHex(keyBytes))
  console.log('密钥长度:', keyBytes.length, '字节')

  // 模拟挑战
  const challengeBytes = new Uint8Array([0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef])
  const challengeWordArray = uint8ArrayToWordArray(challengeBytes)
  console.log('挑战数据 (hex):', uint8ArrayToHex(challengeBytes))

  // 加密挑战
  const encryptedChallenge = encryptChallenge(challengeWordArray, keyWordArray)
  const encryptedBytes = wordArrayToUint8Array(encryptedChallenge)
  console.log('加密响应 (hex):', uint8ArrayToHex(encryptedBytes))
  console.log('响应长度:', encryptedBytes.length, '字节')

  // 验证预期结果（与 ESP32 端一致性测试）
  // 这个值应该与 ESP32 端使用相同密码和挑战加密的结果一致
  console.log('=== 测试完成 ===')

  return {
    password,
    keyHex: uint8ArrayToHex(keyBytes),
    challengeHex: uint8ArrayToHex(challengeBytes),
    responseHex: uint8ArrayToHex(encryptedBytes),
  }
}

// 在开发环境中将函数暴露到全局
if (import.meta.env.DEV) {
  ;(window as any).testCryptoFlow = testCryptoFlow
}
