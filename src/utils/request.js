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

// HTTP状态码默认提示
const getHttpStatusMessage = (status) => {
  const statusMessages = {
    400: '请求参数错误',
    401: '未授权，请重新登录',
    403: '没有权限访问此资源',
    404: '请求的资源不存在',
    405: '请求方法不允许',
    408: '请求超时',
    409: '资源冲突',
    413: '请求体过大',
    422: '请求格式错误',
    429: '请求过于频繁，请稍后再试',
    500: '服务器开小差了，请稍后再试',
    502: '网关错误',
    503: '服务不可用',
    504: '网关超时',
  }
  return statusMessages[status] || `请求失败 (${status})`
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

    const res = response.data
    const config = response.config

    // ✅ 如果请求配置了 skipGlobalError，跳过全局错误处理
    if (config.skipGlobalError) {
      return res
    }

    // ✅ 统一处理业务状态码
    // 根据后端约定的成功状态码判断（200 或 0 都视为成功）
    if (res.code === 200 || res.code === 0) {
      return res
    } else {
      // ✅ 显示后端返回的具体错误信息
      const errorMessage = res.message || '操作失败'
      ElMessage.error(errorMessage)
      return Promise.reject(new Error(errorMessage))
    }
  },
  async (error) => {
    const originalRequest = error.config

    // 处理401未授权/Token过期（这部分保持不变）
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

    // ✅ 如果请求配置了 skipGlobalError，跳过全局错误处理
    if (originalRequest?.skipGlobalError) {
      return Promise.reject(error)
    }

    // 处理其他错误（HTTP错误）
    if (error.response) {
      console.error('响应错误:', error.response.status, error.response.data)

      // ✅ 优先显示后端返回的业务错误信息
      const errorMessage =
        error.response.data?.message || getHttpStatusMessage(error.response.status)

      // 显示错误信息
      ElMessage.error(errorMessage)
    } else if (error.request) {
      console.error('网络错误:', error.request)
      ElMessage.error('网络连接失败，请检查网络设置')
    } else {
      console.error('请求错误:', error.message)
      ElMessage.error(error.message || '请求失败，请稍后再试')
    }

    return Promise.reject(error)
  },
)

export default request
