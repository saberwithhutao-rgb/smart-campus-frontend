import request from '@/utils/request'

/**
 * 根据教室查座位
 * @param {number} classroomId 教室ID
 * @returns {Promise<Array>} 座位列表
 */
export const getSeatsByClassroom = (classroomId) => {
  // 参数校验
  if (!classroomId || typeof classroomId !== 'number') {
    return Promise.reject(new Error('教室ID必须是数字'))
  }

  return request({
    url: `/library/seats/classroom/${classroomId}`,
    method: 'GET'
  })
}