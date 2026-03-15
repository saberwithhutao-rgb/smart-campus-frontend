<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import GlobalNavbar from '@/components/GlobalNavbar.vue'
import { useUserStore } from '@/stores/user'
import request from '@/utils/request'
import {
  getVenues,
  getCourtsByVenue,
  createReservation,
  occupyReservation,
  leaveReservation,
  getCourtReservations,
  getUserReservations
} from '@/api/sports'

// 响应式数据
const userStore = useUserStore()
const currentVenue = ref<any>(null) // 当前场馆
const selectedDate = ref(new Date()) // 选中的日期
const selectedCourts = ref<string[]>([]) // 选中的场地
const isConfirmDialogVisible = ref(false) // 确认预约对话框
const leaveDialogVisible = ref(false) // 离开场地对话框
const currentCourt = ref<any>(null) // 当前点击场地
const courtDetailDialogVisible = ref(false) // 场地详情对话框
const currentCourtDetails = ref<any>(null) // 当前场地详情
const currentCourtReservations = ref<any[]>([]) // 当前场地的预约列表
const hasActiveReservation = ref(false) // 用户是否有活跃的预约或占用记录
const occupyDialogVisible = ref(false) // 占用确认弹窗
const currentOccupyReservationId = ref<number>(0) // 当前要占用的预约ID

const isLoading = ref(false) // 加载状态
const reservationInfo = ref({
  venue: '',
  date: '',
  time: '',
  courts: [] as string[],
  duration: 2, // 预约时长(小时)
})

// 计算属性：获取当前登录用户的ID
const currentUserId = computed(() => {
  const userId = userStore.userId || 1;
  console.log('当前登录用户ID:', userId);
  return userId;
});

// 场馆列表
const venues = ref<any[]>([])

// 场地列表
const courts = ref<any[]>([])

