// stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api'
import { type UserState, type UserInfo, type UserProfile, type LoginData } from '@/types/user'
import { encryptPassword } from '@/utils/encryption'
import { STORAGE_KEYS } from '@/utils/storageKeys'
import { autoLogin } from '@/utils/autoLogin'

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

    // ✅ 清除 refresh token
    localStorage.removeItem('refresh_token')
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

    localStorage.removeItem('refresh_token')
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
      'refresh_token', // refresh token 的 key
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
   * 刷新 access token
   */
  async function refreshAccessToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      console.log('⚠️ 没有 refresh token')
      return false
    }

    try {
      console.log('🔄 尝试刷新 token...')
      const response = (await api.refreshToken({ refreshToken })) as unknown as { token: string }

      if (response.token) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, response.token)
        localStorage.setItem(STORAGE_KEYS.TOKEN_ALT, response.token)
        console.log('✅ Token 刷新成功')
        return true
      }
      return false
    } catch (error) {
      console.error('刷新 token 失败:', error)
      return false
    }
  }

  /**
   * ✅ 自动登录（使用 remember_me 凭证，首次启动时调用）
   * 这是用保存的密码登录，会走正常的登录接口
   */
  async function autoLoginWithCredentials(
    username: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 使用保存的凭证登录...')
      const response = (await api.loginWithCredentials({
        username,
        password,
      })) as unknown as LoginData

      if (response.token) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, response.token)
        localStorage.setItem(STORAGE_KEYS.TOKEN_ALT, response.token)

        if (response.refreshToken) {
          localStorage.setItem('refresh_token', response.refreshToken)
        }

        // 保存用户信息
        const userInfo = {
          username: response.username,
          role: response.role || 'user',
        }
        localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo))

        userState.value = {
          isLoggedIn: true,
          userInfo: userInfo,
        }

        await fetchUserProfile()

        console.log('✅ 自动登录成功')
        return { success: true }
      }

      return { success: false, error: '自动登录失败' }
    } catch (error: unknown) {
      console.error('❌ 自动登录失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message || '自动登录失败' : '自动登录失败',
      }
    }
  }

  /**
   * ✅ 尝试自动登录（在应用启动时调用）
   * 优先使用 refresh token，如果失败则使用保存的密码
   */
  async function tryAutoLogin(): Promise<boolean> {
    console.log('========== 尝试自动登录 ==========')
    const currentPath = window.location.pathname
    if (currentPath === '/login' || currentPath === '/register') {
      console.log('⏭️ 当前在登录/注册页面，跳过自动登录')
      return false
    }

    // 检查是否有保存的凭证
    if (!autoLogin.isRememberMe() || !autoLogin.hasSavedCredentials()) {
      console.log('⛔ 未启用记住我或无保存凭证，跳过自动登录')
      return false
    }

    const username = autoLogin.getSavedUsername()
    const password = autoLogin.getSavedPassword()

    if (!username || !password) {
      console.log('⚠️ 凭证不完整，清除保存的数据')
      autoLogin.clearCredentials()
      return false
    }

    try {
      console.log('🔄 尝试自动登录...')

      // 调用自动登录接口（不需要验证码）
      const response = (await api.loginWithCredentials({
        username,
        password,
      })) as unknown as LoginData

      if (response.token) {
        // 保存 token
        localStorage.setItem(STORAGE_KEYS.TOKEN, response.token)
        localStorage.setItem(STORAGE_KEYS.TOKEN_ALT, response.token)

        // 保存 refresh token
        if (response.refreshToken) {
          localStorage.setItem('refresh_token', response.refreshToken)
        }

        // 保存用户信息
        const userInfo = {
          username: response.username,
          role: response.role || 'user',
        }
        localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo))

        userState.value = {
          isLoggedIn: true,
          userInfo: userInfo,
        }

        await fetchUserProfile()

        console.log('✅ 自动登录成功')
        return true
      }

      console.log('❌ 自动登录失败')
      return false
    } catch (error: any) {
      console.error('自动登录失败:', error)
      // 密码错误，清除保存的凭证
      if (error.response?.status === 401) {
        autoLogin.clearCredentials()
      }
      return false
    }
  }

  async function login(
    username: string,
    password: string,
    captcha: string,
    captchaId: string,
    rememberMe: boolean = false,
  ) {
    try {
      console.log('调用登录 API...')
      const response = (await api.login({
        username,
        password,
        captcha,
        captchaId,
      })) as unknown as LoginData

      if (!response) {
        return { success: false, error: response }
      }

      const token = response.token
      const refreshToken = response.refreshToken
      console.log('登录成功，token:', token ? '已获取' : '无')

      // 保存 token
      localStorage.setItem(STORAGE_KEYS.TOKEN, token)
      localStorage.setItem(STORAGE_KEYS.TOKEN_ALT, token)

      // ✅ 保存 refresh token
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken)
      }

      // 保存用户信息
      const userInfo = {
        username: response.username,
        role: response.role || 'user',
      }
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo))

      // 如果记住我，保存密码凭证
      if (rememberMe) {
        console.log('保存自动登录凭证...')
        const encryptedPwd = encryptPassword(password)
        if (encryptedPwd) {
          localStorage.setItem(STORAGE_KEYS.SAVED_USERNAME, username)
          localStorage.setItem(STORAGE_KEYS.SAVED_PASSWORD, encryptedPwd)
          localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true')
          console.log('凭证已保存')
        }
      } else {
        clearAutoLoginCredentials()
      }

      userState.value = {
        isLoggedIn: true,
        userInfo: userInfo,
      }

      await fetchUserProfile()

      return { success: true }
    } catch (error: unknown) {
      console.error('登录失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message || '登录失败' : '登录失败',
      }
    }
  }

  // 获取完整用户资料
  async function fetchUserProfile() {
    if (!userState.value.isLoggedIn) {
      return null
    }

    try {
      const response = (await api.getUserProfile()) as unknown as UserProfile
      if (response) {
        userProfile.value = response
        return response
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

      if (!response) {
        throw new Error('注册失败')
      }

      return { success: true }
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message || '注册失败' : '注册失败',
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
    refreshAccessToken,
    autoLoginWithCredentials,
    getSavedUsername,
    hasAutoLoginCredentials,
    isRememberMeEnabled,
    clearAutoLoginCredentials,
  }
})
