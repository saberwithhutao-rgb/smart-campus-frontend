<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import GlobalNavbar from '@/components/GlobalNavbar.vue'
import { useUserStore } from '@/stores/user'
import { useReservationCount } from '@/composables/useReservationCount'
import type {
  Floor,
  Classroom,
  Seat,
  Reservation,
  CreateReservationParams,
  AvailableSeatsDTO,
  TimeSlot,
} from '@/types/library'
import { getFloors } from '@/api/library/floor'
import { getClassroomsByFloor } from '@/api/library/reservation'
import request from '@/utils/request'

// ==================== 响应式数据 ====================
const userStore = useUserStore()
const {
  isLoading: isCountLoading,
  isAtMaxLimit,
  fetchActiveReservationCount,
  checkReservationLimit,
} = useReservationCount()

const currentFloor = ref<Floor | null>(null)
const selectedRoom = ref<string>('')
const selectedClassroom = ref<Classroom | null>(null)
const selectedDate = ref<Date>(new Date())
const selectedSeats = ref<string[]>([])
const isConfirmDialogVisible = ref(false)
const leaveDialogVisible = ref(false)
const currentSeat = ref<Seat | null>(null)
const currentClassroomName = ref('')
const seatDetailDialogVisible = ref(false)
const currentSeatDetails = ref<Seat | null>(null)
const currentSeatReservations = ref<Reservation[]>([])
const hasActiveReservation = ref(false)
const seatReservationCounts = ref<Record<string, number>>({})
const occupyDialogVisible = ref(false)
const currentOccupyReservationId = ref<number>(0)

const isLoading = ref(false)
const reservationInfo = ref({
  date: '',
  time: '',
  seats: [] as string[],
  duration: 2,
  room: '',
})

// 座位使用状态管理
const seatUsageInfo = ref<
  Map<
    string,
    {
      isUsing: boolean
      hasEntered: boolean
      enterTime: number
      duration: number
      timer: number | null
    }
  >
>(new Map())

// 楼层列表
const floors = ref<Floor[]>([])

// 座位列表
const rooms = ref<Classroom[]>([])
const seats = ref<Seat[]>([])

// 获取当前登录用户ID
const currentUserId = computed(() => {
  return userStore.userState.userInfo?.userId
})

// 所有教室的座位数据
const roomSeats = ref<Record<string, Record<string, SeatStatus>>>({})

// 获取当前教室的座位
const currentRoomSeats = computed(() => {
  if (!selectedRoom.value) return {}
  return roomSeats.value[selectedRoom.value] || {}
})

// 活跃预约
const activeReservation = ref<Reservation | null>(null)

// 组件挂载时，初始化数据
onMounted(async () => {
  try {
    const floorList = await getFloors()
    console.log('获取到的楼层列表:', floorList)

    // 对楼层列表按楼层编号排序
    floors.value = (floorList || []).sort((a, b) => {
      const floorA = Number(a.floorNum || a.id)
      const floorB = Number(b.floorNum || b.id)
      return floorA - floorB
    })

    console.log('排序后的楼层列表:', floors.value)

    // 初始加载第一层的教室
    const firstFloor = floors.value[0]
    if (firstFloor) {
      // ✅ 先检查是否存在
      currentFloor.value = firstFloor

      // 从 floor 对象中提取楼层ID
      const floorId = Number(firstFloor.id || firstFloor.floorNum)

      // 校验转换结果
      if (isNaN(floorId)) {
        console.error('初始化楼层ID转换失败:', firstFloor.id || firstFloor.floorNum)
        ElMessage.error('初始化失败，请刷新页面')
        return
      }

      console.log('初始化加载楼层ID:', floorId)
      await loadClassrooms(floorId)
    } else {
      // 如果没有楼层数据，默认加载1楼
      currentFloor.value = { id: 1, floorNum: 1 }
      console.log('默认加载楼层ID: 1')
      await loadClassrooms(1)
    }

    // 检查用户活跃状态
    await checkUserActiveStatus()
    // 查询用户活跃预约数量
    await fetchActiveReservationCount()

    // 刷新教室数据
    await refreshAllClassroomData()
  } catch (error) {
    console.error('初始化数据失败:', error)
    ElMessage.error('获取数据失败，请刷新页面重试')
    // 即使出错也要设置默认楼层，避免后续计算属性报错
    if (!currentFloor.value) {
      currentFloor.value = { id: 1, floorNum: 1 }
    }
  }
})

const checkUserActiveStatus = async () => {
  try {
    console.log('查询用户活跃状态')

    const reservations = (await request({
      url: '/library/reservations/user',
      method: 'GET',
    })) as Reservation[]

    console.log('用户预约记录:', reservations)

    const activeList = reservations.filter((item: Reservation) => item.status === 'active')
    hasActiveReservation.value = activeList.length > 0
    activeReservation.value = activeList[0] || null
    console.log('用户活跃状态:', hasActiveReservation.value)
    console.log('用户活跃预约:', activeReservation.value)
  } catch (error) {
    console.error('调用查询用户预约记录接口失败:', error)
    hasActiveReservation.value = false
    activeReservation.value = null
  }
}

// 加载教室列表
const loadClassrooms = async (floorId: number | string) => {
  try {
    // 确保 floorId 是数字类型
    const numericFloorId = Number(floorId)
    if (isNaN(numericFloorId)) {
      console.error('楼层ID格式错误:', floorId)
      ElMessage.error('楼层ID格式错误')
      return
    }

    console.log('加载教室 - 楼层ID:', numericFloorId)
    const classroomList = await getClassroomsByFloor(numericFloorId)

    rooms.value = classroomList.map((room) => ({
      ...room,
      // 初始化为 null，等待 available-seats 接口返回
      availableSeats: null,
      totalSeats: null,
      // 初始化为 0，等待 available-seats 接口返回
      occupancyRate: 0,
    }))

    console.log('修正后的教室数据:', rooms.value)

    if (rooms.value.length === 0) {
      ElMessage.warning('该楼层暂无教室数据')
    }
  } catch (error) {
    console.error('加载教室失败:', error)
    ElMessage.error('获取教室数据失败')
    rooms.value = []
  }
}

// 加载座位列表
const loadSeats = async (classroomId: number) => {
  console.log('开始加载座位，教室ID:', classroomId)

  try {
    const numericClassroomId = Number(classroomId)

    const seatData = (await request({
      url: `/library/seats/classroom/${numericClassroomId}`,
      method: 'GET',
    })) as Seat[]

    seats.value = seatData

    const seatMap: Record<string, SeatStatus> = {}

    if (Array.isArray(seatData)) {
      for (const seat of seatData) {
        const seatId = `${numericClassroomId}-${seat.seatCode}`
        // 直接映射后端状态
        seatMap[seatId] = seat.status as SeatStatus
      }
    }

    const classroomKey = numericClassroomId.toString()
    roomSeats.value[classroomKey] = seatMap
  } catch (error) {
    console.error('❌ 加载座位失败:', error)
    seats.value = []
    ElMessage.error('加载座位图失败')
  }
}

// 获取当前楼层的教室
const currentFloorRooms = computed(() => {
  if (!currentFloor.value) {
    return []
  }
  const floorNumber = currentFloor.value.id || currentFloor.value.floorNum
  const floorRooms = rooms.value.filter((room) => room.floorId === floorNumber)
  return floorRooms
})

// 按空闲率排序的当前楼层教室
const sortedRooms = computed(() => {
  return [...currentFloorRooms.value].sort(
    (a, b) => (b.occupancyRate || 0) - (a.occupancyRate || 0),
  )
})

// 推荐教室（当前楼层空闲率最高的教室）
const recommendedRooms = computed(() => {
  if (!currentFloor.value) return []

  const floorNumber = currentFloor.value.id || currentFloor.value.floorNum
  const floorRooms = rooms.value.filter((room) => room.floorId === floorNumber)

  // 按空闲率排序
  const sorted = [...floorRooms].sort((a, b) => (b.occupancyRate || 0) - (a.occupancyRate || 0))

  // 取前3个作为推荐
  return sorted.slice(0, 3)
})

// 其他教室（当前楼层的教室）
const otherRooms = computed(() => {
  if (!currentFloor.value) return []

  const floorNumber = currentFloor.value.id || currentFloor.value.floorNum
  const floorRooms = rooms.value.filter((room) => room.floorId === floorNumber)
  const recommendedIds = recommendedRooms.value.map((room) => room.id)

  return floorRooms.filter((room) => !recommendedIds.includes(room.id))
})

