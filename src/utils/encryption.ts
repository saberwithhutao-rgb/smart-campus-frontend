// utils/encryption.ts
import CryptoJS from 'crypto-js'

// 简单的加密工具，避免循环依赖
const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'your-fallback-key-2024'

export const encryptPassword = (password: string): string | null => {
  try {
    return CryptoJS.AES.encrypt(password, SECRET_KEY).toString()
  } catch (error) {
    console.error('加密失败:', error)
    return null
  }
}

export const decryptPassword = (ciphertext: string): string | null => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY)
    return bytes.toString(CryptoJS.enc.Utf8)
  } catch (error) {
    console.error('解密失败:', error)
    return null
  }
}
