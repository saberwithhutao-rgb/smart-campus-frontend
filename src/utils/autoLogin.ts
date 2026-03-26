// utils/autoLogin.ts - 简化版，只做凭证管理
import { encryptPassword, decryptPassword } from './encryption'
import { STORAGE_KEYS } from './storageKeys'

class AutoLoginService {
  /**
   * 保存登录凭证（记住我时调用）
   */
  saveCredentials(username: string, password: string): void {
    try {
      const encryptedPwd = encryptPassword(password)
      if (encryptedPwd) {
        localStorage.setItem(STORAGE_KEYS.SAVED_USERNAME, username)
        localStorage.setItem(STORAGE_KEYS.SAVED_PASSWORD, encryptedPwd)
        localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true')
        console.log('✓ 登录凭证已保存，下次将自动登录')
      }
    } catch (error) {
      console.error('保存凭证失败', error)
    }
  }

  /**
   * 获取保存的密码
   */
  getSavedPassword(): string | null {
    const encrypted = localStorage.getItem(STORAGE_KEYS.SAVED_PASSWORD)
    if (!encrypted) return null
    return decryptPassword(encrypted)
  }

  /**
   * 获取保存的用户名
   */
  getSavedUsername(): string | null {
    return localStorage.getItem(STORAGE_KEYS.SAVED_USERNAME)
  }

  /**
   * 是否启用了记住我
   */
  isRememberMe(): boolean {
    return localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true'
  }

  /**
   * 是否有保存的凭证
   */
  hasSavedCredentials(): boolean {
    return !!(this.getSavedUsername() && localStorage.getItem(STORAGE_KEYS.SAVED_PASSWORD))
  }

  /**
   * 清除保存的凭证
   */
  clearCredentials(): void {
    localStorage.removeItem(STORAGE_KEYS.SAVED_USERNAME)
    localStorage.removeItem(STORAGE_KEYS.SAVED_PASSWORD)
    localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME)
    console.log('🧹 已清除保存的登录凭证')
  }

  /**
   * 登出（不清除凭证，只清除token）
   */
  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.TOKEN_ALT)
    localStorage.removeItem(STORAGE_KEYS.USER_INFO)
    localStorage.removeItem('refresh_token')
  }

  /**
   * 完全登出（清除所有信息）
   */
  logoutComplete(): void {
    this.logout()
    this.clearCredentials()
  }
}

export const autoLogin = new AutoLoginService()