// 切换楼层
const handleFloorChange = async (floor: Floor) => {
  try {
    // 从 floor 对象中提取楼层ID
    const floorId = Number(floor.id || floor.floorNum)

    // 校验转换结果，防止 NaN
    if (isNaN(floorId)) {
      console.error('楼层ID转换失败:', floor.id || floor.floorNum)
      ElMessage.error('楼层ID格式错误，请刷新页面')
      return
    }

    console.log('请求楼层ID(数字):', floorId)

    // 更新当前楼层
    currentFloor.value = { id: floorId, floorNum: floorId }
    selectedRoom.value = ''
    selectedClassroom.value = null
    selectedSeats.value = []

    // 调用加载教室的方法
    await loadClassrooms(floorId)

    // 刷新教室数据
    await refreshAllClassroomData()
  } catch (error) {
    console.error('切换楼层失败:', error)
    ElMessage.error('切换楼层失败，请重试')
  }
}

// 刷新教室列表
const refreshClassroomList = async () => {
  try {
    // 获取当前楼层ID
    const floorId = Number(currentFloor.value?.id || currentFloor.value?.floorNum)
    if (isNaN(floorId)) {
      console.error('刷新教室列表失败: 楼层ID无效')
      return
    }

    console.log('刷新教室列表，楼层ID:', floorId)
    await loadClassrooms(floorId)
    console.log('教室列表刷新完成')
  } catch (error) {
    console.error('刷新教室列表失败:', error)
  }
}

// 用于存储当前正在进行的请求
const currentRequests = new Map()

// 刷新所有教室数据
const refreshAllClassroomData = async () => {
  try {
    isLoading.value = true

    // 取消所有正在进行的请求
    currentRequests.forEach((controller) => {
      controller.abort()
    })
    currentRequests.clear()

    // 获取当前楼层ID
    if (!currentFloor.value) {
      console.error('刷新教室数据失败: 当前楼层未设置')
      return
    }

    const floorId = Number(currentFloor.value.id || currentFloor.value.floorNum)
    if (isNaN(floorId)) {
      console.error('刷新教室数据失败: 楼层ID无效')
      return
    }

    console.log('刷新当前楼层的教室数据，楼层ID:', floorId)

    // 获取当前楼层的教室
    const floorRooms = rooms.value.filter((room) => room.floorId === floorId)
    console.log('当前楼层的教室数量:', floorRooms.length)

    // 并行获取所有教室的可用座位数，但等待全部完成
    const promises = floorRooms.map(async (room) => {
      // 创建 AbortController 用于取消请求
      const controller = new AbortController()
      currentRequests.set(room.id, controller)

      try {
        const availableSeats = (await request({
          url: `/library/classrooms/${room.id}/available-seats`,
          method: 'GET',
        })) as AvailableSeatsDTO

        const roomIndex = rooms.value.findIndex((r) => r.id === room.id)
        if (roomIndex !== -1) {
          const targetRoom = rooms.value[roomIndex]
          if (targetRoom) {
            // 双重保险检查
            targetRoom.availableSeats = availableSeats.availableSeats
            targetRoom.totalSeats = availableSeats.totalSeats
            targetRoom.occupancyRate = availableSeats.availableSeats / availableSeats.totalSeats
          }
        }
      } catch (error) {
        console.error(`获取教室 ${room.classroomName} 数据失败:`, error)
      }
    })

    await Promise.all(promises)
  } catch (error) {
    console.error('刷新教室数据失败:', error)
  } finally {
    isLoading.value = false
  }
}

// 点击教室的方法
const handleRoomSelect = async (classroom: Classroom) => {
  try {
    // 记录选中的教室
    selectedClassroom.value = classroom
    selectedRoom.value = classroom.id.toString()
    selectedSeats.value = []

    // 调用 loadSeats 函数加载座位数据
    await loadSeats(classroom.id)
  } catch (error) {
    console.error('选择教室失败:', error)
    ElMessage.error('选择教室失败')
  }
}

// 时间段列表
const timeSlots: TimeSlot[] = [
  { id: 1, label: '07:00', start: '07:00' },
  { id: 2, label: '08:00', start: '08:00' },
  { id: 3, label: '09:00', start: '09:00' },
  { id: 4, label: '10:00', start: '10:00' },
  { id: 5, label: '11:00', start: '11:00' },
  { id: 6, label: '12:00', start: '12:00' },
  { id: 7, label: '13:00', start: '13:00' },
  { id: 8, label: '14:00', start: '14:00' },
  { id: 9, label: '15:00', start: '15:00' },
  { id: 10, label: '16:00', start: '16:00' },
  { id: 11, label: '17:00', start: '17:00' },
  { id: 12, label: '18:00', start: '18:00' },
  { id: 13, label: '19:00', start: '19:00' },
  { id: 14, label: '20:00', start: '20:00' },
  { id: 15, label: '21:00', start: '21:00' },
  { id: 16, label: '22:00', start: '22:00' },
]

const selectedTimeSlot = ref(2) // 默认选中的时间
const maxDuration = ref(4) // 最大可预约时长

// 监听预约时间变化，动态计算最大可预约时长
watch(selectedTimeSlot, (newSlotId) => {
  const selectedSlot = timeSlots.find((slot) => slot.id === newSlotId)
  if (selectedSlot) {
    const startHour = parseInt(selectedSlot.start!.split(':')[0]) //不合理的报错
    const newMaxDuration = Math.min(4, 23 - startHour)
    if (reservationInfo.value.duration > newMaxDuration) {
      reservationInfo.value.duration = newMaxDuration
      ElMessage.info(`当前开始时间最多可预约${newMaxDuration}小时，已为您自动调整`)
    }
    maxDuration.value = newMaxDuration
  }
})

// 座位状态类型
type SeatStatus = 'available' | 'occupied' | 'selected' | 'podium' | 'door' | 'empty' | 'reserved'

// 获取座位的显示标签
const getSeatLabel = (seatId: string): string => {
  const parts = seatId.split('-')
  if (parts.length === 3) {
    return parts[2] || seatId
  } else if (parts.length === 4) {
    const row = parseInt(parts[2] || '0')
    const col = parseInt(parts[3] || '0')
    const rowLabel = String.fromCharCode(64 + row)
    return `${rowLabel}${col}`
  }
  return seatId
}

// 按行分组座位
const groupSeatsByRow = () => {
  const seats = currentRoomSeats.value
  const grouped: Record<string, string[]> = {}

  Object.keys(seats).forEach((seatId) => {
    const parts = seatId.split('-')
    if (parts.length >= 3) {
      // 格式: roomId-seatCode (如 A1, B2)
      const seatCode = parts[2]
      // 添加非空检查
      if (seatCode) {
        // 提取行标签 (如 A, B)
        const rowLabel = seatCode.match(/[A-Za-z]+/)?.[0] || 'Unknown'
        if (!grouped[rowLabel]) {
          grouped[rowLabel] = []
        }
        grouped[rowLabel].push(seatId)
      }
    }
  })

  // 按行标签排序
  const sorted: Record<string, string[]> = {}
  Object.keys(grouped)
    .sort()
    .forEach((rowLabel) => {
      // 确保数组存在
      const rowSeats = grouped[rowLabel]
      if (rowSeats) {
        // 按座位编码排序
        rowSeats.sort()
        sorted[rowLabel] = rowSeats
      }
    })

  return sorted
}

// 获取最大列数
const getMaxColumn = () => {
  const seats = currentRoomSeats.value
  let maxColumn = 0

  Object.keys(seats).forEach((seatId) => {
    const parts = seatId.split('-')
    if (parts.length >= 3) {
      // 格式: roomId-seatCode (如 A1, B2)
      const seatCode = parts[2]
      // 添加非空检查
      if (seatCode) {
        // 提取列号 (如 1, 2)
        const column = parseInt(seatCode.match(/\d+/)?.[0] || '0')
        if (column > maxColumn) {
          maxColumn = column
        }
      }
    }
  })

  return maxColumn
}

// 获取座位状态类名
const getSeatClass = (status: SeatStatus) => {
  const baseClass = 'seat'
  switch (status) {
    case 'available':
      return `${baseClass} available`
    case 'occupied':
    case 'reserved':
      return `${baseClass} occupied`
    case 'selected':
      return `${baseClass} selected`
    case 'podium':
      return `${baseClass} podium`
    case 'door':
      return `${baseClass} door`
    case 'empty':
      return `${baseClass} empty`
    default:
      return baseClass
  }
}

// 获取教室占用率颜色
const getOccupancyColor = (rate: number) => {
  if (rate >= 0.7) return '#52c41a' // 绿色 - 空闲多
  if (rate >= 0.4) return '#faad14' // 橙色 - 中等
  return '#f5222d' // 红色 - 空闲少
}