// 时间段列表
const timeSlots = [
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

const selectedTimeSlot = ref(3) // 默认选中的时间
const maxDuration = ref(4) // 最大可预约时长

// 监听预约时间变化，动态计算最大可预约时长
watch(selectedTimeSlot, (newSlotId) => {
  // 找到选中的时间槽
  const selectedSlot = timeSlots.find(slot => slot.id === newSlotId)
  if (selectedSlot) {
    // 提取开始时间的小时数
    const startHour = parseInt(selectedSlot.start.split(':')[0])
    // 计算最大可预约时长
    const newMaxDuration = Math.min(4, 23 - startHour)

    // 如果用户之前选择的时长超过新的最大值，自动调整并提示
    if (reservationInfo.value.duration > newMaxDuration) {
      reservationInfo.value.duration = newMaxDuration
      ElMessage.info(`当前开始时间最多可预约${newMaxDuration}小时，已为您自动调整`)
    }

    // 更新最大可预约时长
    maxDuration.value = newMaxDuration
  }
})

// 场地状态类型
type CourtStatus = 'available' | 'occupied' | 'selected' | 'reserved'

// 所有场馆的场地数据
const venueCourts = ref<Record<string, Record<string, CourtStatus>>>({})

// 组件挂载时，初始化数据
onMounted(async () => {
  try {
    // 打印当前登录用户ID
    console.log('当前登录用户ID:', userStore.userState.userInfo?.userId);
    console.log('currentUserId.value:', currentUserId.value);

    // 获取场馆列表
    const venueList = await getVenues()
    venues.value = venueList
    console.log('场馆列表:', venueList)

    // 初始加载第一个场馆的场地
    if (venues.value.length > 0) {
      const firstVenue = venues.value[0]
      currentVenue.value = firstVenue
      await loadCourts(firstVenue.id)
    }

    // 检查用户活跃状态
    await checkUserActiveStatus();

    // 设置定时器，每30秒刷新一次场地数据
    setInterval(async () => {
      if (currentVenue.value) {
        await loadCourts(currentVenue.value.id);
      }
    }, 30000);
  } catch (error) {
    console.error('初始化数据失败:', error)
    ElMessage.error('获取数据失败，请刷新页面重试')
  }
})

// 加载场地列表
const loadCourts = async (venueId: number) => {
  try {
    isLoading.value = true
    const courtList = await getCourtsByVenue(venueId)
    courts.value = courtList
    console.log('场地列表:', courtList)

    // 初始化场地状态
    const courtMap: Record<string, CourtStatus> = {}
    courtList.forEach(court => {
      const courtId = `${venueId}-${court.id}`
      // 映射场地状态
      let status: CourtStatus = 'available'
      if (court.status === 'reserved' || court.status === 'occupied') {
        status = 'occupied'
      }
      courtMap[courtId] = status
    })

    venueCourts.value[venueId] = courtMap
  } catch (error) {
    console.error('加载场地失败:', error)
    ElMessage.error('获取场地数据失败')
    courts.value = []
  } finally {
    isLoading.value = false
  }
}

// 获取当前场馆的场地（按编号排序）
const currentVenueCourts = computed(() => {
  if (!currentVenue.value) return {}
  const courts = venueCourts.value[currentVenue.value.id] || {}
  // 按场地编号排序
  const sortedCourts: Record<string, CourtStatus> = {}
  Object.keys(courts)
    .sort((a, b) => {
      const numA = parseInt(a.split('-')[1])
      const numB = parseInt(b.split('-')[1])
      return numA - numB
    })
    .forEach(key => {
      sortedCourts[key] = courts[key]
    })
  return sortedCourts
})

// 获取当前场馆信息
const currentVenueInfo = computed(() => {
  return currentVenue.value
})

// 切换场馆
const handleVenueChange = async (venue: any) => {
  try {
    currentVenue.value = venue
    selectedCourts.value = []
    // 加载新场馆的场地
    await loadCourts(venue.id)
  } catch (error) {
    console.error('切换场馆失败:', error)
    ElMessage.error('切换场馆失败，请重试')
  }
}

// 获取场地的显示标签
const getCourtLabel = (courtId: string) => {
  const parts = courtId.split('-')
  const courtIdNum = parts[1]
  // 从场地列表中查找场地编码
  const court = courts.value.find(c => c.id === parseInt(courtIdNum))
  return court?.courtCode || `场地${courtIdNum}`
}

// 获取场地状态类名
const getCourtClass = (status: CourtStatus) => {
  const baseClass = 'court'
  switch (status) {
    case 'available':
      return `${baseClass} available`
    case 'occupied':
    case 'reserved':
      return `${baseClass} occupied`
    case 'selected':
      return `${baseClass} selected`
    default:
      return baseClass
  }
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
  if (selectedCourts.value.length === 0) {
    ElMessage.warning('请先选择一个场地')
    return
  }

  if (selectedCourts.value.length > 2) {
    ElMessage.warning('最多只能选择2个场地')
    return
  }

  const slot = timeSlots.find((t) => t.id === selectedTimeSlot.value)
  if (!slot) {
    ElMessage.error('请选择时间')
    return
  }

  reservationInfo.value = {
    venue: currentVenueInfo.value?.venueName || '',
    date: formatDate(selectedDate.value),
    time: slot.label,
    courts: selectedCourts.value.map((courtId) => getCourtLabel(courtId)),
    duration: reservationInfo.value.duration,
  }

  isConfirmDialogVisible.value = true
}

// 提交预约
const submitReservation = async () => {
  const venueName = reservationInfo.value.venue
  ElMessageBox.confirm(
    `确认预约以下信息？<br/><br/>
    场馆：${venueName}<br/>
    日期：${reservationInfo.value.date}<br/>
    时间：${reservationInfo.value.time}<br/>
    时长：${reservationInfo.value.duration}小时<br/>
    场地：${reservationInfo.value.courts.join(', ')}`,
    '确认预约',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      dangerouslyUseHTMLString: true,
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        const slot = timeSlots.find((t) => t.id === selectedTimeSlot.value)
        if (!slot) {
          ElMessage.error('请选择时间')
          return
        }

        const venueId = currentVenue.value.id
        const startTime = slot.start
        const duration = reservationInfo.value.duration * 60 // 转换为分钟

        // 计算结束时间
        const [hours, minutes] = startTime.split(':').map(Number)
        const endHours = hours + Math.floor((minutes + duration) / 60)
        const endMinutes = (minutes + duration) % 60
        const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`

        // 使用当前登录用户ID
        // userId 已在前面声明

        // 为每个选中的场地创建预约
        for (const courtId of selectedCourts.value) {
          // 从场地ID中提取真实的场地ID
          const parts = courtId.split('-')
          const realCourtId = parseInt(parts[1])

          // 调用创建预约API
          const response = await createReservation({
            userId,
            courtId: realCourtId,
            venueId,
            reserveDate: reservationInfo.value.date,
            startTime,
            duration,
            endTime
          })

          if (response.data.code !== 200) {
            ElMessage.error(`预约失败：${response.data.msg}`)
            return
          }
        }

        isConfirmDialogVisible.value = false
        selectedCourts.value = []
        // 刷新场地列表
        await loadCourts(venueId)
        // 更新用户活跃状态
        await checkUserActiveStatus()
        ElMessage.success('预约成功！')
      } catch (error: any) {
        console.error('预约失败:', error)
        ElMessage.error(`预约失败：${error.response?.data?.msg || '网络错误'}`)
      }
    })
    .catch(() => {
      ElMessage.info('已取消预约')
    })
}

// 取消预约
const cancelReservation = () => {
  // 取消选择的场地
  selectedCourts.value.forEach((courtId) => {
    if (currentVenue.value && venueCourts.value[currentVenue.value.id]) {
      venueCourts.value[currentVenue.value.id]![courtId] = 'available'
    }
  })
  selectedCourts.value = []
  isConfirmDialogVisible.value = false
}

// 点击场地
const handleCourtClick = async (courtId: string, status: CourtStatus) => {
  if (!currentVenue.value) {
    ElMessage.warning('请先选择场馆')
    return
  }

  // 从场地ID中提取真实的场地ID
  const parts = courtId.split('-')
  const realCourtId = parseInt(parts[1])

  // 获取场地详情和预约列表
  await getCourtDetails(realCourtId);

  // 弹出场地详情弹窗
  courtDetailDialogVisible.value = true;
}

// 获取场地详情和预约列表
const getCourtDetails = async (courtId: number) => {
  try {
    console.log('查询场地详情，场地ID:', courtId);

    // 首先尝试从场地数据中查找对应的场地信息
    let currentCourtData = courts.value.find(court => court.id === courtId);

    // 如果没找到，尝试重新加载场地数据
    if (!currentCourtData) {
      console.log('未找到场地数据，重新加载');
      await loadCourts(currentVenue.value.id);
      currentCourtData = courts.value.find(court => court.id === courtId);
    }

    if (currentCourtData) {
      currentCourtDetails.value = currentCourtData;
      console.log('场地详情:', currentCourtDetails.value);

      // 调用后端接口获取该场地的所有有效预约信息
      const reservations = await getCourtReservations(courtId);
      console.log('预约记录:', reservations);

      // 过滤出 active 状态的预约
      currentCourtReservations.value = reservations.filter((reservation: any) => reservation.status === 'active');

      console.log('当前登录用户ID:', currentUserId.value);
      // 检查每条预约记录的 userId 与当前用户ID是否匹配
      currentCourtReservations.value.forEach((reservation: any, index: number) => {
        console.log(`预约 ${index + 1} - userId: ${reservation.userId}, 当前用户ID: ${currentUserId.value}, 是否匹配: ${reservation.userId === currentUserId.value}`);
      });

      // 使用 nextTick 强制刷新组件，确保模板使用最新的 currentUserId
      await nextTick();
      console.log('组件已刷新，按钮应正确显示');

    }
  } catch (error: any) {
    console.error('获取场地详情失败:', error);
    ElMessage.error('获取场地信息失败，请重试');
  }
}

// 占用场地
const handleOccupyCourt = async (reservationId: number) => {
  try {
    const userId = currentUserId.value;

    console.log('调用占用场地接口，参数:', {
      reservationId: reservationId,
      userId: userId
    });

    // 调用占用场地接口
    const res = await occupyReservation(reservationId, userId);

    console.log('占用场地接口响应:', res);

    if (res.data.code === 200) {
      ElMessage.success('占用场地成功！');
      // 刷新场地列表
      await loadCourts(currentVenue.value.id);
      // 更新用户活跃状态
      await checkUserActiveStatus();
    } else {
      ElMessage.error(`占用失败：${res.data.msg}`);
    }
  } catch (error: any) {
    console.error('占用场地异常:', error);
    ElMessage.error(`占用失败：${error.response?.data?.msg || '系统内部错误'}`);
  }
}

// 离开场地
const handleLeaveCourt = async (reservationId: number) => {
  try {
    const userId = currentUserId.value;

    console.log('调用离开场地接口，参数:', {
      reservationId: reservationId,
      userId: userId
    });

    // 调用离开场地接口
    const res = await leaveReservation(reservationId, userId);

    console.log('离开场地接口响应:', res);

    if (res.data.code === 200) {
      ElMessage.success('离开场地成功！场地已释放');
      // 关闭场地详情弹窗
      courtDetailDialogVisible.value = false;
      // 刷新场地列表
      await loadCourts(currentVenue.value.id);
      // 更新用户活跃状态
      await checkUserActiveStatus();
    } else {
      ElMessage.error(`离开失败：${res.data.msg}`);
    }
  } catch (error: any) {
    console.error('离开场地异常:', error);
    ElMessage.error(`离开失败：${error.response?.data?.msg || '系统内部错误'}`);
  }
}

// 从详情弹窗占用场地
const handleOccupyCourtFromDetail = (reservationId: number) => {
  // 保存当前要占用的预约ID
  currentOccupyReservationId.value = reservationId;
  // 打开占用确认弹窗
  occupyDialogVisible.value = true;
}

// 确认占用场地
const handleOccupyConfirm = async () => {
  try {
    const userId = currentUserId.value
    const reservationId = currentOccupyReservationId.value

    console.log('调用占用场地接口，参数:', {
      reservationId: reservationId,
      userId: userId
    })

    // 调用占用场地接口
    const res = await occupyReservation(reservationId, userId);

    console.log('占用场地接口响应:', res)

    if (res.data.code === 200) {
      ElMessage.success('占用场地成功！')
      // 关闭占用确认弹窗
      occupyDialogVisible.value = false
      // 关闭场地详情弹窗
      courtDetailDialogVisible.value = false
      // 刷新场地列表
      await loadCourts(currentVenue.value.id)
      // 更新用户活跃状态
      await checkUserActiveStatus();
    } else {
      ElMessage.error(`占用失败：${res.data.msg}`)
    }
  } catch (error: any) {
    console.error('占用场地异常:', error)
    ElMessage.error(`占用失败：${error.response?.data?.msg || '系统内部错误'}`)
  }
}

// 从详情弹窗预约场地
const handleReserveCourtFromDetail = async () => {
  if (!currentCourtDetails.value) {
    ElMessage.error('场地信息不存在')
    return
  }

  courtDetailDialogVisible.value = false

  // 获取预约信息
  const reserveDate = formatDate(selectedDate.value);
  const slot = timeSlots.find((t) => t.id === selectedTimeSlot.value);
  const startTime = slot?.start || '14:00';
  const duration = reservationInfo.value.duration; // 使用用户选择的时长

  // 计算结束时间
  const [hours, minutes] = startTime.split(':').map(Number);
  const endHours = hours + Math.floor((minutes + duration * 60) / 60);
  const endMinutes = (minutes + duration * 60) % 60;
  const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;

  // 弹出确认预约弹窗
  ElMessageBox.confirm(
    `<div class="reservation-form">
      <h3 style="margin-bottom: 16px;">预约信息</h3>
      <div class="form-item">
        <span class="form-label">场地编号：</span>
        <span class="form-value">${currentCourtDetails.value.courtCode}</span>
      </div>
      <div class="form-item">
        <span class="form-label">场馆：</span>
        <span class="form-value">${currentVenue.value.venueName}</span>
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
      type: 'info'
    }
  ).then(async () => {
    try {
      // 调用预约接口
      const response = await createReservation({
        userId: currentUserId.value,
        courtId: currentCourtDetails.value.id,
        venueId: currentVenue.value.id,
        reserveDate,
        startTime,
        duration: duration * 60, // 转换为分钟
        endTime
      });

      if (response.data.code === 200) {
        ElMessage.success('预约成功！');
        // 刷新场地列表
        await loadCourts(currentVenue.value.id);
        // 更新用户活跃状态
        await checkUserActiveStatus();
      } else {
        ElMessage.error(`预约失败：${response.data.msg}`);
      }
    } catch (error: any) {
      console.error('预约失败:', error);
      ElMessage.error(`预约失败：${error.response?.data?.msg || '网络错误'}`);
    }
  }).catch(() => {
    ElMessage.info('已取消预约');
  });
}

