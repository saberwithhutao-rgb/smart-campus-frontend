// src/types/sports.ts

/**
 * 场馆类型
 */
export interface Venue {
  id: number
  venueType: string // basketball, badminton, tennis, tabletennis, volleyball
  venueName: string
  totalCourts: number
  description?: string
  createdAt?: string
  updatedAt?: string
}

/**
 * 场地类型
 */
export interface Court {
  id: number
  venueId: number
  courtCode: string // 场地编号，如 "A01"
  status: 'available' | 'reserved' | 'occupied'
  createdAt?: string
  updatedAt?: string
  venue?: Venue
}

/**
 * 预约类型
 */
export interface Reservation {
  id: number
  userId: number
  userName: string
  isOwner: boolean
  courtId: number
  venueId: number
  reserveDate: string // YYYY-MM-DD
  startTime: string // HH:MM
  duration: number // 分钟
  endTime: string // HH:MM
  type: string
  status: 'active' | 'cancelled' | 'completed'
  createdAt?: string
  actualEndTime?: string | null
  actualDuration?: number | null
  version?: number
  court?: Court
  venue?: Venue
}

/**
 * 创建预约请求参数
 */
export interface CreateReservationParams {
  courtId: number
  venueId: number
  reserveDate: string // YYYY-MM-DD
  startTime: string // HH:MM
  duration: number // 分钟
  endTime: string // HH:MM
}

/**
 * API 响应包装类型
 */
export interface ApiResponse<T> {
  code: number
  message?: string
  msg?: string
  data: T
}
