import request from '@/utils/request'

/**
 * 查询所有楼层
 * @returns {Promise<Array>} 楼层列表
 */
export const getFloors = () => {
  return request({
    url: '/library/floors',
    method: 'GET'
  })
}

/**
 * 根据楼层查教室
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
    method: 'GET'
  })
}