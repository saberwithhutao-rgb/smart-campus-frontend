// src/api/sports/index.ts
import request from '@/utils/request'
import type {
  Venue,
  Court,
  Reservation,
  CreateReservationParams,
  ApiResponse,
} from '@/types/sports'

// 查询所有场馆
export const getVenues = async (): Promise<Venue[]> => {
  const response = await request({
    url: '/sports/venues',
    method: 'GET',
  })
  return response as unknown as Venue[]
}

// 根据场馆查场地
export const getCourtsByVenue = async (venueId: number): Promise<Court[]> => {
  if (!venueId || typeof venueId !== 'number') {
    return Promise.reject(new Error('场馆ID必须是数字'))
  }
  const response = await request({
    url: `/sports/courts/venue/${venueId}`,
    method: 'GET',
  })
  return (response as unknown as Court[]) || []
}

// 创建预约
export const createReservation = async (
  data: CreateReservationParams,
): Promise<ApiResponse<Reservation>> => {
  const requiredFields: (keyof CreateReservationParams)[] = [
    'courtId',
    'venueId',
    'reserveDate',
    'startTime',
    'duration',
    'endTime',
  ]
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      return Promise.reject(new Error(`缺少必填字段：${field}`))
    }
  }
  return request({
    url: '/sports/reservations',
    method: 'POST',
    data,
  })
}

// 占用场地
export const occupyReservation = async (reservationId: number): Promise<ApiResponse<null>> => {
  if (!reservationId || typeof reservationId !== 'number') {
    return Promise.reject(new Error('预约ID必须是数字'))
  }
  return request({
    url: `/sports/reservations/${reservationId}/occupy`,
    method: 'POST',
  })
}

// 离开场地
export const leaveReservation = async (reservationId: number): Promise<ApiResponse<null>> => {
  if (!reservationId || typeof reservationId !== 'number') {
    return Promise.reject(new Error('预约ID必须是数字'))
  }
  return request({
    url: `/sports/reservations/${reservationId}/leave`,
    method: 'POST',
  })
}

// 查询用户预约记录
export const getUserReservations = async (): Promise<Reservation[]> => {
  const response = await request({
    url: '/sports/reservations/user',
    method: 'GET',
  })
  return (response as unknown as Reservation[]) || []
}

// 查询场地当前预约
export const getCourtReservations = async (courtId: number): Promise<Reservation[]> => {
  if (!courtId || typeof courtId !== 'number') {
    return Promise.reject(new Error('场地ID必须是数字'))
  }
  const response = await request({
    url: `/sports/reservations/court/${courtId}`,
    method: 'GET',
  })
  return (response as unknown as Reservation[]) || []
}
