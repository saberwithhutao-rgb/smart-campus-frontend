// src/api/library/floor.d.ts

// 楼层类型
export interface Floor {
  id: number
  floorNum: number
  description?: string
}

// 教室类型
export interface Classroom {
  id: number
  classroomName: string
  floorId: number
  seatCount: number
  floor?: Floor
  availableSeats?: number | null
  totalSeats?: number | null
  occupancyRate?: number
}
/**
 * 获取楼层列表
 * @returns 楼层列表 Promise
 */
export function getFloors(): Promise<Floor[]>

/**
 * 根据楼层 ID 获取教室列表
 * @param floorId - 楼层 ID
 * @returns 教室列表 Promise
 */
export function getClassroomsByFloor(floorId: number): Promise<Classroom[]>
