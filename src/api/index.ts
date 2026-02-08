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

// 创建 axios 实例 - 修改baseURL
const service: AxiosInstance = axios.create({
  baseURL: '', // 改为空字符串，使用相对路径
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
  withCredentials: false, // 改为false，避免CORS问题
})

// 请求拦截器：添加Token
service.interceptors.request.use(
  (config) => {
    // 从localStorage获取token，注意键名是userToken
    const token = localStorage.getItem('userToken')

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 如果是FormData，不设置Content-Type，让浏览器自动设置
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error) => {
    if (error.response && error.response.data && error.response.data.message) {
      return Promise.reject(new Error(error.response.data.message))
    }

    let message = '请求失败'
    if (error.response) {
      const { status } = error.response
      switch (status) {
        case 400:
          message = '请求参数错误'
          break
        case 401:
          message = '未授权，请登录'
          localStorage.removeItem('userToken')
          localStorage.removeItem('userInfo')
          localStorage.removeItem('refreshToken')
          window.location.href = '/login'
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
    return res.data
  })
}

// 类型定义
interface CaptchaDataResponse {
  code: number
  data: string
  message: string
  captchaId: string
  expiresIn: number
  captchaBase64: string
}

interface LoginData {
  token: string
  role: string
  username: string
  refreshToken?: string
}

interface ChatResponse {
  answer?: string
  sessionId: string
  taskId?: string
  status?: string
}

interface TaskStatusResponse {
  taskId: string
  status: 'processing' | 'completed' | 'failed'
  answer?: string
  error?: string
}

interface ChatHistoryItem {
  id: number
  sessionId: string
  question: string
  answer: string
  createdAt: string
  title?: string
  fileId?: number
}

// API 接口定义
export const api = {
  // 认证模块
  login: (data: { username: string; password: string; captcha: string }) =>
    request<ApiResponse<LoginData>>({
      method: 'POST',
      url: '/api/login', // 注意这里用/api前缀
      data,
    }),

  register: (data: { username: string; password: string; email: string; verifyCode: string }) =>
    request<ApiResponse<null>>({ method: 'POST', url: '/api/register', data }),

  logout: () => request<ApiResponse<null>>({ method: 'POST', url: '/api/logout' }),

  refreshToken: () => request<ApiResponse<null>>({ method: 'POST', url: '/api/token/refresh' }),

  sendVerifyCode: (email: string) =>
    request<ApiResponse<null>>({
      method: 'POST',
      url: '/api/verify/email',
      data: { email },
    }),

  getCaptcha: () => request<CaptchaDataResponse>({ method: 'GET', url: '/api/captcha' }),

  // 学习计划模块
  getStudyPlans: () =>
    request<ApiResponse<StudyPlan[]>>({ method: 'GET', url: '/api/study-plans' }),

  getStudyPlan: (id: string) =>
    request<ApiResponse<StudyPlan>>({ method: 'GET', url: `/api/study-plans/${id}` }),

  createStudyPlan: (data: Omit<StudyPlan, 'id'>) =>
    request<ApiResponse<StudyPlan>>({ method: 'POST', url: '/api/study-plans', data }),

  // 智能问答 - 关键修复：直接使用/ai/路径，不要加/api前缀
  askQuestion: (data: { question: string; file?: File; sessionId?: string; stream?: boolean }) => {
    const formData = new FormData()
    formData.append('question', data.question)
    if (data.file) {
      formData.append('file', data.file)
    }
    if (data.sessionId) {
      formData.append('sessionId', data.sessionId)
    }
    if (data.stream) {
      formData.append('stream', 'true')
    }

    return request<ApiResponse<ChatResponse>>({
      method: 'POST',
      url: '/ai/chat', // 关键：直接使用/ai/chat，Nginx会代理到后端
      data: formData,
    })
  },

  // 查询任务状态
  getTaskStatus: (taskId: string) =>
    request<ApiResponse<TaskStatusResponse>>({
      method: 'GET',
      url: `/ai/chat/task/${taskId}`,
    }),

  // 获取历史对话
  getChatHistory: (sessionId?: string, limit?: number) =>
    request<ApiResponse<ChatHistoryItem[]>>({
      method: 'GET',
      url: '/ai/chat/history',
      params: { sessionId, limit },
    }),

  // 文件处理模块
  uploadFile: (file: File, type: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    return request<ApiResponse<FileItem>>({
      method: 'POST',
      url: '/api/files/upload',
      data: formData,
    })
  },

  getFileList: (type?: string) =>
    request<ApiResponse<FileItem[]>>({ method: 'GET', url: '/api/files', params: { type } }),

  // 学习进度模块
  getLearningProgress: () =>
    request<ApiResponse<LearningProgress[]>>({ method: 'GET', url: '/api/learning-progress' }),
}

export default service
