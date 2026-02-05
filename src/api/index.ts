import axios from 'axios'
import type { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios'
import type {
  User,
  StudyPlan,
  QaMessage,
  FileItem,
  LearningProgress,
  LoginResponse,
  ApiResponse,
  CaptchaResponse,
} from '../types/user'

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
  withCredentials: true, // 添加这行，确保发送cookie
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 添加调试日志
    console.log('%c[API Request]', 'color: #4CAF50; font-weight: bold;', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      headers: config.headers,
      data: config.data,
    })

    return config
  },
  (error) => {
    console.error('%c[Request Error]', 'color: #F44336; font-weight: bold;', error)
    return Promise.reject(error)
  },
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('%c[API Response]', 'color: #2196F3; font-weight: bold;', {
      status: response.status,
      data: response.data,
      url: response.config.url,
    })

    // 直接返回完整的响应数据，由request函数处理
    return response
  },
  (error) => {
    console.error('%c[Response Error]', 'color: #F44336; font-weight: bold;', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    })

    // 处理HTTP错误
    let message = '请求失败'
    if (error.response) {
      const { status } = error.response
      switch (status) {
        case 400:
          message = '请求参数错误'
          break
        case 401:
          message = '未授权，请登录'
          // 可以在这里实现token刷新或跳转到登录页
          localStorage.removeItem('token')
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求资源不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        default:
          message = `连接错误: ${status}`
      }
    }
    return Promise.reject(new Error(message))
  },
)

// 通用请求函数
const request = <T>(config: AxiosRequestConfig): Promise<T> => {
  return service(config).then((res) => {
    console.log('Response data:', res.data)
    return res.data
  })
}

// API 接口定义
export const api = {
  // 认证模块
  login: (data: { username: string; password: string; captcha: string; captchaId?: string }) =>
    request<LoginResponse>({ method: 'POST', url: '/login', data }),

  register: (data: { username: string; password: string; email: string; verifyCode: string }) =>
    request<ApiResponse<null>>({ method: 'POST', url: '/register', data }),

  logout: () => request<ApiResponse<null>>({ method: 'POST', url: '/logout' }),

  refreshToken: () => request<ApiResponse<null>>({ method: 'POST', url: '/token/refresh' }),

  sendVerifyCode: (email: string, captcha: string, captchaId: string) =>
    request<ApiResponse<null>>({
      method: 'POST',
      url: '/verify/email',
      data: { email, captcha, captchaId }, // 需要三个参数
    }),

  getCaptcha: () => request<CaptchaResponse>({ method: 'GET', url: '/captcha' }),
  // 学习计划模块
  getStudyPlans: () => request<ApiResponse<StudyPlan[]>>({ method: 'GET', url: '/study-plans' }),

  getStudyPlan: (id: string) =>
    request<ApiResponse<StudyPlan>>({ method: 'GET', url: `/study-plans/${id}` }),

  createStudyPlan: (data: Omit<StudyPlan, 'id'>) =>
    request<ApiResponse<StudyPlan>>({ method: 'POST', url: '/study-plans', data }),

  updateStudyPlan: (id: string, data: Partial<StudyPlan>) =>
    request<ApiResponse<StudyPlan>>({ method: 'PUT', url: `/study-plans/${id}`, data }),

  deleteStudyPlan: (id: string) =>
    request<ApiResponse<null>>({ method: 'DELETE', url: `/study-plans/${id}` }),

  // 智能问答模块
  askQuestion: (question: string) =>
    request<ApiResponse<{ question: string; answer: string }>>({
      method: 'POST',
      url: '/qa/ask',
      data: { question },
    }),

  getQaHistory: () => request<ApiResponse<QaMessage[]>>({ method: 'GET', url: '/qa/history' }),

  // 文件处理模块
  uploadFile: (file: File, type: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    return request<ApiResponse<FileItem>>({
      method: 'POST',
      url: '/files/upload',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  getFileList: (type?: string) =>
    request<ApiResponse<FileItem[]>>({ method: 'GET', url: '/files', params: { type } }),

  // 学习进度模块
  getLearningProgress: () =>
    request<ApiResponse<LearningProgress[]>>({ method: 'GET', url: '/learning-progress' }),

  updateProgress: (data: Partial<LearningProgress>) =>
    request<ApiResponse<LearningProgress>>({
      method: 'POST',
      url: '/learning-progress/update',
      data,
    }),
}

// 导出axios实例供其他地方使用
export default service
