// utils/request.ts
import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { ElMessage } from 'element-plus'
import { autoLogin } from './autoLogin'
import { useUserStore } from '../stores/user'
import router from '@/router'

// 扩展 AxiosRequestConfig 类型，添加 metadata
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: { startTime: number }
  _retry?: boolean
  skipGlobalError?: boolean
}

// 创建axios实例
const request: AxiosInstance = axios.create({
  baseURL: '',
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
  paramsSerializer: (params: Record<string, unknown>) => {
    const serializedParams: Record<string, string | number | boolean> = {}

    Object.entries(params).forEach(([key, value]) => {
      if (key === 'page' && value === undefined) serializedParams.page = 0
      else if (key === 'size' && value === undefined) serializedParams.size = 10
      else if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        serializedParams[key] = value
      }
      // 忽略复杂类型
    })

    return Object.entries(serializedParams)
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&')
  },
})

// ==================== 请求队列管理 ====================
type ResolveFunction = (value: unknown) => void
type RejectFunction = (reason?: Error | string | unknown) => void

interface QueueItem {
  resolve: ResolveFunction
  reject: RejectFunction
}

let failedQueue: QueueItem[] = []
let isAutoLogging = false

const processQueue = (error: Error | null, token: string | null = null) => {
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
const HTTP_STATUS_MESSAGES: Record<number, string> = {
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

const getHttpStatusMessage = (status: number): string => {
  return HTTP_STATUS_MESSAGES[status] || `请求失败 (${status})`
}

// ==================== 工具函数 ====================
const logRequest = (config: ExtendedAxiosRequestConfig) => {
  console.log('[原始URL]', config.url)
  console.log('[完整URL]', axios.getUri(config))
  console.log('[API Request]', {
    url: config.url,
    method: config.method,
    hasToken: !!localStorage.getItem('userToken') || !!localStorage.getItem('token'),
  })
}

const logResponse = (response: AxiosResponse, duration: number) => {
  console.log(`请求耗时: ${duration} ms - ${response.config.url}`)
  console.log('📦 拦截器收到的原始响应:', response.data)
}

// ==================== 请求拦截器 ====================
request.interceptors.request.use(
  (config: ExtendedAxiosRequestConfig) => {
    config.metadata = { startTime: Date.now() }

    const token = localStorage.getItem('userToken') || localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    logRequest(config)
    return config
  },
  (error: AxiosError) => Promise.reject(error),
)

// ==================== 响应拦截器 - 成功处理 ====================
const handleSuccessResponse = (response: AxiosResponse) => {
  const duration = Date.now() - (response.config as ExtendedAxiosRequestConfig).metadata!.startTime
  logResponse(response, duration)

  const res = response.data
  const config = response.config as ExtendedAxiosRequestConfig

  if (config.url?.includes('/api/captcha')) {
    return response.data // 返回完整对象，让拦截器不处理
  }

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
const handleAutoLogin = async (error: AxiosError, originalRequest: ExtendedAxiosRequestConfig) => {
  if (originalRequest.url?.includes('/api/login')) {
    return Promise.reject(error)
  }
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
      userStore.logout(false)
      router.push('/login')
    }
  } catch (autoLoginError) {
    console.error('自动登录过程出错:', autoLoginError)
    processQueue(autoLoginError as Error, null)
  } finally {
    isAutoLogging = false
  }
}

const handleErrorResponse = async (error: AxiosError) => {
  const originalRequest = error.config as ExtendedAxiosRequestConfig

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

    const errorData = data as { message?: string; msg?: string }
    const errorMessage = errorData?.message || errorData?.msg || getHttpStatusMessage(status)
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
