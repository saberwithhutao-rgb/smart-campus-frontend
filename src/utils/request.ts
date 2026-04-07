// utils/request.ts
import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'
import router from '@/router'
import { STORAGE_KEYS } from './storageKeys'

// 扩展 AxiosRequestConfig 类型，添加 metadata
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: { startTime: number }
  _retry?: boolean
  skipGlobalError?: boolean
}

// 创建axios实例
const request: AxiosInstance = axios.create({
  baseURL: '/api',
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
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: unknown) => void
  reject: (reason?: Error | string | unknown) => void
}> = []

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

// ==================== 请求拦截器 ====================
request.interceptors.request.use(
  (config: ExtendedAxiosRequestConfig) => {
    config.metadata = { startTime: Date.now() }

    const token =
      localStorage.getItem(STORAGE_KEYS.TOKEN) || localStorage.getItem(STORAGE_KEYS.TOKEN_ALT)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error: AxiosError) => Promise.reject(error),
)

// ==================== 响应拦截器 - 成功处理 ====================
const handleSuccessResponse = (response: AxiosResponse) => {
  const res = response.data
  const config = response.config as ExtendedAxiosRequestConfig

  // 验证码接口直接返回
  if (config.url?.includes('captcha')) {
    return res
  }

  if (config.url?.includes('/verify/email') || config.url?.includes('/password/reset/send')) {
    return res
  }

  // 跳过全局错误处理
  if (config.skipGlobalError) {
    return res
  }

  // 没有业务状态码，直接返回数据
  if (!res || typeof res !== 'object' || (!('code' in res) && !('success' in res))) {
    return res
  }

  // 成功状态码
  if (res.code === 1 || res.code === 0 || res.code === 200 || res.success === true) {
    return res.data ?? res
  }

  // 业务错误
  const errorMessage = res?.message || res?.msg || '操作失败'
  console.error(`[API Error] ${config.url}:`, errorMessage, res)
  ElMessage.error(errorMessage)
  return Promise.reject(new Error(errorMessage))
}

// ==================== 响应拦截器 - 错误处理 ====================
/**
 * 处理 401 错误，尝试刷新 token
 */
const handleUnauthorized = async (
  error: AxiosError,
  originalRequest: ExtendedAxiosRequestConfig,
) => {
  if (originalRequest.url?.includes('/login')) {
    return Promise.reject(error)
  }
  if (originalRequest.url?.includes('/auth/refresh')) {
    return Promise.reject(error)
  }

  if (isRefreshing) {
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
  isRefreshing = true

  try {
    console.log('🔄 Token 过期，尝试刷新...')
    const userStore = useUserStore()
    const refreshSuccess = await userStore.refreshAccessToken()

    if (refreshSuccess) {
      console.log('✅ Token 刷新成功，重试请求')
      const newToken =
        localStorage.getItem(STORAGE_KEYS.TOKEN) || localStorage.getItem(STORAGE_KEYS.TOKEN_ALT)
      processQueue(null, newToken)
      originalRequest.headers['Authorization'] = `Bearer ${newToken}`
      return request(originalRequest)
    } else {
      // ✅ refresh token 过期，尝试自动登录
      console.log('⚠️ Refresh token 过期，尝试自动登录...')
      const autoLoginSuccess = await userStore.tryAutoLogin()

      if (autoLoginSuccess) {
        console.log('✅ 自动登录成功，重试请求')
        const newToken =
          localStorage.getItem(STORAGE_KEYS.TOKEN) || localStorage.getItem(STORAGE_KEYS.TOKEN_ALT)
        processQueue(null, newToken)
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`
        return request(originalRequest)
      } else {
        console.log('❌ 自动登录失败，跳转登录页')
        processQueue(new Error('自动登录失败'), null)

        // 清除所有凭证
        const userStore = useUserStore()
        userStore.logout(false)

        ElMessage.error('登录已过期，请重新登录')
        router.push('/login')
        return Promise.reject(error)
      }
    }
  } catch (refreshError) {
    console.error('刷新/自动登录过程出错:', refreshError)
    processQueue(refreshError as Error, null)

    const userStore = useUserStore()
    userStore.logout(false)

    ElMessage.error('登录已过期，请重新登录')
    router.push('/login')
    return Promise.reject(error)
  } finally {
    console.log('handleUnauthorized 执行完毕')
    isRefreshing = false
  }
}

const handleErrorResponse = async (error: AxiosError) => {
  const originalRequest = error.config as ExtendedAxiosRequestConfig

  // 跳过全局错误处理
  if (originalRequest?.skipGlobalError) {
    return Promise.reject(error)
  }

  // 处理 401 错误（未授权）
  if (error.response?.status === 401 && !originalRequest?._retry) {
    return handleUnauthorized(error, originalRequest)
  }

  // 普通错误处理
  if (error.response) {
    const { status, data } = error.response
    console.error('响应错误:', status, data)

    const errorData = data as { message?: string; msg?: string }
    let errorMessage = errorData?.message || errorData?.msg || getHttpStatusMessage(status)
    if (errorMessage.includes('Maximum upload size exceeded')) {
      errorMessage = '文件过大，请上传小于50MB的文件'
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
}

// ==================== 注册拦截器 ====================
request.interceptors.response.use(handleSuccessResponse, handleErrorResponse)

export default request