// 检查用户是否有活跃的预约或占用记录
const activeReservation = ref<any>(null);

const checkUserActiveStatus = async () => {
  try {
    const userId = currentUserId.value;
    console.log('查询用户活跃状态，用户ID:', userId);

    // 调用查询用户预约记录的接口
    const reservations = await getUserReservations(userId);
    console.log('用户预约记录:', reservations);

    // 过滤出状态为 active 的记录
    const activeList = reservations.filter((item: any) => item.status === 'active');
    hasActiveReservation.value = activeList.length > 0;
    activeReservation.value = activeList[0] || null;
    console.log('用户活跃状态:', hasActiveReservation.value);
    console.log('用户活跃预约:', activeReservation.value);
  } catch (error: any) {
    console.error('调用查询用户预约记录接口失败:', error);
    hasActiveReservation.value = false;
    activeReservation.value = null;
  }
};

// 获取网格样式
const getGridStyle = () => {
  return {
    gridTemplateColumns: `repeat(auto-fill, minmax(100px, 1fr))`,
  }
}
</script>

<template>
  <div class="sports-reservation">
    <GlobalNavbar />

    <div class="main-content">
      <div class="content-area">
        <h1 class="page-title">体育馆预约</h1>

        <!-- 预约信息卡片 -->
        <div class="info-card">
          <h3 class="card-title">预约信息 <span style="font-size: 14px; color: #666; font-weight: normal; margin-left: 10px;">（开放时间：每天7:00-23:00，节假日除外）</span></h3>
          <div class="info-grid">
            <div class="info-item">
              <label>选择日期：</label>
              <el-date-picker
                v-model="selectedDate"
                type="date"
                placeholder="选择日期"
                :disabled-date="(date: Date) => {
                  // 创建一个只包含年月日的今天日期对象
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  // 创建一个只包含年月日的传入日期对象
                  const compareDate = new Date(date);
                  compareDate.setHours(0, 0, 0, 0);
                  // 禁用今天之前的日期
                  return compareDate < today;
                }"
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

        <!-- 场地选择区 -->
        <div class="court-selection-area">
          <!-- 场馆选择 -->
          <div class="venue-selector">
            <h3>选择场馆</h3>
            <div class="venue-buttons">
              <button
                v-for="venue in venues"
                :key="venue.id"
                :class="['venue-btn', { active: currentVenue?.id === venue.id }]"
                @click="handleVenueChange(venue)"
              >
                <span class="venue-icon">{{ venue.venueType === 'basketball' ? '🏀' : venue.venueType === 'badminton' ? '🏸' : venue.venueType === 'tennis' ? '🎾' : venue.venueType === 'tabletennis' ? '🏓' : '🏐' }}</span>
                <span>{{ venue.venueName }}</span>
              </button>
            </div>
          </div>

          <!-- 场地图例 -->
          <div class="court-legend">
            <div class="legend-item">
              <span class="legend-court available"></span>
              <span>可选（可预约）</span>
            </div>
            <div class="legend-item">
              <span class="legend-court occupied"></span>
              <span>已预约（可占用）</span>
            </div>

          </div>

          <!-- 场地图 -->
          <div class="court-map">
            <div class="court-title">
              <span class="venue-icon">{{ currentVenueInfo?.venueType === 'basketball' ? '🏀' : currentVenueInfo?.venueType === 'badminton' ? '🏸' : currentVenueInfo?.venueType === 'tennis' ? '🎾' : currentVenueInfo?.venueType === 'tabletennis' ? '🏓' : '🏐' }}</span>
              <span>{{ currentVenueInfo?.venueName }}场地分布</span>
            </div>
            <div class="court-grid" :style="getGridStyle()">
              <div
                v-for="(court, courtId) in currentVenueCourts"
                :key="courtId"
                :class="getCourtClass(court)"
                @click="handleCourtClick(courtId, court)"
              >
                {{ getCourtLabel(courtId) }}
              </div>
            </div>
          </div>

          <!-- 功能提示 -->
          <div class="seat-tips">
            <div class="tip-item">
              <span class="tip-icon">📝</span>
              <span class="tip-text">点击绿色"可选"座位可直接进行预约</span>
            </div>
            <div class="tip-item">
              <span class="tip-icon">⚡</span>
              <span class="tip-text">若该场地的用户30分钟内未到可点击红色"已预约"座位进行占用</span>
            </div>
            <div class="tip-item">
              <span class="tip-icon">💡</span>
              <span class="tip-text">您最多可同时预约2个场地</span>
            </div>
          </div>

          <!-- 选中的场地信息 -->
          <div v-if="selectedCourts.length > 0" class="selected-info">
            <div class="selected-header">
              <h4>已选场地：</h4>
              <span class="seat-count">{{ selectedCourts.length }}/2</span>
            </div>
            <div class="selected-courts">
              <el-tag
                v-for="courtId in selectedCourts"
                :key="courtId"
                closable
                @close="handleCourtClick(courtId, currentVenueCourts[courtId])"
              >
                {{ getCourtLabel(courtId) }}
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
          <label>场馆：</label>
          <span>{{ reservationInfo.venue }}</span>
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
          <label>场地：</label>
          <span>{{ reservationInfo.courts.join(', ') }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="cancelReservation">取消</el-button>
        <el-button type="primary" @click="submitReservation">确认预约</el-button>
      </template>
    </el-dialog>

    <!-- 场地详情对话框 -->
    <el-dialog
      v-model="courtDetailDialogVisible"
      title="场地详情"
      width="600px"
      :close-on-click-modal="false"
    >
      <div v-if="currentCourtDetails" class="court-detail">
        <div class="detail-item">
          <label>场地编号：</label>
          <span>{{ currentCourtDetails.courtCode }}</span>
        </div>
        <div class="detail-item">
          <label>场馆：</label>
          <span>{{ currentVenueInfo?.venueName }}</span>
        </div>
        <div class="detail-item">
          <label>当前状态：</label>
          <span :class="{
            'status-available': currentCourtDetails.status === 'available',
            'status-reserved': currentCourtDetails.status === 'reserved',
            'status-occupied': currentCourtDetails.status === 'occupied'
          }">
            {{ currentCourtDetails.status === 'available' ? '可用' : currentCourtDetails.status === 'reserved' ? '已预约' : '已占用' }}
          </span>
        </div>

        <div v-if="currentCourtReservations.length > 0" class="reservation-list">
          <h4 style="margin-top: 20px; margin-bottom: 10px;">当前有效预约：</h4>
          <el-table :data="currentCourtReservations" style="width: 100%">
            <el-table-column prop="reserveDate" label="预约日期" width="120" />
            <el-table-column prop="startTime" label="开始时间" width="100" />
            <el-table-column prop="endTime" label="结束时间" width="100" />
            <el-table-column prop="duration" label="时长(分钟)" width="100" />
            <el-table-column prop="userId" label="预约人ID" width="100" />
            <el-table-column label="操作" width="180">
              <template #default="scope">
                <el-button
                  v-if="scope.row.userId === currentUserId"
                  type="primary"
                  size="small"
                  @click="handleLeaveCourt(scope.row.id)"
                >
                  离开场地
                </el-button>
                <el-button
                  v-else
                  type="warning"
                  size="small"
                  @click="handleOccupyCourtFromDetail(scope.row.id)"
                >
                  占用场地
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div v-else class="no-reservation">
          <p style="color: #999; text-align: center; margin-top: 20px;">该场地当前无有效预约</p>
        </div>
      </div>

      <template #footer>
        <el-button @click="courtDetailDialogVisible = false">关闭</el-button>
        <el-button
          type="primary"
          @click="handleReserveCourtFromDetail"
        >
          预约场地
        </el-button>
      </template>
    </el-dialog>

    <!-- 占用确认对话框 -->
    <el-dialog
      v-model="occupyDialogVisible"
      title="确认占用"
      width="400px"
      :close-on-click-modal="false"
    >
      <p>确定要占用该场地吗？</p>
      <p style="color: #faad14; font-size: 12px; margin-top: 10px;">
        注意：只有在预约开始时间后30分钟才能占用该场地
      </p>
      <template #footer>
        <el-button @click="occupyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleOccupyConfirm">确认占用</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.sports-reservation {
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

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 16px;
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

.court-selection-area {
  background: var(--white);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-sm);
}

