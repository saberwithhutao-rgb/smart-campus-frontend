import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

export function useReservationCount() {
  const activeCount = ref(0)
  const isLoading = ref(false)

  // 最大预约数量
  const MAX_RESERVATIONS = 3

  // 检查用户是否达到最大预约数量
  const isAtMaxLimit = computed(() => activeCount.value >= MAX_RESERVATIONS)

  // 查询用户当前活跃预约数量
  const fetchActiveReservationCount = async (userId: number) => {
    try {
      isLoading.value = true
      const response = await axios.get(`/api/library/reservations/user/${userId}`)
      
      if (response.data.code === 200) {
        const reservations = response.data.data || []
        // 过滤出状态为 active 的记录
        const activeReservations = reservations.filter((item: any) => item.status === 'active')
        activeCount.value = activeReservations.length
        console.log('用户活跃预约数量:', activeCount.value)
      } else {
        console.error('查询用户预约记录失败:', response.data.msg)
        activeCount.value = 0
      }
    } catch (error) {
      console.error('调用查询用户预约记录接口失败:', error)
      activeCount.value = 0
    } finally {
      isLoading.value = false
    }
  }

  // 检查并提示用户是否达到最大预约数量
  const checkReservationLimit = (): boolean => {
    if (isAtMaxLimit.value) {
      ElMessage.warning('您最多只能同时预约/占用3个座位，请完成现有预约后再操作')
      return false
    }
    return true
  }

  return {
    activeCount,
    isLoading,
    isAtMaxLimit,
    fetchActiveReservationCount,
    checkReservationLimit
  }
}