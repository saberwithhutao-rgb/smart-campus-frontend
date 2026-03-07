// stores/user.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/api'
import type { UserState, UserInfo } from '@/types/user'
import { encryptPassword, decryptPassword } from '@/utils/encryption'
import { STORAGE_KEYS } from '@/utils/storageKeys'

export const useUserStore = defineStore('user', () => {
  const userState = ref<UserState>({
    isLoggedIn: false,
    userInfo: null,
  })

  // 【新增】初始化标记，防止重复恢复
  let isInitialized = false

  // 从 localStorage 恢复状态
  function restoreFromStorage() {
    // 【新增】如果已初始化，直接返回
    if (isInitialized) {
      return true
    }

    const token =
      localStorage.getItem(STORAGE_KEYS.TOKEN) || localStorage.getItem(STORAGE_KEYS.TOKEN_ALT)
    const userInfoStr = localStorage.getItem(STORAGE_KEYS.USER_INFO)

    console.log('恢复状态 - token:', !!token, 'userInfo:', !!userInfoStr)

    if (!token || !userInfoStr) {
      console.log('缺少 token 或 userInfo，清除状态')
      userState.value = { isLoggedIn: false, userInfo: null }
      isInitialized = true
      return false
    }

    try {
      const userInfo = JSON.parse(userInfoStr)
      userState.value = {
        isLoggedIn: true,
        userInfo: { ...userInfo, token },
      }
      isInitialized = true
      console.log('✅ 状态恢复成功')
      return true
    } catch (e) {
      console.error('恢复失败:', e)
      userState.value = { isLoggedIn: false, userInfo: null }
      isInitialized = true
      return false
    }
  }

  function logout(redirectToLogin: boolean = true) {
    console.log('执行退出登录...')

    userState.value = {
      isLoggedIn: false,
      userInfo: null,
    }

    clearStorage()

    if (redirectToLogin) {
      window.location.replace('/login')
    }
  }

  function logoutComplete(redirectToLogin: boolean = true) {
    console.log('执行完全退出登录...')

    userState.value = {
      isLoggedIn: false,
      userInfo: null,
    }

    clearStorage()
    clearAutoLoginCredentials()

    if (redirectToLogin) {
      window.location.replace('/login')
    }
  }

  function clearStorage() {
    const tokenKeys = [
      STORAGE_KEYS.TOKEN,
      STORAGE_KEYS.TOKEN_ALT,
      'refreshToken',
      STORAGE_KEYS.USER_INFO,
      'username',
      'userId',
      'sessionId',
      'lastLoginTime',
      'redirectAfterLogin',
      'system_greeting_shown',
      'system_greeting_shown_expires',
    ]

    tokenKeys.forEach((key) => {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    })

    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.trim().split('=')[0]
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
    })
  }

  /**
   * 保存自动登录凭证（记住我功能）
   */
  function saveAutoLoginCredentials(username: string, password: string): void {
    try {
      const encryptedPwd = encryptPassword(password)
      if (encryptedPwd) {
        localStorage.setItem(STORAGE_KEYS.SAVED_USERNAME, username)
        localStorage.setItem(STORAGE_KEYS.SAVED_PASSWORD, encryptedPwd)
        localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true')
        console.log('✅ 自动登录凭证已保存')
        console.log('保存的用户名:', username)
        console.log('保存的密码:', encryptedPwd.substring(0, 20) + '...')
      }
    } catch (error) {
      console.error('保存自动登录凭证失败:', error)
    }
  }

  /**
   * 获取保存的密码
   */
  function getSavedPassword(): string | null {
    const encrypted = localStorage.getItem(STORAGE_KEYS.SAVED_PASSWORD)
    if (!encrypted) return null
    return decryptPassword(encrypted)
  }

  /**
   * 获取保存的用户名
   */
  function getSavedUsername(): string | null {
    return localStorage.getItem(STORAGE_KEYS.SAVED_USERNAME)
  }

  /**
   * 是否启用了记住我
   */
  function isRememberMeEnabled(): boolean {
    return localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true'
  }

  /**
   * 是否有保存的自动登录凭证
   */
  function hasAutoLoginCredentials(): boolean {
    return !!(getSavedUsername() && localStorage.getItem(STORAGE_KEYS.SAVED_PASSWORD))
  }

  /**
   * 清除自动登录凭证
   */
  function clearAutoLoginCredentials(): void {
    localStorage.removeItem(STORAGE_KEYS.SAVED_USERNAME)
    localStorage.removeItem(STORAGE_KEYS.SAVED_PASSWORD)
    localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME)
    console.log('🧹 已清除自动登录凭证')
  }

  /**
   * 尝试自动登录（在应用启动时调用）
   */
  async function tryAutoLogin(): Promise<boolean> {
    console.log('========== 尝试自动登录 ==========')

    const rememberMe = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true'
    const username = localStorage.getItem(STORAGE_KEYS.SAVED_USERNAME)
    const encryptedPwd = localStorage.getItem(STORAGE_KEYS.SAVED_PASSWORD)

    console.log('记住我状态:', rememberMe)
    console.log('保存的用户名:', username)
    console.log('有保存密码:', !!encryptedPwd)

    if (!rememberMe || !username || !encryptedPwd) {
      console.log('❌ 没有完整的自动登录凭证')
      return false
    }

    try {
      console.log('解密密码...')
      const password = decryptPassword(encryptedPwd)
      if (!password) {
        console.log('❌ 密码解密失败')
        return false
      }
      console.log('✅ 密码解密成功')

      console.log('获取验证码...')
      const captchaRes = await api.getCaptcha()
      if (captchaRes.code !== 200) {
        console.log('❌ 获取验证码失败')
        return false
      }
      console.log('✅ 获取验证码成功')

      console.log('使用保存的凭证登录...')
      const result = await login(username, password, captchaRes.data, true)

      if (result.success) {
        console.log('✅ 自动登录成功')
        return true
      } else {
        console.log('❌ 自动登录失败:', result.error)
        clearAutoLoginCredentials()
        return false
      }
    } catch (error) {
      console.error('❌ 自动登录出错:', error)
      return false
    }
  }

  async function login(
    username: string,
    password: string,
    captcha: string,
    rememberMe: boolean = false,
  ) {
    try {
      console.log('调用登录 API...')
      const response = await api.login({ username, password, captcha })

      if (response.code !== 200) {
        return { success: false, error: response.message }
      }

      const token = response.data.token
      console.log('登录成功，token:', token ? '已获取' : '无')

      localStorage.setItem(STORAGE_KEYS.TOKEN, token)
      localStorage.setItem(STORAGE_KEYS.TOKEN_ALT, token)

      const userInfo = {
        username: response.data.username,
        role: response.data.role || 'user',
        userId: response.data.userId,
      }
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo))

      if (rememberMe) {
        console.log('保存自动登录凭证...')
        const encryptedPwd = encryptPassword(password)
        if (encryptedPwd) {
          localStorage.setItem(STORAGE_KEYS.SAVED_USERNAME, username)
          localStorage.setItem(STORAGE_KEYS.SAVED_PASSWORD, encryptedPwd)
          localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true')
          console.log('✅ 凭证已保存')
        } else {
          console.error('❌ 密码加密失败')
        }
      } else {
        console.log('未选择记住我，清除已有凭证')
        clearAutoLoginCredentials()
      }

      userState.value = {
        isLoggedIn: true,
        userInfo: { ...userInfo, token },
      }

      return { success: true }
    } catch (error: any) {
      console.error('登录失败:', error)
      return { success: false, error: error.message }
    }
  }

  async function register(data: {
    username: string
    password: string
    email: string
    verifyCode: string
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.register(data)

      if (response.code !== 200) {
        throw new Error(response.message || '注册失败')
      }

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '注册失败',
      }
    }
  }

  function setUserInfo(info: Partial<UserInfo>) {
    const currentUserInfo = userState.value.userInfo
    if (!currentUserInfo) {
      console.warn('setUserInfo: 无法更新，用户未登录')
      return
    }

    try {
      const { token: newToken, refreshToken: newRefreshToken, ...otherInfo } = info

      const updatedUserInfo: UserInfo = {
        ...currentUserInfo,
        ...otherInfo,
      }

      userState.value.userInfo = updatedUserInfo

      if (newToken !== undefined) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, newToken)
        updatedUserInfo.token = newToken
      }
      if (newRefreshToken !== undefined) {
        localStorage.setItem('refreshToken', newRefreshToken)
        updatedUserInfo.refreshToken = newRefreshToken
      }

      const { token: _token, refreshToken: _refreshToken, ...storageInfo } = updatedUserInfo
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(storageInfo))
    } catch (error) {
      console.error('更新用户信息失败:', error)
    }
  }

  function validateLoginStatus(): boolean {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    const userInfoStr = localStorage.getItem(STORAGE_KEYS.USER_INFO)

    if (!token || token === 'undefined' || token === 'null') {
      return false
    }

    if (!userInfoStr) {
      return false
    }

    try {
      JSON.parse(userInfoStr)
      return true
    } catch {
      return false
    }
  }

  // 【修改】简化 forceCheckLoginStatus，不再内部调用 restoreFromStorage
  function forceCheckLoginStatus(): boolean {
    return userState.value.isLoggedIn
  }

  // 【删除】删除底部的自动调用 restoreFromStorage()

  return {
    userState,
    login,
    register,
    logout,
    logoutComplete,
    setUserInfo,
    restoreFromStorage,
    clearStorage,
    forceCheckLoginStatus,
    tryAutoLogin,
    getSavedUsername,
    hasAutoLoginCredentials,
    isRememberMeEnabled,
    clearAutoLoginCredentials,
  }
})
