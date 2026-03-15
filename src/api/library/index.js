// 导出所有图书馆相关接口
import { getFloors } from './floor'
import { getClassroomsByFloor, createReservation } from './reservation'
import { getSeatsByClassroom } from './seat'

export {
  getFloors,
  getClassroomsByFloor,
  getSeatsByClassroom,
  createReservation
}
