// 用户类型定义
export interface User {
  id: number
  username: string
  email: string
  gender: number
  genderText?: string // 前端计算的显示文本
  avatarUrl?: string
  avatar?: string // 默认头像URL
  status: number
  statusText?: string // 前端计算的显示文本
  role: string
  studentId?: string
  major?: string
  college?: string
  grade?: string
  createdAt: string
  lastLoginAt?: string
  metadata?: Record<string, any>
}

export interface UserInfo {
  id: number
  username: string
  email: string
  gender: number
  genderText?: string
  avatarUrl?: string
  avatar?: string
  status: number
  statusText?: string
  role: string
  studentId?: string
  major?: string
  college?: string
  grade?: string
  createdAt: string
  lastLoginAt?: string
  metadata?: Record<string, any>
}

// 扩展的用户类型，包含更多属性
export interface ExtendedUser {
  id: string
  email: string
  password: string
  token: string
  refreshToken: string
  role: string
  username: string
  userId: number
  createdAt: string
}

// 用户状态类型
// 前端存储的用户状态
export interface UserState {
  isLoggedIn: boolean
  userInfo: {
    token: string
    refreshToken?: string
    role: string
    username: string
    userId: number
    email?: string
    avatar?: string
    studentId?: string
    major?: string
    college?: string
  } | null
}

// 登录表单类型
export interface LoginForm {
  username: string
  password: string
  captcha: string
  captchaId: string
}

// 注册表单类型
export interface RegisterForm {
  username: string
  password: string
  email: string
  verifyCode: string
}

// API 响应类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 验证码类型
export type CaptchaResponse =
  | string
  | { id: string; code: string }
  | { captchaId: string; imageBase64: string; message: string }

// 登录响应类型
// 后端返回的用户数据结构
export interface LoginResponse {
  code: number
  message: string
  data: {
    token: string
    refreshToken?: string
    user: UserInfo
  }
}

// 认证相关类型
export interface LoginParams {
  username: string
  password: string
  captcha: string
  captchaId?: string
}

export interface RegisterParams {
  username: string
  password: string
  email: string
  verifyCode: string
}

// 学习计划相关类型
export interface StudyPlan {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  status: 'planning' | 'in_progress' | 'completed'
  subjects: string[]
  progress: number
}

// 智能问答相关类型
export interface QaMessage {
  id: string
  question: string
  answer: string
  timestamp: string
  isUser: boolean
}

// 文件上传相关类型
export interface FileItem {
  id: string
  name: string
  url: string
  type: string
  size: number
  uploadTime: string
}

// 学习进度相关类型
export interface LearningProgress {
  subject: string
  completed: number
  total: number
  percentage: number
}
