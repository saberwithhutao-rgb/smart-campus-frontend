import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/api'
import type { UserState, UserInfo } from '@/types/user'

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

export const useUserStore = defineStore('user', () => {
  const userState = ref<UserState>({
    isLoggedIn: false,
    userInfo: null,
  })

  // 从localStorage恢复状态
  function restoreFromStorage() {
    const token = localStorage.getItem('userToken')
    const userInfoStr = localStorage.getItem('userInfo')

    // 添加验证逻辑
    if (!token || !userInfoStr) {
      console.log('没有token或userInfo，不恢复登录状态')
      userState.value = {
        isLoggedIn: false,
        userInfo: null,
      }
      return
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
        return
      }

      userState.value = {
        isLoggedIn: true,
        userInfo: {
          token,
          refreshToken: localStorage.getItem('refreshToken') || undefined,
          ...userInfo,
        },
      }
      console.log('从存储恢复登录状态成功')
    } catch (e) {
      console.error('恢复用户状态失败:', e)
      clearStorage()
      userState.value = {
        isLoggedIn: false,
        userInfo: null,
      }
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
    ]

    tokenKeys.forEach((key) => {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key) // 同时清除sessionStorage
    })

    // 清除所有cookie（如果有）
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.trim().split('=')[0]
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
    })
  }

  async function login(
    username: string,
    password: string,
    captcha: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = (await api.login({
        username,
        password,
        captcha,
      })) as ProjectLoginResponse

      if (response.code !== 200) {
        throw new Error(response.message || '登录失败')
      }

      const data = response.data

      // 创建完整的userInfo对象
      const userInfo: UserInfo = {
        token: data.token,
        refreshToken: data.refreshToken || undefined,
        role: data.role || 'user',
        username: data.username,
        userId: 0,
        email: '',
        avatar: '',
        studentId: '',
        major: '',
        college: '',
      }

      // 更新状态
      userState.value = {
        isLoggedIn: true,
        userInfo,
      }

      // 保存到 localStorage
      localStorage.setItem('userToken', data.token)
      localStorage.setItem(
        'userInfo',
        JSON.stringify({
          role: data.role,
          username: data.username,
          userId: 0,
          email: '',
          avatar: '',
          studentId: '',
          major: '',
          college: '',
        }),
      )

      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken)
      }

      return { success: true }
    } catch (error: any) {
      console.error('登录错误:', error)
      return {
        success: false,
        error: error.message || '登录失败',
      }
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

  function logout(redirectToLogin: boolean = true) {
    console.log('执行退出登录...')

    localStorage.removeItem('redirectAfterLogin')

    // 0. 先获取当前路由信息（用于调试）
    const currentPath = window.location.pathname
    console.log('当前路径:', currentPath)

    // 1. 清除store状态（先于存储清除）
    userState.value = {
      isLoggedIn: false,
      userInfo: null,
    }

    // 2. 强制触发Pinia状态更新
    // 通过一个中间步骤确保状态被清除
    setTimeout(() => {
      userState.value = {
        isLoggedIn: false,
        userInfo: null,
      }
    }, 0)

    // 3. 清除所有存储 - 更彻底
    const storageKeys = Object.keys(localStorage)
    console.log('清除前的localStorage keys:', storageKeys)

    // 清除所有可能的用户相关键
    const userRelatedKeys = [
      'userToken',
      'token',
      'refreshToken',
      'userInfo',
      'username',
      'userId',
      'user',
      'auth',
      'session',
      'lastLogin',
      'loginTime',
      'auth_token',
      'access_token',
      'system_greeting_shown', // 清除问候提示状态
    ]

    // 清除所有匹配的键
    storageKeys.forEach((key) => {
      // 清除所有包含用户相关关键词的键
      const shouldRemove = userRelatedKeys.some((relatedKey) =>
        key.toLowerCase().includes(relatedKey.toLowerCase()),
      )

      if (shouldRemove) {
        localStorage.removeItem(key)
        console.log('已清除:', key)
      }
    })

    // 也清除sessionStorage
    const sessionKeys = Object.keys(sessionStorage)
    sessionKeys.forEach((key) => {
      sessionStorage.removeItem(key)
    })

    // 4. 清除所有cookie
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.trim().split('=')[0]
      // 清除当前域下的cookie
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
      // 清除不带域的cookie
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
    })

    // 5. 清除API的Authorization header
    try {
      // 优先使用 clearAuthHeader 方法清除认证头
      if (typeof api.clearAuthHeader === 'function') {
        api.clearAuthHeader()
      }
    } catch (error) {
      console.warn('清除Authorization header失败:', error)
    }

    console.log('退出登录完成，当前localStorage:', { ...localStorage })

    // 6. 跳转到登录页 - 使用更强制的方法
    if (redirectToLogin) {
      window.location.replace('/login')
    }
  }

  function setUserInfo(info: Partial<UserInfo>) {
    const currentUserInfo = userState.value.userInfo
    if (!currentUserInfo) {
      console.warn('setUserInfo: 无法更新，用户未登录')
      return
    }

    try {
      // 合并信息
      const updatedUserInfo: UserInfo = {
        ...currentUserInfo,
        ...info,
      }

      // 更新状态
      userState.value.userInfo = updatedUserInfo

      // 分离token和其他信息（使用不同的变量名）
      const { token: _token, refreshToken: _refreshToken, ...otherInfo } = updatedUserInfo
      // 更新localStorage
      localStorage.setItem('userInfo', JSON.stringify(otherInfo))

      // 单独处理token
      if (info.token !== undefined) {
        localStorage.setItem('userToken', info.token)
      }
      if (info.refreshToken !== undefined) {
        localStorage.setItem('refreshToken', info.refreshToken)
      }
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

  // 初始化时恢复状态
  restoreFromStorage()

  return {
    userState,
    login,
    register,
    logout,
    setUserInfo,
    validateLoginStatus, // 添加这个
    restoreFromStorage,
    clearStorage,
  }
})
