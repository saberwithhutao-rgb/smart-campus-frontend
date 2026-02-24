import axios from 'axios'
import type { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios'
import type { ReviewItem, StudyPlan } from '@/stores/studyPlan'
import type { ExamCountdown } from '../types/user'
import type {
  QaMessage,
  FileItem,
  LearningProgress,
  LoginResponse,
  ApiResponse,
  CaptchaResponse,
} from '../types/user'
import type {
  CompetitionRule,
  CompetitionListParams,
  CompetitionListResponse,
} from '../types/competition'
import type {
  UniversityListResponse,
  UniversityCheckResponse,
  UniversityIdsResponse,
  UniversityListDetailResponse,
  UniversityCountResponse,
} from '../types/university'

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.PROD ? '' : '/api', // 生产环境空路径，开发环境用/api
  timeout: import.meta.env.PROD ? 30000 : 600000, // 生产30秒，开发10分钟
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
  withCredentials: true,
})

// 新增类型定义
interface LoginData {
  token: string
  role: string
  username: string
  email: string // 邮箱
  avatar: string // 头像URL
  studentId: string // 学号
  major: string // 专业
  college: string // 学院
  grade: string // 年级
  gender: string // 性别
  genderText: string // 性别文本描述
  refreshToken?: string // 可选字段
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

// ===== 新增：历史对话相关类型定义 =====
/**
 * 会话列表项
 */
export interface ConversationSession {
  sessionId: string
  title: string
  preview: string
  createTime: string
  messageCount: number
  fileId?: number
  fileName?: string
  fileType?: string
}

/**
 * 会话历史记录项
 */
export interface SessionHistoryItem {
  question: string
  answer: string
  createTime: string
  questionType: string
  rating: number
  tokenUsage: number
  fileId?: number
  fileName?: string
  fileType?: string
}

/**
 * 对话统计信息
 */
export interface ChatStats {
  totalConversations: number
  totalTokens: number
  totalSessions: number
  positiveRatings: number
  negativeRatings: number
  unrated: number
}

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 使用userToken作为主token
    const token = localStorage.getItem('userToken') || localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 开发环境下生成随机userId用于测试
    if (import.meta.env.DEV && !localStorage.getItem('userId')) {
      const userId = Math.floor(Math.random() * 1000000).toString()
      localStorage.setItem('userId', userId)
      console.log(
        '%c[Test Mode]',
        'color: #FF9800; font-weight: bold;',
        `Generated random userId: ${userId}`,
      )
      config.headers['X-User-Id'] = userId
    }

    // 开发环境下添加调试日志
    if (import.meta.env.DEV) {
      console.log('%c[API Request]', 'color: #4CAF50; font-weight: bold;', {
        url: config.url,
        method: config.method,
        baseURL: config.baseURL,
        headers: config.headers,
        data: config.data,
      })
    }

    // 如果是FormData，删除Content-Type让浏览器自动设置
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }

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
    // 开发环境下添加调试日志
    if (import.meta.env.DEV) {
      console.log('%c[API Response]', 'color: #2196F3; font-weight: bold;', {
        status: response.status,
        data: response.data,
        url: response.config.url,
      })
    }
    return response
  },
  (error) => {
    // 优先使用后端返回的具体错误信息
    if (error.response && error.response.data && error.response.data.message) {
      console.error('%c[Response Error]', 'color: #F44336; font-weight: bold;', {
        message: error.response.data.message,
        status: error.response.status,
        url: error.config?.url,
      })
      return Promise.reject(new Error(error.response.data.message))
    }

    // 网络错误或后端没有返回具体信息时，使用通用错误
    let message = '请求失败'
    if (error.response) {
      const { status } = error.response
      switch (status) {
        case 400:
          message = '请求参数错误'
          break
        case 401:
          message = '未授权，请登录'
          // 清除所有用户相关存储
          localStorage.removeItem('userToken')
          localStorage.removeItem('token')
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

    console.error('%c[Response Error]', 'color: #F44336; font-weight: bold;', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    })

    return Promise.reject(new Error(message))
  },
)

// 通用请求函数
const request = <T>(config: AxiosRequestConfig): Promise<T> => {
  return service(config)
    .then((res) => {
      console.log('request 收到响应，准备返回 data')
      return res.data
    })
    .catch((err) => {
      console.log('request 捕获错误:', err)
      throw err
    })
}

