// utils/encryption.ts
import CryptoJS from 'crypto-js'

const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY

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
