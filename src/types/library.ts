// src/types/library.ts

/**
 * 楼层类型
 */
export interface Floor {
  id: number
  floorNum: number
  description?: string
}

/**
 * 教室类型
 */
export interface Classroom {
  id: number
  floorId: number
  classroomName: string
  seatCount: number
  floor?: Floor
  availableSeats?: number | null // 前端扩展字段
  totalSeats?: number | null // 前端扩展字段
  occupancyRate?: number // 前端扩展字段
  name?: string // 兼容字段
}

/**
 * 座位类型
 */
export interface Seat {
  id: number
  classroomId: number
  seatCode: string
  status: 'available' | 'reserved' | 'occupied'
  classroom?: Classroom
}
/**
 * 预约类型
 */
export interface Reservation {
  id: number
  userId: number
  seatId: number
  classroomId: number
  reserveDate: string
  startTime: string
  duration: number
  endTime: string
  type: 'reservation' | 'occupation'
  status: 'active' | 'completed' | 'cancelled' | 'replaced'
  createdAt: string
  actualEndTime?: string | null
  actualDurationMinutes?: number | null
  version?: number
  seat?: Seat
  classroom?: Classroom
}

/**
 * 预约创建参数
 */
export interface CreateReservationParams {
  seatId: number
  classroomId: number
  reserveDate: string // YYYY-MM-DD
  startTime: string // HH:MM
  duration: number // 分钟
  endTime: string // HH:MM
  type: string
}

/**
 * 可用座位响应
 */
export interface AvailableSeatsDTO {
  totalSeats: number
  usedSeats: number
  availableSeats: number
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

export interface TimeSlot {
  id: number
  label: string
  start: string
}