// 获取教室状态文字
const getRoomStatusText = (rate: number) => {
  if (rate >= 0.7) return '空闲'
  if (rate >= 0.4) return '适中'
  return '紧张'
}

// 点击座位
const handleSeatClick = async (seatId: string, status: SeatStatus) => {
  if (!selectedRoom.value) {
    ElMessage.warning('请先选择教室')
    return
  }

  if (status === 'podium' || status === 'door' || status === 'empty') {
    ElMessage.info('这是固定设施，无法选择')
    return
  }

  // 从座位ID中提取座位代码
  const parts = seatId.split('-')
  let seatCode = '未知座位'

  if (parts.length >= 2 && parts[1] !== undefined) {
    // 格式: roomId-seatCode
    seatCode = parts[1]
  } else if (parts.length >= 3 && parts[2] !== undefined) {
    // 备选方案：如果是 roomId-seatNumber 格式
    seatCode = parts[2]
  }

  // 获取教室信息
  const classroom = rooms.value.find((r) => r.id === parseInt(selectedRoom.value))
  const classroomName = classroom?.classroomName || classroom?.name || '未知教室'
  currentClassroomName.value = classroomName

  // 获取座位详情和预约列表
  await getSeatDetails(seatCode)

  // 弹出座位详情弹窗
  seatDetailDialogVisible.value = true
}

// 根据座位ID查询预约记录
const getReservationBySeatId = async (seatId: number) => {
  try {
    console.log('查询座位预约记录，座位ID:', seatId)

    // 从座位数据中查找座位信息
    const currentSeat = seats.value.find((seat) => seat.id === seatId)

    if (!currentSeat) {
      console.log('未找到座位')
      return null
    }

    // ✅ 调用后端接口获取该座位的预约记录
    const reservations = (await request({
      url: `/library/reservations/seat/${seatId}`,
      method: 'GET',
    })) as Reservation[]

    // 找到状态为 active 的预约
    const activeReservation = reservations.find((reservation) => reservation.status === 'active')

    if (activeReservation) {
      console.log('找到有效预约:', activeReservation)
      return activeReservation
    }

    console.log('未找到预约记录')
    return null
  } catch (error: unknown) {
    console.error('查询预约记录失败:', error)
    return null
  }
}

// 占用座位
const handleOccupySeat = async (reservationId: number) => {
  try {
    // 检查用户是否达到最大预约数量
    if (!checkReservationLimit()) {
      return
    }

    console.log('调用占用座位接口，参数:', { reservationId })

    // 调用占用座位接口（userId 从 token 获取，不需要传）
    await request({
      url: `/library/reservations/${reservationId}/occupy`,
      method: 'POST',
    })

    ElMessage.success('占用座位成功！')

    // 刷新座位列表
    await loadSeats(parseInt(selectedRoom.value))
    // 更新用户活跃状态
    await checkUserActiveStatus()
    // 更新用户活跃预约数量
    await fetchActiveReservationCount()
  } catch (error) {
    console.error('占用座位异常:', error)
    ElMessage.error('系统内部错误，请稍后重试')
  }
}

// 检查用户是否正在使用座位
const checkUserHasActiveSeat = () => {
  for (const [seatId, usage] of seatUsageInfo.value) {
    if (usage.isUsing && usage.hasEntered) {
      return seatId
    }
  }
  return null
}

// 直接入座功能
const directSeatIn = (seatId: string) => {
  if (!selectedRoom.value) return

  // 检查用户是否正在使用其他座位
  const activeSeat = checkUserHasActiveSeat()
  if (activeSeat) {
    ElMessage.warning(`您正在使用座位 ${getSeatLabel(activeSeat)}，请先离开该座位再进入新座位`)
    return
  }

  ElMessageBox.confirm(
    `确认直接进入座位 ${getSeatLabel(seatId)}？<br/><br/>
    <span style="color: #52c41a; font-size: 12px;">✓ 立即进入，无需预约</span>
    <span style="color: #faad14; font-size: 12px; display: block; margin-top: 4px;">⚠ 进入后立即开始计时，时间到后系统将自动释放座位</span>`,
    '确认直接进入',
    {
      confirmButtonText: '确认进入',
      cancelButtonText: '取消',
      dangerouslyUseHTMLString: true,
      type: 'success',
    },
  )
    .then(() => {
      // 直接进入座位，开始计时
      if (selectedRoom.value && roomSeats.value[selectedRoom.value]) {
        roomSeats.value[selectedRoom.value]![seatId] = 'occupied'

        // 创建使用信息并立即开始计时
        const enterTime = Date.now()
        const duration = reservationInfo.value.duration

        seatUsageInfo.value.set(seatId, {
          isUsing: true,
          hasEntered: true,
          enterTime,
          duration,
          timer: null,
        })

        // 设置定时器，时间到自动离开
        const timer = window.setTimeout(
          () => {
            autoLeaveSeat(seatId)
          },
          duration * 60 * 60 * 1000,
        ) // 毫秒转小时

        seatUsageInfo.value.set(seatId, {
          isUsing: true,
          hasEntered: true,
          enterTime,
          duration,
          timer,
        })
      }

      const room = rooms.value.find((r) => r.id === parseInt(selectedRoom.value))
      ElMessage.success(`成功进入${room?.name || '未知教室'}座位 ${getSeatLabel(seatId)}`)
    })
    .catch(() => {
      ElMessage.info('已取消进入')
    })
}

// 进入座位
const enterSeat = (seatId: string) => {
  const usage = seatUsageInfo.value.get(seatId)
  if (!usage) {
    ElMessage.warning('座位信息不存在')
    return
  }

  if (usage.hasEntered) {
    ElMessage.warning('您已经入座了')
    return
  }

  // 检查用户是否正在使用其他座位
  const activeSeat = checkUserHasActiveSeat()
  if (activeSeat && activeSeat !== seatId) {
    ElMessage.warning(`您正在使用座位 ${getSeatLabel(activeSeat)}，请先离开该座位`)
    return
  }

  ElMessageBox.confirm(
    `确认进入座位 ${getSeatLabel(seatId)}？<br/><br/>
    <span style="color: #52c41a; font-size: 12px;">✓ 进入后开始计时</span>
    <span style="color: #faad14; font-size: 12px; display: block; margin-top: 4px;">⚠ 时间到后系统将自动释放座位</span>`,
    '确认进入座位',
    {
      confirmButtonText: '确认进入',
      cancelButtonText: '取消',
      dangerouslyUseHTMLString: true,
      type: 'success',
    },
  )
    .then(() => {
      // 开始使用座位
      const enterTime = Date.now()
      usage.hasEntered = true
      usage.isUsing = true
      usage.enterTime = enterTime

      // 设置定时器，时间到自动离开
      const timer = window.setTimeout(
        () => {
          autoLeaveSeat(seatId)
        },
        usage.duration * 60 * 60 * 1000,
      ) // 毫秒转小时

      usage.timer = timer

      seatUsageInfo.value.set(seatId, usage)

      ElMessage.success(`成功进入座位 ${getSeatLabel(seatId)}`)
    })
    .catch(() => {
      ElMessage.info('已取消进入')
    })
}

// 自动离开座位（时间到）
const autoLeaveSeat = (seatId: string) => {
  const usage = seatUsageInfo.value.get(seatId)
  if (!usage) return

  // 清除定时器
  if (usage.timer) {
    clearTimeout(usage.timer)
  }

  // 弹出提示框
  ElMessageBox.alert('您的预约时间已经到了，系统为您自动释放了座位。', '时间到提醒', {
    confirmButtonText: '我知道了',
    type: 'warning',
    center: true,
  })

  // 释放座位
  releaseSeat(seatId)
}

// 手动离开座位
const leaveSeat = (seatId: string) => {
  ElMessageBox.confirm('确定要离开座位吗？', '确认离开', {
    confirmButtonText: '确定离开',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      const usage = seatUsageInfo.value.get(seatId)
      if (usage) {
        // 计算使用时长
        const usedTime = Math.floor((Date.now() - usage.enterTime) / 1000 / 60) // 分钟
        ElMessage.success(`已离开座位，使用时长: ${usedTime} 分钟`)
      } else {
        ElMessage.success('已离开座位')
      }
      releaseSeat(seatId)
    })
    .catch(() => {
      ElMessage.info('已取消离开')
    })
}