.venue-selector {
  margin-bottom: 24px;
}

.venue-selector h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 12px;
}

.venue-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.venue-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: 1px solid var(--border-color);
  background: var(--white);
  color: var(--text-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  font-weight: 500;
}

.venue-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.venue-btn.active {
  background: var(--primary-color);
  color: var(--white);
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.venue-icon {
  font-size: 20px;
}

.court-legend {
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

.legend-court {
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

.legend-court.available {
  background: #52c41a;
  border-color: #389e0d;
}

.legend-court.occupied {
  background: #f5222d;
  border-color: #cf1322;
}

.legend-court.selected {
  background: #1890ff;
  border-color: #096dd9;
}

.court-map {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px;
  background: linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%);
  border-radius: 12px;
  overflow: auto;
  border: 2px solid #d6e4ff;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
}

.court-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.court-grid {
  display: grid;
  gap: 16px;
  max-width: 100%;
  padding: 10px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
}

.court {
  width: 100px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid;
  user-select: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  position: relative;
}

.court.available {
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
  color: white;
  border-color: #389e0d;
}

.court.available:hover {
  transform: scale(1.08) translateY(-2px);
  box-shadow: 0 6px 16px rgba(82, 196, 26, 0.5);
}

.court.occupied {
  background: linear-gradient(135deg, #f5222d 0%, #ff4d4f 100%);
  color: white;
  border-color: #cf1322;
  cursor: pointer;
  position: relative;
}

.court.occupied:hover {
  transform: scale(1.08) translateY(-2px);
  box-shadow: 0 6px 16px rgba(245, 34, 45, 0.5);
}

.court.occupied::before {
  content: '';
  position: absolute;
  top: -3px;
  right: -3px;
  width: 14px;
  height: 14px;
  background: #faad14;
  border: 2px solid white;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

.court.occupied::after {
  content: '👆';
  position: absolute;
  top: -6px;
  right: -6px;
  font-size: 9px;
  z-index: 1;
  animation: bounce 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.7;
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

.court.selected {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  color: white;
  border-color: #096dd9;
  box-shadow: 0 6px 16px rgba(24, 144, 255, 0.6);
  transform: scale(1.08) translateY(-2px);
  animation: selectedPulse 2s ease-in-out infinite;
}

@keyframes selectedPulse {
  0%, 100% {
    box-shadow: 0 6px 16px rgba(24, 144, 255, 0.6);
  }
  50% {
    box-shadow: 0 8px 20px rgba(24, 144, 255, 0.8);
  }
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

.selected-courts {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 24px;
  background: var(--white);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
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

.court-detail {
  padding: 16px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color-light);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item label {
  font-weight: 600;
  color: var(--text-color);
}

.detail-item span {
  color: var(--text-color);
}

.status-available {
  color: #52c41a;
  font-weight: 600;
}

.status-reserved {
  color: #faad14;
  font-weight: 600;
}

.status-occupied {
  color: #f5222d;
  font-weight: 600;
}

.reservation-list {
  margin-top: 20px;
}

.no-reservation {
  padding: 40px 0;
  text-align: center;
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

  .court-legend {
    flex-wrap: wrap;
    gap: 12px;
  }

  .venue-buttons {
    gap: 8px;
  }

  .venue-btn {
    padding: 10px 16px;
    font-size: 13px;
  }

  .court {
    width: 80px;
    height: 60px;
    font-size: 12px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-buttons .el-button {
    width: 100%;
  }
}
</style>
