// stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api'
import { type UserState, type UserInfo, type UserProfile } from '@/types/user'
import { encryptPassword, decryptPassword } from '@/utils/encryption'
import { STORAGE_KEYS } from '@/utils/storageKeys'

export const useUserStore = defineStore('user', () => {
  const userState = ref<UserState>({
    isLoggedIn: false,
    userInfo: null,
  })

  const userProfile = ref<UserProfile | null>(null)

  let isInitialized = false

  function restoreFromStorage() {
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
        userInfo: userInfo,
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

      //保存基本的用户信息
      const userInfo = {
        username: response.data.username,
        role: response.data.role || 'user',
        token: token,
      }

      localStorage.setItem(STORAGE_KEYS.TOKEN, token)
      localStorage.setItem(STORAGE_KEYS.TOKEN_ALT, token)
      localStorage.setItem(
        STORAGE_KEYS.USER_INFO,
        JSON.stringify({
          username: userInfo.username,
          role: userInfo.role,
        }),
      )

      if (rememberMe) {
        console.log('保存自动登录凭证...')
        const encryptedPwd = encryptPassword(password)
        if (encryptedPwd) {
          localStorage.setItem(STORAGE_KEYS.SAVED_USERNAME, username)
          localStorage.setItem(STORAGE_KEYS.SAVED_PASSWORD, encryptedPwd)
          localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true')
          console.log('凭证已保存')
        } else {
          console.error('❌密码加密失败')
        }
      } else {
        console.log('未选择记住我，清除已有凭证')
        clearAutoLoginCredentials()
      }

      userState.value = {
        isLoggedIn: true,
        userInfo: userInfo,
      }

      await fetchUserProfile()

      return { success: true }
    } catch (error: any) {
      console.error('登录失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 获取完整用户资料
  async function fetchUserProfile() {
    if (!userState.value.isLoggedIn) {
      return null
    }

    try {
      const response = await api.getUserProfile()
      if (response.code === 200) {
        userProfile.value = response.data
        return response.data
      }
    } catch (error) {
      console.error('获取用户资料失败:', error)
    }
    return null
  }

  // 获取完整资料（计算属性，方便在组件中使用）
  const fullUserInfo = computed(() => {
    if (!userProfile.value) return null
    return {
      ...userProfile.value,
      nickname: userProfile.value.username, // 兼容旧字段
    }
  })

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
    if (!currentUserInfo) return

    // 只处理非 token 字段
    const updatedUserInfo = {
      ...currentUserInfo,
      ...info,
    }

    userState.value.userInfo = updatedUserInfo

    // 只保存非 token 信息到 localStorage
    localStorage.setItem(
      STORAGE_KEYS.USER_INFO,
      JSON.stringify({
        username: updatedUserInfo.username,
        role: updatedUserInfo.role,
        // 不存 token
      }),
    )
  }

  function forceCheckLoginStatus(): boolean {
    const token =
      localStorage.getItem(STORAGE_KEYS.TOKEN) || localStorage.getItem(STORAGE_KEYS.TOKEN_ALT)
    return userState.value.isLoggedIn && !!token
  }

  return {
    userState,
    userProfile,
    fullUserInfo,
    login,
    register,
    logout,
    fetchUserProfile,
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
