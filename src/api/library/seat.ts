// src/api/library/seat.ts
import request from '@/utils/request'
import type { Seat, AvailableSeatsDTO } from '@/types/library'

/**
 * 根据教室ID获取座位列表
 */
export const getSeatsByClassroom = async (classroomId: number): Promise<Seat[]> => {
  if (!classroomId || typeof classroomId !== 'number') {
    throw new Error('教室ID必须是数字')
  }

  const response = await request({
    url: `/library/seats/classroom/${classroomId}`,
    method: 'GET',
  })
  return response as unknown as Seat[]
}

/**
 * 获取教室可用座位数
 */
export const getClassroomAvailableSeats = async (
  classroomId: number,
): Promise<AvailableSeatsDTO> => {
  if (!classroomId || typeof classroomId !== 'number') {
    throw new Error('教室ID必须是数字')
  }

  const response = await request({
    url: `/library/classrooms/${classroomId}/available-seats`,
    method: 'GET',
  })
  return response as unknown as AvailableSeatsDTO
}