// 释放座位
const releaseSeat = (seatId: string) => {
  const usage = seatUsageInfo.value.get(seatId)
  if (usage && usage.timer) {
    clearTimeout(usage.timer)
  }

  seatUsageInfo.value.delete(seatId)

  // 将座位状态改为可用
  if (selectedRoom.value && roomSeats.value[selectedRoom.value]) {
    roomSeats.value[selectedRoom.value]![seatId] = 'available'
  }

  // 更新教室的空闲率
  if (selectedRoom.value) {
    calculateRoomVacancyRate(selectedRoom.value)
  }
}

// 获取座位使用信息
const getSeatUsageInfo = (seatId: string) => {
  return seatUsageInfo.value.get(seatId)
}

// 获取剩余时间（分钟）
const getRemainingTime = (seatId: string) => {
  const usage = seatUsageInfo.value.get(seatId)
  if (!usage) return 0

  const elapsed = Date.now() - usage.enterTime
  const total = usage.duration * 60 * 60 * 1000
  const remaining = Math.max(0, total - elapsed)
  return Math.ceil(remaining / 1000 / 60) // 转换为分钟
}

// 格式化时间显示
const formatTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return `${hours}小时${mins}分钟`
  }
  return `${mins}分钟`
}

// 格式化日期
const formatDate = (date: Date | string | null | undefined) => {
  // 类型校验
  if (!date) {
    console.warn('formatDate: date is null or undefined')
    return ''
  }

  // 如果是字符串，转换为Date对象
  let dateObj: Date
  if (typeof date === 'string') {
    dateObj = new Date(date)
  } else {
    dateObj = date
  }

  // 检查是否是有效日期
  if (isNaN(dateObj.getTime())) {
    console.warn('formatDate: invalid date', date)
    return ''
  }

  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 确认预约
const confirmReservation = () => {
  if (!selectedRoom.value) {
    ElMessage.warning('请先选择教室')
    return
  }

  if (selectedSeats.value.length === 0) {
    ElMessage.warning('请先选择座位')
    return
  }

  const slot = timeSlots.find((t) => t.id === selectedTimeSlot.value)
  if (!slot) {
    ElMessage.error('请选择时间')
    return
  }

  const room = rooms.value.find((r) => r.id === parseInt(selectedRoom.value))

  console.log('确认预约参数:', {
    selectedDate: selectedDate.value,
    selectedTimeSlot: selectedTimeSlot.value,
    selectedSeats: selectedSeats.value,
    duration: reservationInfo.value.duration,
  })

  reservationInfo.value = {
    date: formatDate(selectedDate.value),
    time: slot.label,
    seats: selectedSeats.value.map((seatId) => getSeatLabel(seatId)),
    duration: reservationInfo.value.duration,
    room: room?.name || '',
  }

  isConfirmDialogVisible.value = true
}

// 创建预约接口
const createReservation = async (params: CreateReservationParams): Promise<Reservation> => {
  try {
    // 检查用户是否达到最大预约数量
    if (!checkReservationLimit()) {
      throw new Error('已达到最大预约数量')
    }

    console.log('调用预约接口，参数:', params)

    const reservation = (await request({
      url: '/library/reservations',
      method: 'POST',
      data: params,
    })) as Reservation

    console.log('预约接口响应:', reservation)

    ElMessage.success('预约成功！')

    // 刷新座位数据
    if (params.classroomId) {
      await loadSeats(params.classroomId)
    }

    // 更新用户活跃状态
    await checkUserActiveStatus()
    await fetchActiveReservationCount()

    // 刷新教室卡片的可用座位数
    await refreshAllClassroomData()

    return reservation
  } catch (err: unknown) {
    console.log('预约接口调用失败:', err)
    ElMessage.error('预约失败：' + (err instanceof Error ? err.message || '网络错误' : '网络错误'))
    throw err
  }
}
// 提交预约
const submitReservation = async () => {
  const roomName = (reservationInfo.value as { room?: string }).room || ''
  ElMessageBox.confirm(
    `确认预约以下信息？<br/><br/>
    教室：${roomName}<br/>
    日期：${reservationInfo.value.date}<br/>
    时间：${reservationInfo.value.time}<br/>
    时长：${reservationInfo.value.duration}小时<br/>
    座位：${reservationInfo.value.seats.join(', ')}`,
    '确认预约',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      dangerouslyUseHTMLString: true,
      type: 'warning',
    },
  )
    .then(async () => {
      try {
        const slot = timeSlots.find((t) => t.id === selectedTimeSlot.value)
        if (!slot) {
          ElMessage.error('请选择时间')
          return
        }

        const classroomId = parseInt(selectedRoom.value)
        const startTime = slot.start
        const duration = reservationInfo.value.duration * 60 // 转换为分钟

        const timeParts = startTime.split(':').map(Number)
        if (timeParts.length < 2) {
          ElMessage.error('时间格式错误')
          return
        }
        const [hours, minutes] = timeParts
        if (
          typeof hours !== 'number' ||
          typeof minutes !== 'number' ||
          isNaN(hours) ||
          isNaN(minutes)
        ) {
          ElMessage.error('时间格式错误')
          return
        }

        const endHours = hours + Math.floor((minutes + duration) / 60)
        const endMinutes = (minutes + duration) % 60
        const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`

        // 为每个选中的座位创建预约
        for (const seatId of selectedSeats.value) {
          // 从座位ID中提取座位代码
          const parts = seatId.split('-')
          const seatCode = parts.length === 3 ? parts[2] : `${parts[2]}-${parts[3]}`

          // 从当前座位数据中获取真实的座位ID
          const currentSeatData = seats.value.find((seat) => seat.seatCode === seatCode)
          const realSeatId = currentSeatData ? currentSeatData.id : 0

          // 调用创建预约API
          await createReservation({
            seatId: realSeatId,
            classroomId,
            reserveDate: reservationInfo.value.date,
            startTime,
            duration,
            endTime,
            type: 'normal',
          })
        }

        isConfirmDialogVisible.value = false
        selectedSeats.value = []

        // 刷新当前教室的座位数据（核心修复）
        await loadSeats(classroomId)
        // 刷新用户有效预约状态
        await checkUserActiveStatus()
        // 刷新教室列表，更新可用座位数
        await refreshClassroomList()

        ElMessage.success('预约成功！')

        // 更新教室的空闲率
        if (selectedRoom.value) {
          calculateRoomVacancyRate(parseInt(selectedRoom.value))
        }
      } catch (error) {
        console.error('预约失败:', error)
        ElMessage.error('预约失败，请重试')
      }
    })
    .catch(() => {
      ElMessage.info('已取消预约')
    })
}

// 关闭离开座位弹窗
const handleCloseLeaveDialog = () => {
  leaveDialogVisible.value = false
  currentSeat.value = null
}

// 确认离开座位
const handleLeaveConfirm = async () => {
  if (!currentSeat.value || !currentSeat.value.id) {
    ElMessage.error('参数错误：座位ID不存在')
    return
  }

  try {
    const classroomId = parseInt(selectedRoom.value)

    console.log('调用离开座位接口，参数:', {
      reservationId: currentSeat.value.id,
    })

    await request({
      url: `/library/reservations/${currentSeat.value.id}/leave`,
      method: 'POST',
    })

    ElMessage.success('离开座位成功！座位已释放')
    handleCloseLeaveDialog()

    // 更新用户活跃状态
    await checkUserActiveStatus()
    // 更新用户活跃预约数量
    await fetchActiveReservationCount()
    // 刷新座位列表
    await loadSeats(classroomId)
  } catch (error) {
    console.error('离开座位异常:', error)
    ElMessage.error('系统内部错误，请稍后重试')
  }
}

// 从详情弹窗离开座位
const handleLeaveSeatFromDetail = async (reservationId: number) => {
  try {
    const classroomId = parseInt(selectedRoom.value)

    console.log('从详情弹窗调用离开座位接口，参数:', { reservationId })

    // 调用离开座位接口（userId 从 token 获取，不需要传）
    await request({
      url: `/library/reservations/${reservationId}/leave`,
      method: 'POST',
    })

    ElMessage.success('离开座位成功！座位已释放')
    seatDetailDialogVisible.value = false

    // 更新用户活跃状态
    await checkUserActiveStatus()
    await fetchActiveReservationCount()

    // 刷新座位列表
    await loadSeats(classroomId)

    // 刷新教室卡片的可用座位数
    await refreshAllClassroomData()
  } catch (error) {
    console.error('离开座位异常:', error)
    ElMessage.error('系统内部错误，请稍后重试')
  }
}

// 从详情弹窗占用座位
const handleOccupySeatFromDetail = (reservationId: number) => {
  // 保存当前要占用的预约ID
  currentOccupyReservationId.value = reservationId
  // 打开占用确认弹窗
  occupyDialogVisible.value = true
}

// 确认占用座位
const handleOccupyConfirm = async () => {
  try {
    const classroomId = parseInt(selectedRoom.value)
    const reservationId = currentOccupyReservationId.value

    // 检查用户是否达到最大预约数量
    if (!checkReservationLimit()) {
      return
    }

    console.log('调用占用座位接口，参数:', { reservationId })

    await request({
      url: `/library/reservations/${reservationId}/occupy`,
      method: 'POST',
    })

    ElMessage.success('占用座位成功！')

    // 关闭弹窗
    occupyDialogVisible.value = false
    seatDetailDialogVisible.value = false

    // 刷新数据
    await loadSeats(classroomId)
    await checkUserActiveStatus()
    await fetchActiveReservationCount()
    await refreshAllClassroomData()
  } catch (error) {
    console.error('占用座位异常:', error)
    ElMessage.error('系统内部错误，请稍后重试')
  }
}

// 从详情弹窗预约座位
const handleReserveSeatFromDetail = async () => {
  if (!currentSeatDetails.value) {
    ElMessage.error('座位信息不存在')
    return
  }

  seatDetailDialogVisible.value = false

  // 获取预约信息
  const reserveDate = formatDate(selectedDate.value)
  const slot = timeSlots.find((t) => t.id === selectedTimeSlot.value)
  const startTime = slot?.start || '09:00'
  const duration = reservationInfo.value.duration // 使用用户选择的时长

  // 修复后的代码段
  const timeParts = startTime.split(':').map(Number)
  if (timeParts.length < 2) {
    ElMessage.error('时间格式错误')
    return
  }
  const [hours, minutes] = timeParts
  if (typeof hours !== 'number' || typeof minutes !== 'number' || isNaN(hours) || isNaN(minutes)) {
    ElMessage.error('时间格式错误')
    return
  }

  const endHours = hours + Math.floor((minutes + duration) / 60)
  const endMinutes = (minutes + duration) % 60
  const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`

  // 弹出确认预约弹窗
  ElMessageBox.confirm(
    `<div class="reservation-form">
      <h3 style="margin-bottom: 16px;">预约信息</h3>
      <div class="form-item">
        <span class="form-label">座位编号：</span>
        <span class="form-value">${currentSeatDetails.value.seatCode}</span>
      </div>
      <div class="form-item">
        <span class="form-label">教室：</span>
        <span class="form-value">${currentClassroomName.value}</span>
      </div>
      <div class="form-item">
        <span class="form-label">预约日期：</span>
        <span class="form-value">${reserveDate}</span>
      </div>
      <div class="form-item">
        <span class="form-label">开始时间：</span>
        <span class="form-value">${startTime}</span>
      </div>
      <div class="form-item">
        <span class="form-label">预约时长：</span>
        <span class="form-value">${duration}小时</span>
      </div>
      <div class="form-item">
        <span class="form-label">结束时间：</span>
        <span class="form-value">${endTime}</span>
      </div>
    </div>`,
    '确认预约',
    {
      confirmButtonText: '确认预约',
      cancelButtonText: '取消',
      dangerouslyUseHTMLString: true,
      type: 'info',
    },
  )
    .then(async () => {
      // 调用预约接口
      const createParams: CreateReservationParams = {
        seatId: currentSeatDetails.value!.id,
        classroomId: parseInt(selectedRoom.value),
        reserveDate,
        startTime,
        duration,
        endTime,
        type: 'reservation',
      }
      await createReservation(createParams)
    })
    .catch(() => {
      ElMessage.info('已取消预约')
    })
}

// 获取座位详情和预约列表
const getSeatDetails = async (seatId: string) => {
  try {
    console.log('查询座位详情，座位ID:', seatId)

    // 首先尝试从座位数据中查找对应的座位信息
    let currentSeatData = seats.value.find((seat) => seat.seatCode === seatId)

    // 如果没找到，尝试重新加载座位数据
    if (!currentSeatData) {
      console.log('未找到座位数据，重新加载')
      await loadSeats(parseInt(selectedRoom.value))
      currentSeatData = seats.value.find((seat) => seat.seatCode === seatId)
    }

    if (currentSeatData) {
      currentSeatDetails.value = currentSeatData
      console.log('座位详情:', currentSeatDetails.value)

      // 调用后端接口获取该座位的所有有效预约信息
      const reservations = (await request({
        url: `/library/reservations/seat/${currentSeatData.id}`,
        method: 'GET',
      })) as Reservation[]

      console.log('预约记录:', reservations)

      // 过滤出 active 状态的预约
      currentSeatReservations.value = reservations.filter(
        (reservation) => reservation.status === 'active',
      )

      console.log('预约列表:', currentSeatReservations.value)
      console.log('当前登录用户ID:', currentUserId.value)

      // 检查每条预约记录的 userId 与当前用户ID是否匹配
      currentSeatReservations.value.forEach((reservation, index) => {
        console.log(
          `预约 ${index + 1} - userId: ${reservation.userId}, 当前用户ID: ${currentUserId.value}, 是否匹配: ${reservation.userId === currentUserId.value}`,
        )
      })

      // 使用 nextTick 强制刷新组件
      await nextTick()
      console.log('组件已刷新，按钮应正确显示')
    }
  } catch (error) {
    console.error('获取座位详情失败:', error)
    ElMessage.error('获取座位信息失败，请重试')
  }
}

// 计算教室空闲率
const calculateRoomVacancyRate = (classroomId: string | number) => {
  const classroomIdNum = typeof classroomId === 'string' ? parseInt(classroomId) : classroomId
  const classroom = rooms.value.find((r) => r.id === classroomIdNum)
  if (!classroom) return

  const seatsMap = roomSeats.value[classroomId.toString()]
  if (!seatsMap) return

  const totalSeats = Object.keys(seatsMap).length
  const occupiedSeats = Object.values(seatsMap).filter(
    (status) => status === 'occupied' || status === 'reserved',
  ).length

  classroom.occupancyRate = (totalSeats - occupiedSeats) / totalSeats
}

// 取消预约
const cancelReservation = () => {
  // 取消选择的座位
  if (selectedRoom.value && roomSeats.value[selectedRoom.value]) {
    selectedSeats.value.forEach((seatId) => {
      roomSeats.value[selectedRoom.value]![seatId] = 'available'
    })
  }
  // 更新教室的空闲率
  if (selectedRoom.value) {
    calculateRoomVacancyRate(parseInt(selectedRoom.value))
  }
  selectedSeats.value = []
  isConfirmDialogVisible.value = false
}

// 获取当前教室座位行数
const getRowCount = () => {
  if (!selectedRoom.value) return 0
  const room = rooms.value.find((r) => r.id === parseInt(selectedRoom.value))
  return room?.floorId === 1 ? 4 : 6
}

// 获取当前教室座位列数
const getColCount = () => {
  if (!selectedRoom.value) return 0
  const room = rooms.value.find((r) => r.id === parseInt(selectedRoom.value))
  return room?.floorId === 1 ? 8 : 10
}

// 检查是否为一楼的101-104教室
const isFirstFloorRoom = computed(() => {
  // 检查当前选中的教室名称
  const classroomName = selectedClassroom.value?.classroomName || selectedClassroom.value?.name
  return (
    classroomName &&
    (classroomName === '101' ||
      classroomName === '102' ||
      classroomName === '103' ||
      classroomName === '104')
  )
})

// 获取座位编号
const getSeatNumber = (rowIndex: number, colIndex: number): string => {
  // 所有教室统一使用字母+数字的组合格式（如A1、B2等）
  const colLetter = String.fromCharCode(65 + rowIndex)
  const rowNumber = colIndex + 1
  return `${colLetter}${rowNumber}`
}

// 生成座位矩阵，确保按正确顺序排列
const generateSeatMap = (seats: Seat[]): Array<{ rowLabel: string; seats: (Seat | null)[] }> => {
  // 定义行标签
  const rows = isFirstFloorRoom.value ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E', 'F']
  const cols = isFirstFloorRoom.value ? 8 : 10

  // ✅ 使用 Record 类型定义 map
  const map: Record<string, (Seat | null)[]> = {}

  // 初始化每一行
  rows.forEach((row) => {
    map[row] = Array(cols).fill(null)
  })

  // 填充座位到对应位置
  seats.forEach((individualSeat) => {
    const code = individualSeat.seatCode
    if (code) {
      const row = code.charAt(0) // A, B, C...
      const colStr = code.slice(1) // 提取数字部分
      const col = parseInt(colStr) - 1 // 转换为0-based索引
      if (rows.includes(row) && col >= 0 && col < cols) {
        const targetRow = map[row] || (map[row] = [])
        targetRow[col] = { ...individualSeat }
      }
    }
  })

  // 转换为数组，保持A-F的顺序
  return rows.map((row) => ({
    rowLabel: row,
    seats: map[row] || [],
  }))
}

// 网格布局：根据教室类型确定布局
const grid = computed(() => {
  return generateSeatMap(seats.value)
})
</script>

<template>
  <div class="library-reservation">
    <GlobalNavbar />

    <div class="main-content">
      <div class="content-area">
        <h1 class="page-title">图书馆座位预约</h1>

        <!-- 预约信息卡片 -->
        <div class="info-card">
          <div class="card-header">
            <h3 class="card-title">
              预约信息
              <span style="font-size: 14px; color: #666; font-weight: normal; margin-left: 10px"
                >（开放时间：每天7:00-23:00，节假日除外）</span
              >
            </h3>
            <el-button type="primary" plain @click="refreshAllClassroomData" :loading="isLoading">
              刷新状态
            </el-button>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <label>选择日期：</label>
              <el-date-picker
                v-model="selectedDate"
                type="date"
                placeholder="选择日期"
                :disabled-date="
                  (date: Date) => {
                    // 创建一个只包含年月日的今天日期对象
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    // 创建一个只包含年月日的传入日期对象
                    const compareDate = new Date(date)
                    compareDate.setHours(0, 0, 0, 0)
                    // 禁用今天之前的日期
                    return compareDate < today
                  }
                "
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </div>
            <div class="info-item">
              <label>预约时间：</label>
              <el-select v-model="selectedTimeSlot" placeholder="选择预约时间">
                <el-option
                  v-for="slot in timeSlots"
                  :key="slot.id"
                  :label="slot.label"
                  :value="slot.id"
                />
              </el-select>
            </div>
            <div class="info-item">
              <label>预约时长：</label>
              <el-input-number
                v-model="reservationInfo.duration"
                :min="1"
                :max="maxDuration"
                :step="1"
              />
              <span style="margin-left: 8px">小时</span>
            </div>
          </div>
        </div>

        <!-- 楼层和教室选择区 -->
        <div class="room-selection-area">
          <!-- 楼层选择 -->
          <div class="floor-selector">
            <h3>选择楼层</h3>
            <div class="floor-buttons">
              <button
                v-for="floor in floors"
                :key="floor.id || floor.floorNum"
                :class="[
                  'floor-btn',
                  {
                    active:
                      currentFloor?.id === floor.id || currentFloor?.floorNum === floor.floorNum,
                  },
                ]"
                @click="handleFloorChange(floor)"
              >
                {{ floor.floorNum || floor.id }}楼
              </button>
            </div>
          </div>

          <!-- 教室选择 -->
          <div class="room-selector">
            <h3>选择教室</h3>

            <!-- 加载状态 -->
            <div v-if="isLoading" class="loading-container">
              <div class="loading-spinner"></div>
              <p>正在加载教室数据...</p>
            </div>

            <!-- 推荐教室 -->
            <div v-else-if="recommendedRooms.length > 0" class="recommended-section">
              <div class="recommended-title">
                <span class="recommended-icon">🎯</span>
                <span>推荐教室（按空闲率排序）</span>
              </div>
              <div class="room-grid recommended-grid">
                <div
                  v-for="room in recommendedRooms"
                  :key="room.id"
                  :class="[
                    'room-card recommended',
                    { active: selectedRoom === room.id.toString() },
                  ]"
                  @click="handleRoomSelect(room)"
                >
                  <div class="room-header">
                    <span class="room-name">{{ room.classroomName || room.name }}</span>
                    <span
                      class="room-status"
                      :style="{ backgroundColor: getOccupancyColor(room.occupancyRate || 0) }"
                    >
                      {{ getRoomStatusText(room.occupancyRate || 0) }}
                    </span>
                  </div>
                  <div class="room-info">
                    <div class="room-stat">
                      <span class="stat-label">总座位：</span>
                      <span class="stat-value">{{
                        room.totalSeats !== null ? room.totalSeats : '加载中...'
                      }}</span>
                    </div>
                    <div class="room-stat">
                      <span class="stat-label">可用：</span>
                      <span class="stat-value">{{
                        room.availableSeats !== null ? room.availableSeats : '加载中...'
                      }}</span>
                    </div>
                  </div>
                  <div class="occupancy-bar">
                    <div
                      class="occupancy-fill"
                      :style="{ width: `${(room.occupancyRate || 0) * 100}%` }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 其他教室 -->
            <div v-else-if="otherRooms.length > 0" class="all-rooms-section">
              <div class="all-rooms-title">其他教室</div>
              <div class="room-grid">
                <div
                  v-for="room in otherRooms"
                  :key="room.id"
                  :class="['room-card', { active: selectedRoom === room.id.toString() }]"
                  @click="handleRoomSelect(room)"
                >
                  <div class="room-header">
                    <span class="room-name">{{ room.classroomName || room.name }}</span>
                    <span
                      class="room-status"
                      :style="{ backgroundColor: getOccupancyColor(room.occupancyRate || 0) }"
                    >
                      {{ getRoomStatusText(room.occupancyRate || 0) }}
                    </span>
                  </div>
                  <div class="room-info">
                    <div class="room-stat">
                      <span class="stat-label">总座位：</span>
                      <span class="stat-value">{{
                        room.totalSeats !== null ? room.totalSeats : '加载中...'
                      }}</span>
                    </div>
                    <div class="room-stat">
                      <span class="stat-label">可用：</span>
                      <span class="stat-value">{{
                        room.availableSeats !== null ? room.availableSeats : '加载中...'
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 无教室数据 -->
            <div v-else class="no-data">
              <p>暂无教室数据</p>
            </div>
          </div>
        </div>

        <!-- 座位选择区 -->
        <div v-if="selectedRoom" class="seat-selection-area">
          <!-- 功能提示 -->
          <div class="seat-tips">
            <div class="tip-item">
              <span class="tip-icon">📝</span>
              <span class="tip-text">点击绿色"可选"座位可直接进行预约</span>
            </div>
            <div class="tip-item">
              <span class="tip-icon">⚡</span>
              <span class="tip-text">若该座位的用户30分钟内未到可点击红色"已预约"座位进行占用</span>
            </div>
            <div class="tip-item">
              <span class="tip-icon">💡</span>
              <span class="tip-text">最多可选择3个座位进行预约</span>
            </div>
          </div>

          <!-- 座位图例 -->
          <div class="seat-legend">
            <div class="legend-item">
              <span class="legend-seat available"></span>
              <span>可选（可预约）</span>
            </div>
            <div class="legend-item">
              <span class="legend-seat occupied"></span>
              <span>已预约（可占用）</span>
            </div>
            <div class="legend-item">
              <span class="legend-seat podium"></span>
              <span>讲台</span>
            </div>
            <div class="legend-item">
              <span class="legend-seat door"></span>
              <span>门</span>
            </div>
            <div class="legend-item">
              <span class="legend-seat window"></span>
              <span>窗</span>
            </div>
          </div>

          <!-- 教室座位图区域 -->
          <div class="seat-map" v-if="seats.length > 0">
            <!-- 教室标题 -->
            <div class="classroom-title">
              教室座位图 -
              {{
                rooms.find((r) => r.id === parseInt(selectedRoom))?.classroomName ||
                rooms.find((r) => r.id === parseInt(selectedRoom))?.name ||
                selectedClassroom?.classroomName ||
                selectedClassroom?.name ||
                '请选择教室'
              }}
            </div>

            <!-- 讲台区域 -->
            <div class="lectern-area">
              <div class="lectern podium">
                <span class="lectern-icon">📝</span>
                <span>讲台</span>
              </div>
            </div>

            <!-- 门区域 -->
            <div class="door-area">
              <div class="door">
                <span class="door-icon">🚪</span>
                <span>门</span>
              </div>
            </div>

            <!-- 窗户区域 -->
            <div class="window-area">
              <div class="window">
                <span class="window-icon">🪟</span>
                <span>窗</span>
              </div>
            </div>

            <!-- 座位区域 -->
            <div class="seats-container">
              <!-- 横排数字 1-8 或 1-10 -->
              <div class="cols-header">
                <div class="row-label-placeholder"></div>
                <span v-for="n in isFirstFloorRoom ? 8 : 10" :key="n" class="col-label">{{
                  n
                }}</span>
              </div>

              <!-- 座位行 -->
              <div class="seat-rows">
                <div class="seat-row" v-for="row in grid" :key="row.rowLabel">
                  <!-- 列标签：A-D 或 A-F -->
                  <span class="row-label">{{ row.rowLabel }}</span>
                  <div class="row-seats">
                    <div
                      v-for="(seat, colIndex) in row.seats"
                      :key="
                        seat
                          ? `${selectedRoom}-${seat.id}`
                          : `empty-${selectedRoom}-${row.rowLabel}-${colIndex}`
                      "
                      class="seat"
                      :class="{
                        available:
                          seat &&
                          currentRoomSeats[`${selectedRoom}-${seat.seatCode}`] === 'available' &&
                          (!seatReservationCounts[seat.seatCode] ||
                            seatReservationCounts[seat.seatCode] === 0),
                        occupied:
                          seat &&
                          (currentRoomSeats[`${selectedRoom}-${seat.seatCode}`] === 'occupied' ||
                            currentRoomSeats[`${selectedRoom}-${seat.seatCode}`] === 'reserved' ||
                            (seatReservationCounts[seat.seatCode] &&
                              (seatReservationCounts[seat.seatCode] ?? 0) > 0)),
                        reserved:
                          seat &&
                          (currentRoomSeats[`${selectedRoom}-${seat.seatCode}`] === 'reserved' ||
                            (seatReservationCounts[seat.seatCode] &&
                              (seatReservationCounts[seat.seatCode] ?? 0) > 0)),
                        selected:
                          seat && selectedSeats.includes(`${selectedRoom}-${seat.seatCode}`),
                        empty: !seat,
                      }"
                      @click="
                        seat &&
                        handleSeatClick(
                          `${selectedRoom}-${seat.seatCode}`,
                          currentRoomSeats[`${selectedRoom}-${seat.seatCode}`] || 'available',
                        )
                      "
                      :title="
                        seat
                          ? `座位 ${seat.seatCode} - ${
                              currentRoomSeats[`${selectedRoom}-${seat.seatCode}`] ===
                                'available' &&
                              (!seatReservationCounts[seat.seatCode] ||
                                seatReservationCounts[seat.seatCode] === 0)
                                ? '可选'
                                : '已占用'
                            }`
                          : ''
                      "
                    >
                      {{ seat ? seat.seatCode : '' }}
                      <span
                        v-if="seat && (seatReservationCounts[seat.seatCode] ?? 0) > 0"
                        class="occupancy-count"
                        >({{ seatReservationCounts[seat.seatCode] ?? 0 }}条预约)</span
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 加载中状态 -->
          <div v-else class="loading-placeholder">正在加载座位数据...</div>

          <!-- 选中的座位信息 -->
          <div v-if="selectedSeats.length > 0" class="selected-info">
            <div class="selected-header">
              <h4>已选座位：</h4>
              <span class="seat-count">{{ selectedSeats.length }}/5</span>
            </div>
            <div class="selected-seats">
              <el-tag
                v-for="seatId in selectedSeats"
                :key="seatId"
                closable
                @close="handleSeatClick(seatId, currentRoomSeats[seatId] || 'selected')"
              >
                {{ getSeatLabel(seatId) }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 确认预约对话框 -->
    <el-dialog
      v-model="isConfirmDialogVisible"
      title="确认预约信息"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="confirm-info">
        <div class="confirm-item">
          <label>教室：</label>
          <span>{{ (reservationInfo as any).room }}</span>
        </div>
        <div class="confirm-item">
          <label>预约日期：</label>
          <span>{{ reservationInfo.date }}</span>
        </div>
        <div class="confirm-item">
          <label>预约时间：</label>
          <span>{{ reservationInfo.time }}</span>
        </div>
        <div class="confirm-item">
          <label>预约时长：</label>
          <span>{{ reservationInfo.duration }}小时</span>
        </div>
        <div class="confirm-item">
          <label>座位：</label>
          <span>{{ reservationInfo.seats.join(', ') }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="cancelReservation">取消</el-button>
        <el-button type="primary" @click="submitReservation" :disabled="isAtMaxLimit"
          >确认预约</el-button
        >
      </template>
    </el-dialog>

    <!-- 离开座位弹窗 -->
    <el-dialog v-model="leaveDialogVisible" title="离开座位" width="400px">
      <div v-if="currentSeat">
        <p><strong>座位编号：</strong>{{ currentSeat.seatCode }}</p>
        <p><strong>教室：</strong>{{ currentClassroomName }}</p>
        <p>
          <strong>预约信息：</strong> {{ formatDate(selectedDate) }}
          {{ timeSlots.find((t) => t.id === selectedTimeSlot)?.start || '09:00' }}
        </p>
        <p style="color: red; margin-top: 10px">你确定要离开当前座位吗？</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCloseLeaveDialog">取消</el-button>
          <el-button type="primary" @click="handleLeaveConfirm">离开</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 占用确认弹窗 -->
    <el-dialog v-model="occupyDialogVisible" title="占用确认" width="400px">
      <div>
        <p>请确保当前预约用户在30分钟内不在该座位上</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="occupyDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleOccupyConfirm" :disabled="isAtMaxLimit"
            >确认</el-button
          >
        </span>
      </template>
    </el-dialog>

    <!-- 座位详情弹窗 -->
    <el-dialog
      v-model="seatDetailDialogVisible"
      :title="`座位 ${currentSeatDetails?.seatCode} 详情`"
      width="500px"
    >
      <div v-if="currentSeatDetails">
        <div class="seat-detail-info">
          <p><strong>座位编号：</strong>{{ currentSeatDetails.seatCode }}</p>
          <p><strong>教室：</strong>{{ currentClassroomName }}</p>
        </div>

        <div class="reservation-list" style="margin-top: 20px">
          <h4 style="margin-bottom: 12px">预约列表</h4>
          <el-empty v-if="currentSeatReservations.length === 0" description="暂无有效预约" />
          <el-card
            v-for="reservation in currentSeatReservations"
            :key="reservation.id"
            style="margin-bottom: 10px"
          >
            <div class="reservation-item">
              <div class="reservation-info">
                <p><strong>预约人ID：</strong>{{ reservation.userId }}</p>
                <p><strong>预约日期：</strong>{{ reservation.reserveDate }}</p>
                <p>
                  <strong>预约时间段：</strong>{{ reservation.startTime }} -
                  {{ reservation.endTime }}
                </p>
              </div>
              <el-button
                v-if="reservation.userId === userStore.userState.userInfo?.userId"
                type="danger"
                size="small"
                @click="handleLeaveSeatFromDetail(reservation.id)"
                style="display: block !important; z-index: 9999"
              >
                离开座位
              </el-button>
              <el-button
                v-else
                type="warning"
                size="small"
                @click="handleOccupySeatFromDetail(reservation.id)"
                style="display: block !important; z-index: 9999"
              >
                占用
              </el-button>
            </div>
          </el-card>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="seatDetailDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="handleReserveSeatFromDetail" :disabled="isAtMaxLimit"
            >预约此座位</el-button
          >
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.library-reservation {
  min-height: 100vh;
  background-color: var(--bg-color);
  padding-top: 70px;
}

.main-content {
  padding: 20px;
}

.content-area {
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 24px;
  text-align: center;
}

.info-card {
  background: var(--white);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-sm);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.info-item label {
  font-weight: 500;
  color: var(--text-color);
  white-space: nowrap;
}

.room-selection-area {
  background: var(--white);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-sm);
}

.floor-selector {
  margin-bottom: 24px;
}

.floor-selector h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 12px;
}

.floor-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.floor-btn {
  padding: 10px 20px;
  border: 1px solid var(--border-color);
  background: var(--white);
  color: var(--text-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.floor-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.floor-btn.active {
  background: var(--primary-color);
  color: var(--white);
  border-color: var(--primary-color);
}

.room-selector h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 12px;
}

.room-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.room-card {
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  background: var(--white);
}

.room-card:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.room-card.active {
  border-color: var(--primary-color);
  background: var(--primary-color-light);
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.room-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.room-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.room-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.room-stat {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
}

.seat-selection-area {
  background: var(--white);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-sm);
}

.seat-tips {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%);
  border: 1px solid #ffd591;
  border-radius: 6px;
  font-size: 13px;
  color: #d46b08;
}

.tip-icon {
  font-size: 16px;
}

.tip-text {
  font-weight: 500;
}

.seat-legend {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: var(--bg-color-light);
  border-radius: 8px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-color);
}

.legend-seat {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 2px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: white;
}

.legend-seat.door {
  width: 32px;
  height: 32px;
}

.legend-seat.window {
  width: 32px;
  height: 32px;
}

.legend-seat.available {
  background: #52c41a;
  border-color: #389e0d;
}

.legend-seat.occupied {
  background: #f5222d;
  border-color: #cf1322;
}

.legend-seat.selected {
  background: #1890ff;
  border-color: #096dd9;
}

.legend-seat.reserved {
  background: #f5222d;
  border-color: #cf1322;
}

.legend-seat.podium {
  background: #722ed1;
  border-color: #531dab;
}

.legend-seat.door {
  background: #fa8c16;
  border-color: #d46b08;
}

.legend-seat.window {
  background: #1890ff;
  border-color: #096dd9;
}

.occupancy-count {
  font-size: 10px;
  color: inherit;
  margin-left: 4px;
  white-space: nowrap;
  opacity: 0.8;
}

.recommended-section {
  margin-bottom: 24px;
}

.recommended-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 12px;
}

