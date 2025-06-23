import CryptoJS from 'crypto-js'

/**
 * 从密码字符串派生 AES 密钥
 * 与 ESP32 端的 hashlib.sha256(password.encode('utf-8')).digest() 保持一致
 * @param password 密码字符串
 * @returns WordArray 格式的 32 字节密钥
 */
export function deriveKey(password: string): CryptoJS.lib.WordArray {
  return CryptoJS.SHA256(password)
}

/**
 * 使用 AES-ECB 模式加密挑战数据
 * 与 ESP32 端的 cryptolib.aes(key, 1) + PKCS7 填充保持一致
 * @param challenge 8字节挑战数据
 * @param key 32字节 AES 密钥
 * @returns 加密后的密文 WordArray
 */
export function encryptChallenge(
  challenge: CryptoJS.lib.WordArray,
  key: CryptoJS.lib.WordArray,
): CryptoJS.lib.WordArray {
  const encrypted = CryptoJS.AES.encrypt(challenge, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  })

  return encrypted.ciphertext
}

/**
 * 使用 AES-ECB 模式解密数据（主要用于测试验证）
 * @param ciphertext 加密的数据
 * @param key 32字节 AES 密钥
 * @returns 解密后的原始数据
 */
export function decryptData(
  ciphertext: CryptoJS.lib.WordArray,
  key: CryptoJS.lib.WordArray,
): CryptoJS.lib.WordArray {
  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext } as CryptoJS.lib.CipherParams,
    key,
    {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    },
  )

  return decrypted
}

/**
 * 将字符串转换为 WordArray
 * @param str 输入字符串
 * @returns WordArray
 */
export function stringToWordArray(str: string): CryptoJS.lib.WordArray {
  return CryptoJS.enc.Utf8.parse(str)
}

/**
 * 将 WordArray 转换为十六进制字符串
 * @param wordArray WordArray
 * @returns 十六进制字符串
 */
export function wordArrayToHex(wordArray: CryptoJS.lib.WordArray): string {
  return CryptoJS.enc.Hex.stringify(wordArray)
}

/**
 * 将十六进制字符串转换为 WordArray
 * @param hex 十六进制字符串
 * @returns WordArray
 */
export function hexToWordArray(hex: string): CryptoJS.lib.WordArray {
  return CryptoJS.enc.Hex.parse(hex)
}
