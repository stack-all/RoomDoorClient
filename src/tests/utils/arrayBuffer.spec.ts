import { describe, it, expect } from 'vitest'
import { 
  wordArrayToUint8Array, 
  uint8ArrayToWordArray, 
  hexToUint8Array, 
  uint8ArrayToHex,
  generateRandomBytes
} from '@/utils/arrayBuffer'
import { hexToWordArray, wordArrayToHex } from '@/services/crypto'

describe('ArrayBuffer Utils', () => {
  describe('wordArrayToUint8Array', () => {
    it('应该正确转换 WordArray 到 Uint8Array', () => {
      const testHex = '0123456789abcdef'
      const wordArray = hexToWordArray(testHex)
      const uint8Array = wordArrayToUint8Array(wordArray)
      
      expect(uint8Array).toBeInstanceOf(Uint8Array)
      expect(uint8Array.length).toBe(8)
      expect(uint8ArrayToHex(uint8Array)).toBe(testHex)
    })

    it('应该处理不同长度的数据', () => {
      const testCases = [
        '01',           // 1 byte
        '0123',         // 2 bytes  
        '012345',       // 3 bytes
        '01234567',     // 4 bytes
        '0123456789abcdef01234567' // 12 bytes
      ]

      for (const testHex of testCases) {
        const wordArray = hexToWordArray(testHex)
        const uint8Array = wordArrayToUint8Array(wordArray)
        
        expect(uint8Array.length).toBe(testHex.length / 2)
        expect(uint8ArrayToHex(uint8Array)).toBe(testHex)
      }
    })
  })

  describe('uint8ArrayToWordArray', () => {
    it('应该正确转换 Uint8Array 到 WordArray', () => {
      const testHex = '0123456789abcdef'
      const uint8Array = hexToUint8Array(testHex)
      const wordArray = uint8ArrayToWordArray(uint8Array)
      
      expect(wordArray.sigBytes).toBe(8)
      expect(wordArrayToHex(wordArray)).toBe(testHex)
    })

    it('应该处理空数组', () => {
      const uint8Array = new Uint8Array(0)
      const wordArray = uint8ArrayToWordArray(uint8Array)
      
      expect(wordArray.sigBytes).toBe(0)
      expect(wordArray.words).toEqual([])
    })
  })

  describe('双向转换一致性', () => {
    it('WordArray <-> Uint8Array 转换应该无损', () => {
      const testCases = [
        '00',
        'ff',
        '0123456789abcdef',
        '000102030405060708090a0b0c0d0e0f',
        'deadbeefcafebabe'
      ]

      for (const originalHex of testCases) {
        // WordArray -> Uint8Array -> WordArray
        const wordArray1 = hexToWordArray(originalHex)
        const uint8Array = wordArrayToUint8Array(wordArray1)
        const wordArray2 = uint8ArrayToWordArray(uint8Array)
        
        expect(wordArrayToHex(wordArray2)).toBe(originalHex)
        expect(wordArray2.sigBytes).toBe(wordArray1.sigBytes)

        // Uint8Array -> WordArray -> Uint8Array
        const uint8Array1 = hexToUint8Array(originalHex)
        const wordArray = uint8ArrayToWordArray(uint8Array1)
        const uint8Array2 = wordArrayToUint8Array(wordArray)
        
        expect(uint8ArrayToHex(uint8Array2)).toBe(originalHex)
        expect(uint8Array2.length).toBe(uint8Array1.length)
      }
    })
  })

  describe('hexToUint8Array', () => {
    it('应该正确解析十六进制字符串', () => {
      const testHex = '0123456789abcdef'
      const uint8Array = hexToUint8Array(testHex)
      
      expect(uint8Array).toEqual(new Uint8Array([0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef]))
    })

    it('应该处理大小写混合', () => {
      const testHex = '0123456789ABCDEF'
      const uint8Array = hexToUint8Array(testHex)
      
      expect(uint8Array).toEqual(new Uint8Array([0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef]))
    })

    it('应该忽略非十六进制字符', () => {
      const testHex = '01-23-45:67 89ab cdef'
      const uint8Array = hexToUint8Array(testHex)
      
      expect(uint8ArrayToHex(uint8Array)).toBe('0123456789abcdef')
    })
  })

  describe('uint8ArrayToHex', () => {
    it('应该正确转换字节数组为十六进制', () => {
      const uint8Array = new Uint8Array([0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef])
      const hex = uint8ArrayToHex(uint8Array)
      
      expect(hex).toBe('0123456789abcdef')
    })

    it('应该处理单字节值', () => {
      const testCases = [
        { bytes: [0x00], expected: '00' },
        { bytes: [0x0f], expected: '0f' },
        { bytes: [0xff], expected: 'ff' },
        { bytes: [0xa5], expected: 'a5' }
      ]

      for (const { bytes, expected } of testCases) {
        const uint8Array = new Uint8Array(bytes)
        const hex = uint8ArrayToHex(uint8Array)
        expect(hex).toBe(expected)
      }
    })
  })

  describe('generateRandomBytes', () => {
    it('应该生成指定长度的随机字节', () => {
      const lengths = [1, 8, 16, 32, 64]
      
      for (const length of lengths) {
        const bytes = generateRandomBytes(length)
        expect(bytes).toBeInstanceOf(Uint8Array)
        expect(bytes.length).toBe(length)
      }
    })

    it('应该生成不同的随机值', () => {
      const bytes1 = generateRandomBytes(16)
      const bytes2 = generateRandomBytes(16)
      
      // 16字节随机数相同的概率极低
      expect(uint8ArrayToHex(bytes1)).not.toBe(uint8ArrayToHex(bytes2))
    })

    it('应该处理零长度', () => {
      const bytes = generateRandomBytes(0)
      expect(bytes.length).toBe(0)
    })
  })
})