.recommended-icon {
  font-size: 16px;
}

.recommended-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.room-card.recommended {
  border-color: #52c41a;
  background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
  position: relative;
  overflow: hidden;
}

.room-card.recommended::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #52c41a 0%, #73d13d 100%);
}

.room-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
  color: white;
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  z-index: 1;
}

.all-rooms-section {
  margin-top: 24px;
}

.all-rooms-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--border-color-light);
}

.occupancy-bar {
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  margin-top: 8px;
  overflow: hidden;
}

.occupancy-fill {
  height: 100%;
  background: linear-gradient(90deg, #52c41a 0%, #73d13d 100%);
  transition: width 0.3s ease;
  border-radius: 3px;
}

/* 座位图样式 */
.seat-map {
  position: relative;
  padding: 20px;
  border: 2px solid #e6e6e6;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 500px;
  box-sizing: border-box;
}

/* 教室标题 */
.classroom-title {
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  color: #1890ff;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e6f7ff;
  width: 100%;
}

/* 讲台区域 */
.lectern-area {
  position: relative;
  margin-bottom: 15px;
  z-index: 10;
}

.lectern {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 24px;
  background: #722ed1;
  color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(114, 46, 209, 0.3);
  font-weight: 500;
}

.lectern-icon {
  font-size: 16px;
}

/* 门区域 */
.door-area {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
}

.door {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 80px;
  background: #fa8c16;
  color: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(250, 140, 22, 0.3);
  gap: 4px;
}

.door-icon {
  font-size: 20px;
}

/* 窗户区域 */
.window-area {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
}

.window {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 80px;
  background: #1890ff;
  color: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
  gap: 4px;
}

.window-icon {
  font-size: 20px;
}

/* 座位区域 */
.seats-container {
  margin: 10px 0;
  margin-left: 50px; /* 留出窗户位置 */
  margin-right: 50px; /* 留出门口位置 */
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e6e6e6;
  width: calc(100% - 100px);
  height: 300px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* 列标题 */
.cols-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  width: 100%;
}

.row-label-placeholder {
  width: 40px;
}

.col-label {
  flex: 1;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  margin: 0 0;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 座位行 */
.seat-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.seat-row {
  display: flex;
  align-items: center;
  width: 100%;
}

.row-label {
  width: 40px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.row-seats {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(44px, 1fr));
  gap: 4px;
  align-items: center;
}

/* 座位样式 */
.seat {
  width: 100%;
  height: 44px;
  border: 2px solid #d9d9d9;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.seat:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 5;
}

/* 座位状态 */
.available {
  background: #52c41a;
  color: #fff;
  border-color: #389e0d;
}

.occupied,
.reserved {
  background: #f5222d;
  color: #fff;
  border-color: #cf1322;
}

.selected {
  background: #1890ff;
  color: #fff;
  border-color: #096dd9;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.3);
}

.empty {
  background: #f0f0f0;
  color: #999;
  border-color: #e0e0e0;
  cursor: not-allowed;
}

.occupancy-count {
  font-size: 10px;
  margin-left: 2px;
  opacity: 0.8;
}

/* 预约项目样式 */
.reservation-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.reservation-info {
  flex: 1;
}

/* 加载中状态 */
.loading-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  border: 2px dashed #e6e6e6;
  background: #f9f9f9;
  border-radius: 12px;
  font-size: 16px;
  color: #999;
  margin: 20px 0;
}

/* 预约表单样式 */
.reservation-form {
  width: 100%;
  padding: 10px;
}

.form-item {
  display: flex;
  margin-bottom: 10px;
  align-items: center;
}

.form-label {
  width: 100px;
  font-weight: 500;
  color: #666;
}

.form-value {
  flex: 1;
  color: #333;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .seat-map {
    padding: 20px;
  }

  .seats-container {
    margin-right: 40px;
    padding: 15px;
  }

  .seat {
    width: 30px;
    height: 30px;
    font-size: 12px;
  }

  .col-label {
    width: 30px;
    font-size: 12px;
  }

  .row-label {
    width: 30px;
    font-size: 12px;
  }

  .row-label-placeholder {
    width: 30px;
  }

  .lectern,
  .blackboard {
    padding: 6px 16px;
    font-size: 14px;
  }

  .door {
    width: 24px;
    height: 48px;
  }

  .loading-placeholder {
    height: 300px;
  }
}

