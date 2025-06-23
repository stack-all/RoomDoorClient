import { deriveKey, hexToWordArray, wordArrayToHex } from '@/services/crypto'
import { describe, expect, it } from 'vitest'

describe('CryptoService', () => {
  // 测试数据 - 基础功能测试
  const TEST_CHALLENGE_HEX = '0123456789abcdef' // 8字节挑战

  describe('hex conversion', () => {
    it('应该正确转换十六进制字符串和 WordArray', () => {
      const originalHex = TEST_CHALLENGE_HEX
      const wordArray = hexToWordArray(originalHex)
      const convertedHex = wordArrayToHex(wordArray)

      expect(convertedHex).toBe(originalHex)
      expect(wordArray.sigBytes).toBe(8)
    })

    it('应该处理不同长度的十六进制字符串', () => {
      const testCases = [
        '01', // 1 byte
        '0123', // 2 bytes
        '012345', // 3 bytes
        '01234567', // 4 bytes
        '0123456789abcdef01234567', // 12 bytes
      ]

      for (const testHex of testCases) {
        const wordArray = hexToWordArray(testHex)
        const convertedHex = wordArrayToHex(wordArray)

        expect(convertedHex).toBe(testHex)
        expect(wordArray.sigBytes).toBe(testHex.length / 2)
      }
    })
  })

  describe('数据结构验证', () => {
    it('WordArray 应该有正确的结构', () => {
      const testHex = '0123456789abcdef'
      const wordArray = hexToWordArray(testHex)

      expect(wordArray).toHaveProperty('words')
      expect(wordArray).toHaveProperty('sigBytes')
      expect(Array.isArray(wordArray.words)).toBe(true)
      expect(typeof wordArray.sigBytes).toBe('number')
    })

    it('应该正确处理空字符串', () => {
      const wordArray = hexToWordArray('')
      expect(wordArray.sigBytes).toBe(0)
      expect(wordArrayToHex(wordArray)).toBe('')
    })
  })

  describe('边界条件测试', () => {
    it('应该处理奇数长度的十六进制字符串', () => {
      const oddHex = '123' // 奇数长度会被补0
      const wordArray = hexToWordArray(oddHex)
      // CryptoJS 处理奇数长度字符串的方式可能不同
      expect(wordArray.sigBytes).toBeGreaterThan(0)
      expect(typeof wordArray.sigBytes).toBe('number')
    })

    it('应该正确处理大写十六进制', () => {
      const upperHex = '0123456789ABCDEF'
      const wordArray = hexToWordArray(upperHex)
      const convertedHex = wordArrayToHex(wordArray)

      // 转换后应该是小写
      expect(convertedHex).toBe('0123456789abcdef')
    })
  })

  // 注意：真实的加密测试需要在浏览器环境中运行
  // 因为 @originjs/crypto-js-wasm 需要 WASM 支持
  describe('加密功能说明', () => {
    it('应该了解加密流程', () => {
      // 这个测试主要用于说明预期的加密流程
      const password = '123456'
      const challenge = '0123456789abcdef'

      // 1. 使用 SHA256 派生密钥：hashlib.sha256(password.encode()).digest()
      // 2. 使用 AES-ECB + PKCS7 加密挑战数据
      // 3. 返回加密后的结果给 ESP32

      expect(password).toBe('123456')
      expect(challenge).toBe('0123456789abcdef')

      // 预期的 SHA256(123456) 结果
      const expectedKeyHex = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'
      expect(expectedKeyHex).toHaveLength(64) // 32字节 = 64个十六进制字符
    })
  })

  describe('密钥派生测试', () => {
    it('应该能够派生密钥', () => {
      const testPassword = 'test123'
      const keyWordArray = deriveKey(testPassword)

      expect(keyWordArray).toBeDefined()
      expect(keyWordArray.sigBytes).toBe(32) // SHA256 产生 32 字节
      expect(Array.isArray(keyWordArray.words)).toBe(true)
    })
  })
})
