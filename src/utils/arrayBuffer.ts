import type CryptoJS from 'crypto-js'

/**
 * 将 WordArray 转换为 Uint8Array
 * @param wordArray CryptoJS WordArray
 * @returns Uint8Array
 */
export function wordArrayToUint8Array(wordArray: CryptoJS.lib.WordArray): Uint8Array {
  const words = wordArray.words
  const sigBytes = wordArray.sigBytes
  const bytes = new Uint8Array(sigBytes)
  
  for (let i = 0; i < sigBytes; i++) {
    const wordIndex = Math.floor(i / 4)
    const byteIndex = i % 4
    bytes[i] = (words[wordIndex] >>> (24 - byteIndex * 8)) & 0xff
  }
  
  return bytes
}

/**
 * 将 Uint8Array 转换为 WordArray
 * @param uint8Array Uint8Array
 * @returns CryptoJS WordArray
 */
export function uint8ArrayToWordArray(uint8Array: Uint8Array): CryptoJS.lib.WordArray {
  const words: number[] = []
  const len = uint8Array.length
  
  for (let i = 0; i < len; i += 4) {
    let word = 0
    for (let j = 0; j < 4 && i + j < len; j++) {
      word |= uint8Array[i + j] << (24 - j * 8)
    }
    words.push(word)
  }
  
  return {
    words,
    sigBytes: len
  } as CryptoJS.lib.WordArray
}

/**
 * 将十六进制字符串转换为 Uint8Array
 * @param hex 十六进制字符串
 * @returns Uint8Array
 */
export function hexToUint8Array(hex: string): Uint8Array {
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '')
  const bytes = new Uint8Array(cleanHex.length / 2)
  
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(cleanHex.substr(i * 2, 2), 16)
  }
  
  return bytes
}

/**
 * 将 Uint8Array 转换为十六进制字符串
 * @param bytes Uint8Array
 * @returns 十六进制字符串
 */
export function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * 生成指定长度的随机字节数组
 * @param length 字节长度
 * @returns Uint8Array
 */
export function generateRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return bytes
}
