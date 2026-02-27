// utils/request.js
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { autoLogin } from './autoLogin'
import { useUserStore } from '../stores/user'

// 创建axios实例
const request = axios.create({
  baseURL: '',
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
})

// 请求队列，防止多个请求同时自动登录
let isAutoLogging = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: Date.now() }
    const token = localStorage.getItem('userToken') || localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    console.log('[API Request]', {
      url: config.url,
      method: config.method,
      hasToken: !!token,
    })

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    console.log('请求耗时:', Date.now() - response.config.metadata.startTime, 'ms')
    return response.data
  },
  async (error) => {
    const originalRequest = error.config

    // 处理401未授权/Token过期
    if (error.response?.status === 401 && !originalRequest._retry) {
      // 如果已经在自动登录，将请求加入队列
      if (isAutoLogging) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`
            return request(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isAutoLogging = true

      try {
        console.log('🔄 Token过期，尝试自动登录...')

        // 尝试自动登录
        const autoLoginSuccess = await autoLogin.tryAutoLogin()

        if (autoLoginSuccess) {
          console.log('✅ 自动登录成功，重试请求')
          const newToken = localStorage.getItem('userToken') || localStorage.getItem('token')

          // 处理队列中的请求
          processQueue(null, newToken)

          // 重试原请求
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`
          return request(originalRequest)
        } else {
          console.log('❌ 自动登录失败')
          processQueue(new Error('自动登录失败'), null)

          // 清除用户状态
          const userStore = useUserStore()
          userStore.clearUser()

          // 跳转到登录页（带重定向参数）
          const currentPath = encodeURIComponent(window.location.pathname + window.location.search)
          window.location.href = `/login?redirect=${currentPath}`
        }
      } catch (autoLoginError) {
        console.error('自动登录过程出错:', autoLoginError)
        processQueue(autoLoginError, null)
      } finally {
        isAutoLogging = false
      }
    }

    // 处理其他错误
    if (error.response) {
      console.error('响应错误:', error.response.status, error.response.data)

      if (error.response.status === 403) {
        ElMessage.error('没有权限访问此资源')
      } else if (error.response.status === 404) {
        ElMessage.error('请求的资源不存在')
      } else if (error.response.status === 500) {
        ElMessage.error('服务器开小差了，请稍后再试')
      } else {
        ElMessage.error(error.response.data?.message || '请求失败')
      }
    } else if (error.request) {
      console.error('网络错误:', error.request)
      ElMessage.error('网络连接失败，请检查网络设置')
    } else {
      console.error('请求错误:', error.message)
      ElMessage.error('请求失败，请稍后再试')
    }

    return Promise.reject(error)
  },
)

export default request
