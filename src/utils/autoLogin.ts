// utils/autoLogin.ts
import { encryptPassword, decryptPassword } from './encryption'
import { api } from '../api/index'
import { useUserStore } from '../stores/user'
import { STORAGE_KEYS } from './storageKeys' // 导入统一的键名

class AutoLoginService {
  /**
   * 保存登录凭证（记住我时调用）
   */
  saveCredentials(username: string, password: string): void {
    try {
      // 修复：使用 encryptPassword 而不是 encryption.encrypt
      const encryptedPwd = encryptPassword(password)
      if (encryptedPwd) {
        // 修复：使用统一的 STORAGE_KEYS
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
    // 修复：使用 STORAGE_KEYS
    const encrypted = localStorage.getItem(STORAGE_KEYS.SAVED_PASSWORD)
    if (!encrypted) return null
    // 修复：使用 decryptPassword
    return decryptPassword(encrypted)
  }

  /**
   * 获取保存的用户名
   */
  getSavedUsername(): string | null {
    // 修复：使用 STORAGE_KEYS
    return localStorage.getItem(STORAGE_KEYS.SAVED_USERNAME)
  }

  /**
   * 是否启用了记住我
   */
  isRememberMe(): boolean {
    // 修复：使用 STORAGE_KEYS
    return localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true'
  }

  /**
   * 是否有保存的凭证
   */
  hasSavedCredentials(): boolean {
    return !!(this.getSavedUsername() && localStorage.getItem(STORAGE_KEYS.SAVED_PASSWORD))
  }

  /**
   * 尝试自动登录（在应用启动时调用）
   */
  async tryAutoLogin(): Promise<boolean> {
    // 如果没有保存凭证或未启用记住我，不自动登录
    if (!this.isRememberMe() || !this.hasSavedCredentials()) {
      console.log('⛔ 未启用记住我或无保存凭证，跳过自动登录')
      return false
    }

    const username = this.getSavedUsername()
    const password = this.getSavedPassword()

    if (!username || !password) {
      console.log('⚠️ 凭证不完整，清除保存的数据')
      this.clearCredentials()
      return false
    }

    try {
      console.log('🔄 尝试自动登录...')

      // 1. 先获取验证码
      const captchaResponse = await api.getCaptcha()

      if (captchaResponse.code !== 200) {
        console.log('❌ 获取验证码失败，无法自动登录')
        return false
      }

      // 2. 使用保存的凭证登录
      const userStore = useUserStore()
      const result = await userStore.login(
        username,
        password,
        captchaResponse.data,
        true, // 保持记住我状态
      )

      if (result.success) {
        console.log('✅ 自动登录成功！')
        return true
      } else {
        console.log('❌ 自动登录失败:', result.error)

        // 如果是因为密码错误，清除保存的凭证
        if (result.error?.includes('密码') || result.error?.includes('用户名')) {
          console.log('⚠️ 用户名或密码错误，清除保存的凭证')
          this.clearCredentials()
        }
        return false
      }
    } catch (error) {
      console.error('❌ 自动登录过程出错:', error)
      return false
    }
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
  }

  /**
   * 完全登出（清除所有信息）
   */
  logoutComplete(): void {
    this.logout()
    this.clearCredentials()
  }
}

// 导出单例
export const autoLogin = new AutoLoginService()
