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
  baseURL: '', // 使用相对路径，由Nginx处理代理
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
  withCredentials: true,
})

// 请求拦截器：自动添加Token到所有请求
service.interceptors.request.use(
  (config) => {
    // 从localStorage获取Token（键名是userToken）
    const token = localStorage.getItem('userToken')

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 如果是FormData，删除Content-Type让浏览器自动设置
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器 - 修改错误处理
service.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error) => {
    // ✅ 不要覆盖后端的具体错误信息
    if (error.response && error.response.data && error.response.data.message) {
      // 如果后端有返回具体错误信息，直接使用它
      return Promise.reject(new Error(error.response.data.message))
    }

    // 只有网络错误或后端没有返回具体信息时，才使用通用错误
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
          // 跳转到登录页
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
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

// 根据后端返回结构定义具体的验证码响应类型
interface CaptchaDataResponse {
  code: number
  data: string // 验证码文本
  message: string
  captchaId: string
  expiresIn: number
  captchaBase64: string // 图片base64
}

// 定义LoginData类型匹配项目文档
interface LoginData {
  token: string
  role: string
  username: string
  refreshToken?: string
}

// API 接口定义 - 保持所有原有功能
export const api = {
  // 认证模块
  login: (data: { username: string; password: string; captcha: string }) =>
    request<ApiResponse<LoginData>>({
      method: 'POST',
      url: '/api/login',
      data,
    }),

  // 修改register接口（只需要4个字段）
  register: (data: { username: string; password: string; email: string; verifyCode: string }) =>
    request<ApiResponse<null>>({ method: 'POST', url: '/api/register', data }),

  logout: () => request<ApiResponse<null>>({ method: 'POST', url: '/api/logout' }),

  refreshToken: () => request<ApiResponse<null>>({ method: 'POST', url: '/api/token/refresh' }),

  // 发送邮箱验证码
  sendVerifyCode: (email: string) =>
    request<ApiResponse<null>>({
      method: 'POST',
      url: '/api/verify/email',
      data: { email },
    }),

  // 获取图形验证码 - 使用具体的CaptchaDataResponse类型
  getCaptcha: () => request<CaptchaDataResponse>({ method: 'GET', url: '/api/captcha' }),

  // 学习计划模块
  getStudyPlans: () =>
    request<ApiResponse<StudyPlan[]>>({ method: 'GET', url: '/api/study-plans' }),

  getStudyPlan: (id: string) =>
    request<ApiResponse<StudyPlan>>({ method: 'GET', url: `/api/study-plans/${id}` }),

  createStudyPlan: (data: Omit<StudyPlan, 'id'>) =>
    request<ApiResponse<StudyPlan>>({ method: 'POST', url: '/api/study-plans', data }),

  updateStudyPlan: (id: string, data: Partial<StudyPlan>) =>
    request<ApiResponse<StudyPlan>>({ method: 'PUT', url: `/api/study-plans/${id}`, data }),

  deleteStudyPlan: (id: string) =>
    request<ApiResponse<null>>({ method: 'DELETE', url: `/api/study-plans/${id}` }),

  // 智能问答 - 关键修复：移除手动设置的Authorization头，依赖请求拦截器
  askQuestion: (data: { question: string; file?: File; sessionId?: string; stream?: boolean }) => {
    const formData = new FormData()
    formData.append('question', data.question)
    if (data.file) {
      formData.append('file', data.file)
    }
    if (data.sessionId) {
      formData.append('sessionId', data.sessionId)
    }
    if (data.stream !== undefined) {
      formData.append('stream', data.stream.toString())
    }

    return request<ApiResponse<ChatResponse>>({
      method: 'POST',
      url: '/ai/chat',
      data: formData,
      // 注意：这里不设置headers，由请求拦截器自动添加Authorization
    })
  },

  // 查询任务状态 - 移除手动设置的Authorization头
  getTaskStatus: (taskId: string) =>
    request<ApiResponse<TaskStatusResponse>>({
      method: 'GET',
      url: `/ai/chat/task/${taskId}`,
      // 注意：这里不设置headers，由请求拦截器自动添加Authorization
    }),

  // 获取历史对话 - 移除手动设置的Authorization头
  getChatHistory: (sessionId?: string, limit?: number) =>
    request<ApiResponse<ChatHistoryItem[]>>({
      method: 'GET',
      url: '/ai/chat/history',
      params: { sessionId, limit },
      // 注意：这里不设置headers，由请求拦截器自动添加Authorization
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

  updateProgress: (data: Partial<LearningProgress>) =>
    request<ApiResponse<LearningProgress>>({
      method: 'POST',
      url: '/api/learning-progress/update',
      data,
    }),
}

export default service

// 新增类型定义
interface QaResponse {
  answer: string
  fromCache: boolean
  contexts: string[]
  sourceDocuments: string[]
  modelUsed: string
  responseTime: number
  queryId: string
}

interface QaHistoryItem {
  id: number
  question: string
  answer: string
  askTime: string
  responseTime: number
}

// 新增类型定义
interface ChatResponse {
  answer?: string
  sessionId: string
  taskId?: string // 文件上传时返回
  status?: string // 文件上传时返回
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
