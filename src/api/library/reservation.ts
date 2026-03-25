// src/api/library/reservation.ts
import request from '@/utils/request'
import type { Classroom, Floor } from '@/types/library'

// 座位类型
export interface Seat {
  id: number
  classroomId: number
  seatCode: string
  status: 'available' | 'occupied' | 'reserved'
  classroom?: Classroom
}

// 预约类型
export interface Reservation {
  id: number
  userId: number
  seatId: number
  classroomId: number
  reserveDate: string
  startTime: string
  duration: number
  endTime: string
  type: string
  status: string
  createdAt: string
  actualEndTime?: string | null
  actualDurationMinutes?: number | null
  seat?: Seat
  classroom?: Classroom
}

// 预约数据 DTO（用于创建预约）
export interface CreateReservationParams {
  seatId: number
  classroomId: number
  reserveDate: string
  startTime: string
  duration: number
  endTime: string
  type: string
}

// 可用座位数 DTO
export interface AvailableSeatsDTO {
  totalSeats: number
  usedSeats: number
  availableSeats: number
}

// ==================== API 函数 ====================

/**
 * 获取所有楼层
 */
export const getFloors = async (): Promise<Floor[]> => {
  const response = await request({
    url: '/library/floors',
    method: 'GET',
  })
  return response as unknown as Floor[]
}

/**
 * 根据楼层获取教室列表
 */
export const getClassroomsByFloor = async (floorId: number): Promise<Classroom[]> => {
  if (!floorId || typeof floorId !== 'number') {
    return Promise.reject(new Error('楼层 ID 必须是数字'))
  }

  const response = await request({
    url: `/library/classrooms/floor/${floorId}`,
    method: 'GET',
  })
  return response as unknown as Classroom[]
}

/**
 * 根据教室获取座位列表
 */
export const getSeatsByClassroom = async (classroomId: number): Promise<Seat[]> => {
  if (!classroomId || typeof classroomId !== 'number') {
    return Promise.reject(new Error('教室 ID 必须是数字'))
  }

  const response = await request({
    url: `/library/seats/classroom/${classroomId}`,
    method: 'GET',
  })
  return response as unknown as Seat[]
}

/**
 * 创建预约
 */
export const createReservation = async (data: CreateReservationParams): Promise<Reservation> => {
  const requiredFields: (keyof CreateReservationParams)[] = [
    'seatId',
    'classroomId',
    'reserveDate',
    'startTime',
    'duration',
    'endTime',
    'type',
  ]
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      return Promise.reject(new Error(`缺少必填字段：${field}`))
    }
  }

  const response = await request({
    url: '/library/reservations',
    method: 'POST',
    data,
  })
  return response as unknown as Reservation
}

/**
 * 占用座位
 */
export const occupySeat = async (reservationId: number): Promise<void> => {
  if (!reservationId || typeof reservationId !== 'number') {
    return Promise.reject(new Error('预约 ID 必须是数字'))
  }

  await request({
    url: `/library/reservations/${reservationId}/occupy`,
    method: 'POST',
  })
}

/**
 * 取消预约
 */
export const cancelReservation = async (reservationId: number): Promise<void> => {
  if (!reservationId || typeof reservationId !== 'number') {
    return Promise.reject(new Error('预约 ID 必须是数字'))
  }

  await request({
    url: `/library/reservations/${reservationId}/cancel`,
    method: 'POST',
  })
}

/**
 * 获取当前用户的预约列表
 */
export const getUserReservations = async (): Promise<Reservation[]> => {
  const response = await request({
    url: '/library/reservations/user',
    method: 'GET',
  })
  return response as unknown as Reservation[]
}

/**
 * 获取座位的预约列表
 */
export const getSeatReservations = async (seatId: number): Promise<Reservation[]> => {
  if (!seatId || typeof seatId !== 'number') {
    return Promise.reject(new Error('座位 ID 必须是数字'))
  }

  const response = await request({
    url: `/library/reservations/seat/${seatId}`,
    method: 'GET',
  })
  return response as unknown as Reservation[]
}

/**
 * 获取教室的可用座位数
 */
export const getClassroomAvailableSeats = async (
  classroomId: number,
): Promise<AvailableSeatsDTO> => {
  if (!classroomId || typeof classroomId !== 'number') {
    return Promise.reject(new Error('教室 ID 必须是数字'))
  }

  const response = await request({
    url: `/library/classrooms/${classroomId}/available-seats`,
    method: 'GET',
  })
  return response as unknown as AvailableSeatsDTO
}

export const leaveSeatAPI = async (reservationId: number): Promise<void> => {
  if (!reservationId || typeof reservationId !== 'number') {
    return Promise.reject(new Error('预约 ID 必须是数字'))
  }

  await request({
    url: `/library/reservations/${reservationId}/leave`,
    method: 'POST',
  })
}
