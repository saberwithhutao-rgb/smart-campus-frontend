// src/api/library/floor.d.ts

/**
 * 楼层信息接口
 */
export interface Floor {
  /** 楼层 ID */
  id: number
  /** 楼层编号 */
  floorNum: number
  /** 楼层名称（可选） */
  name?: string
}

/**
 * 教室信息接口
 */
export interface Classroom {
  /** 教室 ID */
  id: number
  /** 教室名称 */
  classroomName?: string
  /** 教室名称备用字段 */
  name?: string
  /** 所属楼层 ID */
  floorId: number
  /** 总座位数 */
  totalSeats?: number
  /** 可用座位数 */
  availableSeats?: number
  /** 占用率 */
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
