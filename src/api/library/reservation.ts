// src/api/library/reservation.ts
import request from '@/utils/request'
import type { Classroom, Floor } from './floor'

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
export interface ReservationData {
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

export interface ReservationData {
  userId: number
  seatId: number
  classroomId: number
  reserveDate: string // YYYY-MM-DD
  startTime: string // HH:MM
  duration: number // 分钟
  endTime: string // HH:MM
  type: string
}

export interface Reservation {
  id: number
  userId: number
  seatId: number
  classroomId: number
  reserveDate: string
  startTime: string
  endTime: string
  status: string
  type: string
}

// API 函数
export const getFloors = (): Promise<{ code: number; data: Floor[] }> => {
  return request({
    url: '/api/library/floors',
    method: 'GET',
  })
}

export const getClassroomsByFloor = (
  floorId: number,
): Promise<{ code: number; data: Classroom[] }> => {
  if (!floorId || typeof floorId !== 'number') {
    return Promise.reject(new Error('楼层 ID 必须是数字'))
  }

  return request({
    url: `/api/library/classrooms/floor/${floorId}`,
    method: 'GET',
  })
}

export const getSeatsByClassroom = (
  classroomId: number,
): Promise<{ code: number; data: Seat[] }> => {
  if (!classroomId || typeof classroomId !== 'number') {
    return Promise.reject(new Error('教室 ID 必须是数字'))
  }

  return request({
    url: `/api/library/seats/classroom/${classroomId}`,
    method: 'GET',
  })
}

export const createReservation = (
  data: ReservationData,
): Promise<{ code: number; data: Reservation; msg?: string }> => {
  if (!data || typeof data !== 'object') {
    return Promise.reject(new Error('预约数据必须是对象'))
  }

  const requiredFields: (keyof ReservationData)[] = [
    'userId',
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

  return request({
    url: '/api/library/reservations',
    method: 'POST',
    data,
  })
}

export const occupySeat = (reservationId: number): Promise<{ code: number; data: null }> => {
  if (!reservationId || typeof reservationId !== 'number') {
    return Promise.reject(new Error('预约 ID 必须是数字'))
  }

  return request({
    url: `/api/library/reservations/${reservationId}/occupy`,
    method: 'POST',
  })
}

export const cancelReservation = (reservationId: number): Promise<{ code: number; data: null }> => {
  if (!reservationId || typeof reservationId !== 'number') {
    return Promise.reject(new Error('预约 ID 必须是数字'))
  }

  return request({
    url: `/api/library/reservations/${reservationId}/cancel`,
    method: 'POST',
  })
}

export const getUserReservations = (): Promise<{ code: number; data: Reservation[] }> => {
  return request({
    url: `/api/library/reservations/user`,
    method: 'GET',
  })
}
