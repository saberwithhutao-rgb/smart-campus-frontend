// composables/useReviewReminder.ts
import { ref, computed, watch } from 'vue'
import { useStudyPlanStore } from '@/stores/studyPlan'
import { useUserStore } from '@/stores/user'
import { STORAGE_KEYS } from '@/utils/storageKeys'

export function useReviewReminder() {
  const studyPlanStore = useStudyPlanStore()
  const userStore = useUserStore()

  // 红点状态（最底层）
  const hasPending = ref(false)
  const pendingCount = ref(0)
  const overdueCount = ref(0)

  // 防止重复请求的标志
  let isRefreshing = false

  // 是否已登录
  const isLoggedIn = computed(() => userStore.userState.isLoggedIn)

  // 用户是否开启复习提醒
  const isReminderEnabled = computed(() => {
    const settings = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS)
    if (!settings) return true
    try {
      const parsed = JSON.parse(settings)
      return parsed.studyReminder !== false
    } catch {
      return true
    }
  })

  // 获取今天的日期字符串 YYYY-MM-DD
  const getTodayString = (): string => {
    const today = new Date()
    return today.toISOString().split('T')[0] ?? ''
  }

  // 检查今天是否已经提醒过（用于横幅）
  const hasRemindedToday = (): boolean => {
    const lastDate = localStorage.getItem(STORAGE_KEYS.STUDY_REMINDER_LAST_DATE)
    return lastDate === getTodayString()
  }

  // 标记今日已提醒
  const markRemindedToday = (): void => {
    localStorage.setItem(STORAGE_KEYS.STUDY_REMINDER_LAST_DATE, getTodayString())
  }

  // 重置提醒状态（跨日时调用）
  const resetIfNewDay = (): void => {
    const lastDate = localStorage.getItem(STORAGE_KEYS.STUDY_REMINDER_LAST_DATE)
    const today = getTodayString()
    if (lastDate !== today) {
      localStorage.removeItem(STORAGE_KEYS.STUDY_REMINDER_LAST_DATE)
    }
  }

  // 计算待复习任务状态（从 store 中计算，不发起请求）
  const updatePendingStatus = () => {
    const tasks = studyPlanStore.allReviewTasks
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 计算待复习任务（pending 且 taskDate <= 今天）
    const pendingTasks = tasks.filter((task) => {
      if (task.status !== 'pending') return false
      const taskDate = new Date(task.taskDate)
      taskDate.setHours(0, 0, 0, 0)
      return taskDate <= today
    })

    // 计算逾期任务（pending 且 taskDate < 今天）
    const overdueTasks = tasks.filter((task) => {
      if (task.status !== 'pending') return false
      const taskDate = new Date(task.taskDate)
      taskDate.setHours(0, 0, 0, 0)
      return taskDate < today
    })

    hasPending.value = pendingTasks.length > 0
    pendingCount.value = pendingTasks.length
    overdueCount.value = overdueTasks.length

    console.log('[复习提醒] 状态更新:', {
      hasPending: hasPending.value,
      pendingCount: pendingCount.value,
      overdueCount: overdueCount.value,
    })
  }

  // 刷新待复习任务状态（从服务器获取数据）
  const refreshPendingStatus = async () => {
    if (isRefreshing) {
      console.log('[复习提醒] 已有请求进行中，跳过')
      return
    }

    if (!isLoggedIn.value) {
      hasPending.value = false
      pendingCount.value = 0
      overdueCount.value = 0
      return
    }

    try {
      isRefreshing = true

      await studyPlanStore.fetchPendingTasks()
      await studyPlanStore.fetchAllReviewTasks()

      updatePendingStatus()
    } catch (error) {
      console.error('[复习提醒] 刷新状态失败:', error)
    } finally {
      isRefreshing = false
    }
  }

  // 监听 allReviewTasks 的变化
  watch(
    () => studyPlanStore.allReviewTasks,
    () => {
      updatePendingStatus()
    },
    { deep: true },
  )

  // 监听登录状态变化
  watch(
    isLoggedIn,
    async (loggedIn) => {
      if (loggedIn) {
        await refreshPendingStatus()
      } else {
        hasPending.value = false
        pendingCount.value = 0
        overdueCount.value = 0
      }
    },
    { immediate: true },
  )

  // 每日重置提醒状态
  const checkAndResetDaily = () => {
    resetIfNewDay()
  }

  // 初始化
  const init = async () => {
    checkAndResetDaily()
    if (isLoggedIn.value) {
      await refreshPendingStatus()
    }
  }

  setTimeout(() => {
    init()
  }, 100)

  return {
    // 最底层状态（智能复习的红点）
    hasPending,
    pendingCount,
    overdueCount,

    // 方法
    refreshPendingStatus,
    markRemindedToday,
    hasRemindedToday,
    resetIfNewDay,
    getTodayString,
    isReminderEnabled,
  }
}
