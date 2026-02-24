// stores/user.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/api'
import type { UserState, UserInfo } from '@/types/user'
import { encryption } from '@/utils/encryption'

// 定义LoginResponse类型，匹配项目文档
interface ProjectLoginResponse {
  code: number
  message: string
  data: {
    token: string
    role: string
    username: string
    refreshToken?: string
  }
}

// 自动登录相关的存储键
const AUTO_LOGIN_KEYS = {
  USERNAME: 'auto_login_username',
  PASSWORD: 'auto_login_password',
  REMEMBER_ME: 'remember_me',
}

export const useUserStore = defineStore('user', () => {
  const userState = ref<UserState>({
    isLoggedIn: false,
    userInfo: null,
  })

  // 从localStorage恢复状态
  function restoreFromStorage() {
    const token = localStorage.getItem('userToken')
    const userInfoStr = localStorage.getItem('userInfo')

    if (!token || !userInfoStr) {
      console.log('没有token或userInfo，不恢复登录状态')
      userState.value = {
        isLoggedIn: false,
        userInfo: null,
      }
      return false
    }

    try {
      const userInfo = JSON.parse(userInfoStr)

      // 验证token有效性
      if (
        typeof token !== 'string' ||
        token.trim() === '' ||
        token === 'undefined' ||
        token === 'null'
      ) {
        console.warn('无效的token，清除存储')
        clearStorage()
        userState.value = {
          isLoggedIn: false,
          userInfo: null,
        }
        return false
      }

      if (!userInfo.username || !userInfo.role) {
        console.warn('用户信息不完整，清除存储')
        clearStorage()
        userState.value = {
          isLoggedIn: false,
          userInfo: null,
        }
        return false
      }

      // 🔴 重要：从 token 中重新解析 userId
      let userIdFromToken = 0
      if (token && token.startsWith('jwt-')) {
        const parts = token.split('-')
        if (parts.length >= 2 && parts[1] !== undefined && !isNaN(Number(parts[1]))) {
          userIdFromToken = parseInt(parts[1], 10)
          console.log('恢复时从 token 解析出 userId:', userIdFromToken)
        }
      }

      if (userIdFromToken > 0 && userInfo.userId !== userIdFromToken) {
        userInfo.userId = userIdFromToken

        // 更新 localStorage
        localStorage.setItem('userInfo', JSON.stringify(userInfo))
      }

      const restoredState = {
        isLoggedIn: true,
        userInfo: {
          token,
          refreshToken: localStorage.getItem('refreshToken') || undefined,
          ...userInfo,
        },
      }

      userState.value = restoredState
      return true
    } catch (e) {
      console.error('恢复用户状态失败:', e)
      clearStorage()
      userState.value = {
        isLoggedIn: false,
        userInfo: null,
      }
      return false
    }
  }

  function logout(redirectToLogin: boolean = true) {
    console.log('执行退出登录...')

    // 1. 清除store状态
    userState.value = {
      isLoggedIn: false,
      userInfo: null,
    }

    // 2. 清除所有存储（但保留自动登录凭证，因为用户可能想保持记住我）
    clearStorage()

    console.log('退出登录完成')

    // 3. 只有在指定时才跳转
    if (redirectToLogin) {
      window.location.replace('/login')
    }
  }

  /**
   * 完全登出（清除所有信息，包括自动登录凭证）
   */
  function logoutComplete(redirectToLogin: boolean = true) {
    console.log('执行完全退出登录...')

    // 清除store状态
    userState.value = {
      isLoggedIn: false,
      userInfo: null,
    }

    // 清除所有存储，包括自动登录凭证
    clearStorage()
    clearAutoLoginCredentials()

    if (redirectToLogin) {
      window.location.replace('/login')
    }
  }

  function clearStorage() {
    // 清除所有可能的token相关存储
    const tokenKeys = [
      'userToken',
      'token',
      'refreshToken',
      'userInfo',
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

    // 清除所有cookie
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
      const encryptedPwd = encryption.encrypt(password)
      if (encryptedPwd) {
        localStorage.setItem(AUTO_LOGIN_KEYS.USERNAME, username)
        localStorage.setItem(AUTO_LOGIN_KEYS.PASSWORD, encryptedPwd)
        localStorage.setItem(AUTO_LOGIN_KEYS.REMEMBER_ME, 'true')
        console.log('✅ 自动登录凭证已保存')
      }
    } catch (error) {
      console.error('保存自动登录凭证失败:', error)
    }
  }

  /**
   * 获取保存的密码
   */
  function getSavedPassword(): string | null {
    const encrypted = localStorage.getItem(AUTO_LOGIN_KEYS.PASSWORD)
    if (!encrypted) return null
    return encryption.decrypt(encrypted)
  }

  /**
   * 获取保存的用户名
   */
  function getSavedUsername(): string | null {
    return localStorage.getItem(AUTO_LOGIN_KEYS.USERNAME)
  }

  /**
   * 是否启用了记住我
   */
  function isRememberMeEnabled(): boolean {
    return localStorage.getItem(AUTO_LOGIN_KEYS.REMEMBER_ME) === 'true'
  }

  /**
   * 是否有保存的自动登录凭证
   */
  function hasAutoLoginCredentials(): boolean {
    return !!(getSavedUsername() && localStorage.getItem(AUTO_LOGIN_KEYS.PASSWORD))
  }

  /**
   * 清除自动登录凭证
   */
  function clearAutoLoginCredentials(): void {
    localStorage.removeItem(AUTO_LOGIN_KEYS.USERNAME)
    localStorage.removeItem(AUTO_LOGIN_KEYS.PASSWORD)
    localStorage.removeItem(AUTO_LOGIN_KEYS.REMEMBER_ME)
    console.log('🧹 已清除自动登录凭证')
  }

  /**
   * 尝试自动登录（在应用启动时调用）
   */
  async function tryAutoLogin(): Promise<boolean> {
    // 如果已经有token且有效，不需要自动登录
    if (userState.value.isLoggedIn) {
      return true
    }

    // 如果没有启用记住我或无凭证，不自动登录
    if (!isRememberMeEnabled() || !hasAutoLoginCredentials()) {
      console.log('⛔ 未启用记住我或无保存凭证，跳过自动登录')
      return false
    }

    const username = getSavedUsername()
    const password = getSavedPassword()

    if (!username || !password) {
      console.log('⚠️ 凭证不完整，清除保存的数据')
      clearAutoLoginCredentials()
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
      const result = await login(
        username,
        password,
        captchaResponse.data,
        true, // 记住我保持启用
      )

      if (result.success) {
        console.log('✅ 自动登录成功！')
        return true
      } else {
        console.log('❌ 自动登录失败:', result.error)

        // 如果是因为密码错误，清除保存的凭证
        if (result.error?.includes('密码') || result.error?.includes('用户名')) {
          console.log('⚠️ 用户名或密码错误，清除保存的凭证')
          clearAutoLoginCredentials()
        }
        return false
      }
    } catch (error) {
      console.error('❌ 自动登录过程出错:', error)
      return false
    }
  }

  async function login(
    username: string,
    password: string,
    captcha: string,
    rememberMe: boolean = false,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.login({ username, password, captcha })

      if (response.code !== 200) {
        throw new Error(response.message || '登录失败')
      }

      const data = response.data
      const token = data.token

      let userId = 0
      if (token && token.startsWith('jwt-')) {
        const parts = token.split('-')
        if (parts.length >= 2 && parts[1] !== undefined && !isNaN(Number(parts[1]))) {
          userId = parseInt(parts[1], 10)
          console.log('从 token 解析出 userId:', userId)
        } else {
          console.warn('Token 格式不符合预期，无法解析 userId')
        }
      }

      // 创建完整的 userInfo 对象
      const userInfo = {
        token: token,
        role: data.role || 'user',
        username: data.username,
        userId: userId,
        email: data.email || '',
        avatar: data.avatar || '',
        studentId: data.studentId || '',
        major: data.major || '',
        college: data.college || '',
      }

      // 保存到 localStorage
      localStorage.setItem('userToken', token)
      localStorage.setItem('userInfo', JSON.stringify(userInfo))

      // 如果有refreshToken，也保存
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken)
      }

      // 如果选择了"记住我"，保存凭证用于自动登录
      if (rememberMe) {
        saveAutoLoginCredentials(username, password)
      } else {
        // 如果没有选择记住我，清除之前保存的凭证
        clearAutoLoginCredentials()
      }

      // 更新状态
      userState.value = {
        isLoggedIn: true,
        userInfo: {
          token,
          refreshToken: data.refreshToken,
          ...userInfo,
        },
      }

      console.log('保存的用户信息:', userInfo)
      return { success: true }
    } catch (error) {
      console.error('登录错误:', error)
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
      // 分离 token 和 refreshToken，避免重复定义
      const { token: newToken, refreshToken: newRefreshToken, ...otherInfo } = info

      // 合并其他信息
      const updatedUserInfo: UserInfo = {
        ...currentUserInfo,
        ...otherInfo,
      }

      // 更新状态
      userState.value.userInfo = updatedUserInfo

      // 单独处理 token 和 refreshToken
      if (newToken !== undefined) {
        localStorage.setItem('userToken', newToken)
        updatedUserInfo.token = newToken
      }
      if (newRefreshToken !== undefined) {
        localStorage.setItem('refreshToken', newRefreshToken)
        updatedUserInfo.refreshToken = newRefreshToken
      }

      // 更新 localStorage（排除 token 和 refreshToken）
      const { token: _token, refreshToken: _refreshToken, ...storageInfo } = updatedUserInfo
      localStorage.setItem('userInfo', JSON.stringify(storageInfo))
    } catch (error) {
      console.error('更新用户信息失败:', error)
    }
  }

  // 验证登录状态
  function validateLoginStatus(): boolean {
    const token = localStorage.getItem('userToken')
    const userInfoStr = localStorage.getItem('userInfo')

    // 检查token是否存在且有效
    if (!token || token === 'undefined' || token === 'null') {
      console.log('validateLoginStatus: 无效的token')
      return false
    }

    // 检查userInfo是否存在
    if (!userInfoStr) {
      console.log('validateLoginStatus: 缺少userInfo')
      return false
    }

    try {
      JSON.parse(userInfoStr)
      return true
    } catch {
      console.log('validateLoginStatus: userInfo解析失败')
      return false
    }
  }

  function forceCheckLoginStatus(): boolean {
    const token = localStorage.getItem('userToken')
    const hasToken = !!token && token !== 'undefined' && token !== 'null'

    console.log('强制检查登录状态:', {
      token,
      hasToken,
      storeIsLoggedIn: userState.value.isLoggedIn,
    })

    if (!hasToken && userState.value.isLoggedIn) {
      console.log('检测到状态不一致: store显示已登录但无token，修正状态')
      userState.value = {
        isLoggedIn: false,
        userInfo: null,
      }
      return false
    }

    if (hasToken && !userState.value.isLoggedIn) {
      console.log('检测到状态不一致: 有token但store显示未登录，尝试恢复')
      return restoreFromStorage()
    }

    return userState.value.isLoggedIn
  }

  // 初始化时恢复状态
  restoreFromStorage()

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
    // 自动登录相关
    tryAutoLogin,
    getSavedUsername,
    hasAutoLoginCredentials,
    isRememberMeEnabled,
    clearAutoLoginCredentials,
  }
})
