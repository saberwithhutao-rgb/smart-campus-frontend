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
  paramsSerializer: (params) => {
    if (params.page === undefined) params.page = 0
    if (params.size === undefined) params.size = 10
    return Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&')
  },
})

// ==================== 请求队列管理 ====================
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
// ==================== HTTP状态码提示 ====================
const HTTP_STATUS_MESSAGES = {
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

const getHttpStatusMessage = (status) => {
  return HTTP_STATUS_MESSAGES[status] || `请求失败 (${status})`
}

// ==================== 工具函数 ====================
const logRequest = (config) => {
  console.log('[原始URL]', config.url)
  console.log('[完整URL]', axios.getUri(config))
  console.log('[API Request]', {
    url: config.url,
    method: config.method,
    hasToken: !!localStorage.getItem('userToken') || !!localStorage.getItem('token'),
  })
}

const logResponse = (response, duration) => {
  console.log(`请求耗时: ${duration} ms - ${response.config.url}`)
  console.log('📦 拦截器收到的原始响应:', response.data)
}

// ==================== 请求拦截器 ====================
request.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: Date.now() }

    const token = localStorage.getItem('userToken') || localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    logRequest(config)
    return config
  },
  (error) => Promise.reject(error),
)

// ==================== 响应拦截器 - 成功处理 ====================
const handleSuccessResponse = (response) => {
  const duration = Date.now() - response.config.metadata.startTime
  logResponse(response, duration)

  const res = response.data
  const config = response.config

  // 跳过全局错误处理
  if (config.skipGlobalError) {
    return res
  }

  // 没有业务状态码，直接返回数据
  if (!res || typeof res !== 'object' || (!('code' in res) && !('success' in res))) {
    console.log(`[API Success] ${config.url}: 直接返回数据`, res)
    return res
  }

  // 成功状态码
  if (res.code === 200 || res.code === 0 || res.success === true) {
    console.log(`[API Success] ${config.url}:`, res.data || res)
    return res.data ?? res
  }

  // 业务错误
  const errorMessage = res?.message || res?.msg || '操作失败'
  console.error(`[API Error] ${config.url}:`, errorMessage, res)
  ElMessage.error(errorMessage)
  return Promise.reject(new Error(errorMessage))
}

// ==================== 响应拦截器 - 错误处理 ====================
const handleAutoLogin = async (error, originalRequest) => {
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
    const autoLoginSuccess = await autoLogin.tryAutoLogin()

    if (autoLoginSuccess) {
      console.log('✅ 自动登录成功，重试请求')
      const newToken = localStorage.getItem('userToken') || localStorage.getItem('token')
      processQueue(null, newToken)
      originalRequest.headers['Authorization'] = `Bearer ${newToken}`
      return request(originalRequest)
    } else {
      console.log('❌ 自动登录失败')
      processQueue(new Error('自动登录失败'), null)
      const userStore = useUserStore()
      userStore.clearUser?.()
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

const handleErrorResponse = async (error) => {
  const originalRequest = error.config

  // 跳过全局错误处理
  if (originalRequest?.skipGlobalError) {
    return Promise.reject(error)
  }

  // 处理401自动登录
  if (error.response?.status === 401 && !originalRequest?._retry) {
    return handleAutoLogin(error, originalRequest)
  }

  // 普通错误处理
  if (error.response) {
    const { status, data } = error.response
    console.error('响应错误:', status, data)

    const errorMessage = data?.message || data?.msg || getHttpStatusMessage(status)
    console.log('🔥 进入错误拦截器', error.response?.status)
    ElMessage.error(errorMessage)
  } else if (error.request) {
    console.error('网络错误:', error.request)
    ElMessage.error('网络连接失败，请检查网络设置')
  } else {
    console.error('请求错误:', error.message)
    ElMessage.error(error.message || '请求失败，请稍后再试')
  }

  return Promise.reject(error)
}

// ==================== 注册拦截器 ====================
request.interceptors.response.use(handleSuccessResponse, handleErrorResponse)

export default request
