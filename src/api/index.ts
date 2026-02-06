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
  CaptchaResponse, // 这个是联合类型，需要具体化
} from '../types/user'

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
  withCredentials: true,
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
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
    let message = '请求失败'
    if (error.response) {
      const { status } = error.response
      switch (status) {
        case 400:
          message = '请求参数错误'
          break
        case 401:
          message = '未授权，请登录'
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

// API 接口定义
export const api = {
  // 认证模块
  login: (data: { username: string; password: string; captcha: string }) =>
    request<ApiResponse<LoginData>>({
      method: 'POST',
      url: '/login',
      data,
    }),

  // 修改register接口（只需要4个字段）
  register: (data: { username: string; password: string; email: string; verifyCode: string }) =>
    request<ApiResponse<null>>({ method: 'POST', url: '/register', data }),

  logout: () => request<ApiResponse<null>>({ method: 'POST', url: '/logout' }),

  refreshToken: () => request<ApiResponse<null>>({ method: 'POST', url: '/token/refresh' }),

  // 发送邮箱验证码
  sendVerifyCode: (email: string) =>
    request<ApiResponse<null>>({
      method: 'POST',
      url: '/verify/email',
      data: { email },
    }),

  // 获取图形验证码 - 使用具体的CaptchaDataResponse类型
  getCaptcha: () => request<CaptchaDataResponse>({ method: 'GET', url: '/captcha' }),

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

export default service