// API 接口定义
export const api = {
  clearAuthHeader: () => {
    localStorage.removeItem('userToken')
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('refreshToken')
    delete service.defaults.headers.common['Authorization']
  },

  getStudyPlanDetails: (studyPlanId: number) =>
    request({
      method: 'GET',
      url: `/study-plan-details/plan/${studyPlanId}`,
    }),

  getStudyPlanDetail: (detailId: number) =>
    request({
      method: 'GET',
      url: `/study-plan-details/${detailId}`,
    }),

  generatePlanDetail: (data: {
    studyPlanId: number
    subject: string
    duration: string
    level: string
  }) =>
    request({
      method: 'POST',
      url: '/ai/plan-detail',
      data,
      timeout: 120000,
    }),

  deleteStudyPlanDetail: (detailId: number) =>
    request({
      method: 'DELETE',
      url: `/study-plan-details/${detailId}`,
    }),

  // 认证模块
  login: (data: { username: string; password: string; captcha: string; captchaId?: string }) =>
    request<ApiResponse<LoginData>>({ method: 'POST', url: '/api/login', data }),

  register: (data: { username: string; password: string; email: string; verifyCode: string }) =>
    request<ApiResponse<null>>({ method: 'POST', url: '/api/register', data }),

  logout: () => request<ApiResponse<null>>({ method: 'POST', url: '/api/logout' }),

  refreshToken: () => request<ApiResponse<null>>({ method: 'POST', url: '/api/token/refresh' }),

  sendVerifyCode: (email: string) =>
    request<ApiResponse<null>>({ method: 'POST', url: '/api/verify/email', data: { email } }),

  getCaptcha: () => request<CaptchaResponse>({ method: 'GET', url: '/api/captcha' }),

  // 学习计划模块
  getStudyPlans: (params?: {
    page?: number
    size?: number
    status?: string
    planType?: string
    subject?: string
  }) =>
    request<
      ApiResponse<{
        list: StudyPlan[]
        total: number
        page: number
        size: number
        totalPages: number
      }>
    >({
      method: 'GET',
      url: '/api/study/plans', // ✅ 修正路径！
      params,
    }),

  getStudyPlan: (
    id: number, // ✅ 类型从 string 改为 number
  ) =>
    request<ApiResponse<StudyPlan>>({
      method: 'GET',
      url: `/api/study/plans/${id}`, // ✅ 修正路径！
    }),

  batchGenerateReviewPlans: (taskIds: number[]) =>
    request<ApiResponse<null>>({
      method: 'POST',
      url: '/api/study/tasks/batch-generate',
      data: taskIds,
    }),

  createStudyPlan: (data: {
    title: string
    description?: string
    planType: 'review' | 'learning' | 'project'
    subject?: string
    difficulty?: 'easy' | 'medium' | 'hard'
    startDate: string
    endDate?: string
  }) =>
    request<ApiResponse<StudyPlan>>({
      method: 'POST',
      url: '/api/study/plans',
      data,
    }),

  updateStudyPlan: (
    id: number,
    data: {
      title?: string
      description?: string
      planType?: 'review' | 'learning' | 'project'
      subject?: string
      difficulty?: 'easy' | 'medium' | 'hard'
      status?: 'active' | 'completed' | 'paused'
      startDate?: string
      endDate?: string
    },
  ) =>
    request<ApiResponse<StudyPlan>>({
      method: 'PUT',
      url: `/api/study/plans/${id}`,
      data,
    }),

  deleteStudyPlan: (id: number) =>
    request<ApiResponse<null>>({
      method: 'DELETE',
      url: `/api/study/plans/${id}`,
    }),

  // ✅ 切换完成状态
  togglePlanComplete: (id: number) =>
    request<ApiResponse<StudyPlan>>({
      method: 'POST',
      url: `/api/study/plans/${id}/toggle`,
    }),

  // ✅ 获取学习日程
  getStudySchedule: (params?: { startDate?: string; endDate?: string; planId?: number }) =>
    request<
      ApiResponse<
        Array<{
          id: number
          title: string
          type: string
          start_date: string
          end_date: string | null
          progress: number
          status: string
        }>
      >
    >({
      method: 'GET',
      url: '/api/study/schedule',
      params,
    }),

  // 智能问答模块
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
      url: '/ai/chat/send',
      data: formData,
    })
  },

  // 简单问答接口（兼容旧版本）
  sendAiMessage: (message: string, chanId?: string) =>
    request<string>({
      method: 'POST',
      url: '/ai/chat/openai',
      params: { message, chanId },
    }),

  // 查询任务状态
  getTaskStatus: (taskId: string) =>
    request<ApiResponse<TaskStatusResponse>>({
      method: 'GET',
      url: `/ai/chat/task/${taskId}`,
    }),

  // 获取问答历史
  getQaHistory: () => request<ApiResponse<QaMessage[]>>({ method: 'GET', url: '/qa/history' }),

  // 获取AI聊天历史
  getChatHistory: (sessionId?: string, limit?: number) =>
    request<ApiResponse<ChatHistoryItem[]>>({
      method: 'GET',
      url: '/ai/chat/history',
      params: { sessionId, limit },
    }),

  /**
   * 获取用户的会话列表（每个会话一条记录）
   */
  getConversationSessions: () =>
    request<ApiResponse<ConversationSession[]>>({
      method: 'GET',
      url: '/ai/chat/sessions',
      timeout: 10000,
      responseType: 'json', // 强制指定响应类型
      headers: {
        Accept: 'application/json;charset=UTF-8', // 明确指定编码
      },
    }),

  /**
   * 获取某个会话的完整历史记录
   * @param sessionId 会话ID
   */
  getSessionHistory: (sessionId: string) =>
    request<ApiResponse<SessionHistoryItem[]>>({
      method: 'GET',
      url: `/ai/chat/history/${sessionId}`,
    }),

  /**
   * 删除整个会话
   * @param sessionId 会话ID
   */
  deleteSession: (sessionId: string) =>
    request<ApiResponse<{ deletedCount: number }>>({
      method: 'DELETE',
      url: `/ai/chat/session/${sessionId}`,
    }),

  /**
   * 重命名会话
   * @param sessionId 会话ID
   * @param title 新标题
   */
  renameSession: (sessionId: string, title: string) =>
    request<ApiResponse<null>>({
      method: 'PUT',
      url: `/ai/chat/session/${sessionId}`,
      data: { title },
    }),

  /**
   * 评价回答
   * @param conversationId 对话记录ID
   * @param rating 评分：-1不满意，0未评价，1满意
   */
  rateConversation: (conversationId: number, rating: number) =>
    request<ApiResponse<null>>({
      method: 'POST',
      url: `/ai/chat/rate/${conversationId}`,
      data: { rating },
    }),

  /**
   * 获取对话统计信息
   */
  getChatStats: () =>
    request<ApiResponse<ChatStats>>({
      method: 'GET',
      url: '/ai/chat/stats',
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

  // 竞赛管理模块
  getCompetitions: (params?: CompetitionListParams) =>
    request<CompetitionListResponse>({ method: 'GET', url: '/api/competition', params }),

  getCompetitionDetail: (id: number) =>
    request<ApiResponse<CompetitionRule[]>>({ method: 'GET', url: `/api/competition/${id}` }),
  // 院校管理模块
  getUniversities: () => request<UniversityListResponse>({ method: 'GET', url: '/api/university' }),

  toggleFavoriteUniversity: (universityId: number) =>
    request<ApiResponse<null>>({
      method: 'POST',
      url: '/api/university/toggle',
      data: { universityId },
    }),

  checkUniversityFavorite: (universityId: number) =>
    request<UniversityCheckResponse>({
      method: 'GET',
      url: '/api/university/check',
      params: { universityId },
    }),

  getFavoriteUniversityIds: () =>
    request<UniversityIdsResponse>({ method: 'GET', url: '/api/university/university-ids' }),

  getFavoriteUniversities: () =>
    request<UniversityListDetailResponse>({ method: 'GET', url: '/api/university/list' }),

  getUniversityFavoriteCount: (universityId: number) =>
    request<UniversityCountResponse>({
      method: 'GET',
      url: '/api/university/count',
      params: { universityId },
    }),
  getPendingTasks: () =>
    request<ApiResponse<ReviewItem[]>>({
      method: 'GET',
      url: '/api/study/tasks/pending',
    }),

  getTodayTasks: () =>
    request<ApiResponse<ReviewItem[]>>({
      method: 'GET',
      url: '/api/study/tasks/today',
    }),

  getOverdueTasks: () =>
    request<ApiResponse<ReviewItem[]>>({
      method: 'GET',
      url: '/api/study/tasks/overdue',
    }),

  completeTask: (id: number) =>
    request<ApiResponse<ReviewItem>>({
      method: 'POST',
      url: `/api/study/tasks/${id}/complete`,
    }),

  updateProgress: (data: Partial<LearningProgress>) =>
    request<ApiResponse<LearningProgress>>({
      method: 'POST',
      url: '/api/learning-progress/update',
      data,
    }),

  getExamCountdowns: () => request<ExamCountdown>({ method: 'GET', url: '/api/exams' }),
}

// 流式请求方法
export const askQuestionStream = async (params: {
  question: string
  file?: File
  sessionId?: string
}): Promise<ReadableStream<Uint8Array> | null> => {
  const token = localStorage.getItem('userToken') || localStorage.getItem('token') || ''

  const formData = new FormData()
  formData.append('question', params.question)
  if (params.sessionId) {
    formData.append('sessionId', params.sessionId)
  }
  if (params.file) {
    formData.append('file', params.file)
  }
  formData.append('stream', 'true')

  try {
    const response = await fetch('/ai/chat/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.body
  } catch (error) {
    console.error('流式请求失败:', error)
    throw error
  }
}

// 导出axios实例供其他地方使用
export default service
