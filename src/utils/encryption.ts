// utils/encryption.ts
import CryptoJS from 'crypto-js'

// 从环境变量获取密钥
const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'luoshdkknwbsasdsasw'

export const encryption = {
  // 加密密码
  encrypt(password: string): string | null {
    try {
      // 添加时间戳和随机数，使每次加密结果不同
      const data = {
        p: password,
        t: Date.now(),
        r: Math.random().toString(36).substring(7),
      }

      // AES加密
      return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString()
    } catch (error) {
      console.error('加密失败', error)
      return null
    }
  },

  // 解密密码
  decrypt(ciphertext: string): string | null {
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY)
      const decrypted = bytes.toString(CryptoJS.enc.Utf8)

      if (!decrypted) return null

      const data = JSON.parse(decrypted)
      return data.p
    } catch (error) {
      console.error('解密失败', error)
      return null
    }
  },
}
