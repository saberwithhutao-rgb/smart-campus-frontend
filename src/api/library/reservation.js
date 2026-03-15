import request from '@/utils/request'

/**
 * 获取楼层列表
 * @returns {Promise<Array>} 楼层列表
 */
export const getFloors = () => {
  return request({
    url: '/api/library/floors',
    method: 'GET',
  })
}

/**
 * 获取教室列表
 * @param {number} floorId 楼层ID
 * @returns {Promise<Array>} 教室列表
 */
export const getClassroomsByFloor = (floorId) => {
  // 参数校验
  if (!floorId || typeof floorId !== 'number') {
    return Promise.reject(new Error('楼层ID必须是数字'))
  }

  return request({
    url: `/library/classrooms/floor/${floorId}`,
    method: 'GET',
  })
}

/**
 * 获取座位列表
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
    method: 'GET',
  })
}

/**
 * 创建预约
 * @param {Object} data 预约数据
 * @param {number} data.userId 用户ID
 * @param {number} data.seatId 座位ID
 * @param {number} data.classroomId 教室ID
 * @param {string} data.reserveDate 预约日期（格式：YYYY-MM-DD）
 * @param {string} data.startTime 开始时间（格式：HH:MM）
 * @param {number} data.duration 预约时长（分钟）
 * @param {string} data.endTime 结束时间（格式：HH:MM）
 * @param {string} data.type 预约类型
 * @returns {Promise<Object>} 预约信息
 */
export const createReservation = (data) => {
  // 参数校验
  if (!data || typeof data !== 'object') {
    return Promise.reject(new Error('预约数据必须是对象'))
  }

  const requiredFields = [
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

/**
 * 占用座位
 * @param {number} reservationId 预约ID
 * @returns {Promise<null>} 无返回数据
 */
export const occupySeat = (reservationId) => {
  // 参数校验
  if (!reservationId || typeof reservationId !== 'number') {
    return Promise.reject(new Error('预约ID必须是数字'))
  }

  return request({
    url: `/library/reservations/${reservationId}/occupy`,
    method: 'POST',
  })
}

/**
 * 取消预约
 * @param {number} reservationId 预约ID
 * @returns {Promise<null>} 无返回数据
 */
export const cancelReservation = (reservationId) => {
  // 参数校验
  if (!reservationId || typeof reservationId !== 'number') {
    return Promise.reject(new Error('预约ID必须是数字'))
  }

  return request({
    url: `/library/reservations/${reservationId}/cancel`,
    method: 'POST',
  })
}

/**
 * 查询用户预约
 * @param {number} userId 用户ID
 * @returns {Promise<Array>} 预约列表
 */
export const getUserReservations = (userId) => {
  // 参数校验
  if (!userId || typeof userId !== 'number') {
    return Promise.reject(new Error('用户ID必须是数字'))
  }

  return request({
    url: `/library/reservations/user/${userId}`,
    method: 'GET',
  })
}
