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

    if (token && userInfoStr) {
      try {
        const userInfo = JSON.parse(userInfoStr)
        userState.value = {
          isLoggedIn: true,
          userInfo: {
            token,
            refreshToken: localStorage.getItem('refreshToken') || undefined,
            ...userInfo,
          },
        }
      } catch (e) {
        console.error('恢复用户状态失败:', e)
        clearStorage()
      }
    }
  }

  function clearStorage() {
    localStorage.removeItem('userToken')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('refreshToken')
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

  function logout() {
    userState.value = {
      isLoggedIn: false,
      userInfo: null,
    }
    clearStorage()
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
      const { token: _newToken, refreshToken: _newRefreshToken, ...otherInfo } = updatedUserInfo

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

  // 初始化时恢复状态
  restoreFromStorage()

  return {
    userState,
    login,
    register,
    logout,
    setUserInfo,
  }
})
