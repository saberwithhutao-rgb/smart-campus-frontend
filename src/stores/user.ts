import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/api'
import type { UserState, LoginResponse } from '@/types/user'

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
    captchaId?: string,
  ): Promise<any> {
    try {
      const response = (await api.login({
        username,
        password,
        captcha,
        captchaId,
      })) as LoginResponse

      if (response.code !== 200) {
        throw new Error(response.message || '登录失败')
      }

      const data = response.data
      const userInfo = data.user

      // 更新状态
      userState.value = {
        isLoggedIn: true,
        userInfo: {
          token: data.token,
          refreshToken: data.refreshToken,
          role: userInfo.role || 'user',
          username: userInfo.username,
          userId: userInfo.id,
          email: userInfo.email,
          avatar: userInfo.avatar || userInfo.avatarUrl,
          studentId: userInfo.studentId,
          major: userInfo.major,
          college: userInfo.college,
        },
      }

      // 保存到 localStorage
      localStorage.setItem('userToken', data.token)
      localStorage.setItem(
        'userInfo',
        JSON.stringify({
          role: userInfo.role,
          username: userInfo.username,
          userId: userInfo.id,
          email: userInfo.email,
          avatar: userInfo.avatar,
          studentId: userInfo.studentId,
          major: userInfo.major,
          college: userInfo.college,
        }),
      )

      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken)
      }

      return { success: true, data: response.data }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '登录失败',
      }
    }
  }

  async function register(data: any): Promise<any> {
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

  function setUserInfo(info: Partial<UserState['userInfo']>) {
    if (userState.value.userInfo) {
      userState.value.userInfo = {
        ...userState.value.userInfo,
        ...info,
      }

      // 更新 localStorage
      localStorage.setItem(
        'userInfo',
        JSON.stringify({
          role: userState.value.userInfo.role,
          username: userState.value.userInfo.username,
          userId: userState.value.userInfo.userId,
          email: userState.value.userInfo.email,
          avatar: userState.value.userInfo.avatar,
          studentId: userState.value.userInfo.studentId,
          major: userState.value.userInfo.major,
          college: userState.value.userInfo.college,
        }),
      )
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
