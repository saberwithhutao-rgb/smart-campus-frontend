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
    const duration = Date.now() - response.config.metadata.startTime
    console.log(`请求耗时: ${duration} ms - ${response.config.url}`)

    const res = response.data
    const config = response.config

    // 如果请求配置了 skipGlobalError，跳过全局错误处理
    if (config.skipGlobalError) {
      return res
    }

    // 统一处理业务状态码
    if (res.code === 200 || res.code === 0 || res.success === true) {
      // 关键修改：直接返回 res.data
      console.log(`[API Success] ${config.url}:`, res.data || res)
      return res.data ?? res
    } else {
      const errorMessage = res.message || '操作失败'
      console.error(`[API Error] ${config.url}:`, errorMessage, res)
      ElMessage.error(errorMessage)
      return Promise.reject(new Error(errorMessage))
    }
  },
  async (error) => {
    const originalRequest = error.config

    // 处理401未授权/Token过期
    if (error.response?.status === 401 && !originalRequest?._retry) {
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

      if (originalRequest) {
        originalRequest._retry = true
      }
      isAutoLogging = true

      try {
        console.log('🔄 Token过期，尝试自动登录...')
        const autoLoginSuccess = await autoLogin.tryAutoLogin()

        if (autoLoginSuccess) {
          console.log('✅ 自动登录成功，重试请求')
          const newToken = localStorage.getItem('userToken') || localStorage.getItem('token')

          processQueue(null, newToken)

          if (originalRequest) {
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`
            return request(originalRequest)
          }
        } else {
          console.log('❌ 自动登录失败')
          processQueue(new Error('自动登录失败'), null)

          const userStore = useUserStore()
          userStore.clearUser()

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

    if (originalRequest?.skipGlobalError) {
      return Promise.reject(error)
    }

    if (error.response) {
      console.error('响应错误:', error.response.status, error.response.data)

      let errorMessage = '操作失败'
      if (error.response.data?.message) {
        errorMessage = error.response.data.message
      } else {
        errorMessage = getHttpStatusMessage(error.response.status)
      }

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