.selected-info {
  margin-top: 20px;
  padding: 16px;
  background: #f0f9ff;
  border-radius: 8px;
  border: 1px solid #d6e4ff;
}

.selected-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.selected-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1890ff;
}

.seat-count {
  font-size: 14px;
  color: #666;
}

.selected-seats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 加载状态样式 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: #f9f9f9;
  border-radius: 8px;
  margin: 20px 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.no-data {
  text-align: center;
  padding: 40px;
  background: #f9f9f9;
  border-radius: 8px;
  margin: 20px 0;
  color: #999;
}

.confirm-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.confirm-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.confirm-item label {
  font-weight: 500;
  color: #333;
}

.confirm-item span {
  color: #666;
}

.seat-action-buttons {
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.action-btn {
  font-size: 10px;
  padding: 2px 6px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.leave-btn {
  background: #f56c6c;
  color: #fff;
}

.enter-btn {
  background: #67c23a;
  color: #fff;
}

.remaining-time {
  font-size: 9px;
  color: #666;
  text-align: center;
  margin-top: 2px;
}

.no-seats {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #999;
}

.no-seats p {
  margin: 4px 0;
}
/* 按钮悬停效果 */
.enter-btn:hover {
  background: linear-gradient(135deg, #389e0d 0%, #52c41a 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(82, 196, 26, 0.4);
}

.leave-btn {
  background: linear-gradient(135deg, #f5222d 0%, #ff4d4f 100%);
  color: white;
  box-shadow: 0 2px 6px rgba(245, 34, 45, 0.3);
}

.leave-btn:hover {
  background: linear-gradient(135deg, #cf1322 0%, #f5222d 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(245, 34, 45, 0.4);
}

.remaining-time {
  font-size: 10px;
  color: #faad14;
  font-weight: 600;
  background: #fff7e6;
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
}

/* 讲台行样式（保留旧样式以备后用） */
.seat-row-podium {
  grid-column: span 3;
  height: 36px;
  background: linear-gradient(135deg, #722ed1 0%, #9254de 100%);
  border: 2px solid #531dab;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 14px;
}

/* 门样式（保留旧样式以备后用） */
.seat-door {
  width: 40px;
  height: 100%;
  background: linear-gradient(135deg, #fa8c16 0%, #ffa940 100%);
  border: 2px solid #d46b08;
  border-radius: 4px;
  writing-mode: vertical-lr;
  text-orientation: upright;
  letter-spacing: 2px;
  color: white;
  font-weight: bold;
  font-size: 10px;
}

/* 座位行样式（保留旧样式以备后用） */
.seat-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

/* 座位列样式（保留旧样式以备后用） */
.seat-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.selected-info {
  margin-top: 24px;
  padding: 16px;
  background: var(--bg-color-light);
  border-radius: 8px;
  border-left: 4px solid var(--primary-color);
}

.selected-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.selected-header h4 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.seat-count {
  background: var(--primary-color);
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.selected-seats {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.confirm-info {
  padding: 16px;
}

.confirm-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color-light);
}

.confirm-item:last-child {
  border-bottom: none;
}

.confirm-item label {
  font-weight: 600;
  color: var(--text-color);
}

.confirm-item span {
  color: var(--text-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .content-area {
    padding: 12px;
  }

  .page-title {
    font-size: 24px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .room-grid {
    grid-template-columns: 1fr;
  }

  .seat-legend {
    flex-wrap: wrap;
    gap: 12px;
  }

  .seat {
    width: 36px;
    height: 28px;
    font-size: 10px;
  }

  .seat.podium {
    width: 60px;
  }

  .seat.door {
    height: 80px;
  }
}
</style>
