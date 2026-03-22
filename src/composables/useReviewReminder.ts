// composables/useReviewReminder.ts
import { ref, computed, watch } from 'vue'
import { useStudyPlanStore } from '@/stores/studyPlan'
import { useUserStore } from '@/stores/user'
import { STORAGE_KEYS } from '@/utils/storageKeys'

export interface ReviewReminderState {
  hasPendingTasks: boolean // 是否有待复习任务
  pendingCount: number // 待复习任务数量
  overdueCount: number // 逾期任务数量
  lastCheckDate: string | null // 上次检查日期
  lastRemindedDate: string | null // 上次提醒日期
}

export function useReviewReminder() {
  const studyPlanStore = useStudyPlanStore()
  const userStore = useUserStore()

  // 红点状态
  const hasPending = ref(false)
  const pendingCount = ref(0)
  const overdueCount = ref(0)

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

  // 刷新待复习任务状态
  const refreshPendingStatus = async () => {
    if (!isLoggedIn.value) {
      hasPending.value = false
      pendingCount.value = 0
      overdueCount.value = 0
      return
    }

    try {
      // 获取待复习任务
      await studyPlanStore.fetchPendingTasks()
      await studyPlanStore.fetchAllReviewTasks()

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

      console.log('[复习提醒] 状态刷新:', {
        hasPending: hasPending.value,
        pendingCount: pendingCount.value,
        overdueCount: overdueCount.value,
      })
    } catch (error) {
      console.error('[复习提醒] 刷新状态失败:', error)
    }
  }

  // 标记已查看（点击进入复习页面时调用）
  const markAsViewed = () => {
    // 可选：记录用户已查看，但不影响红点状态
    // 红点只在任务完成时消失
  }

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

  // 监听复习任务变化（当任务完成时自动刷新）
  watch(
    () => studyPlanStore.allReviewTasks,
    async () => {
      await refreshPendingStatus()
    },
    { deep: true },
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

  init()

  return {
    // 状态
    hasPending, // 是否有待复习任务（用于红点）
    pendingCount, // 待复习数量（用于显示数字）
    overdueCount, // 逾期数量

    // 方法
    refreshPendingStatus,
    markRemindedToday,
    hasRemindedToday,
    markAsViewed,
    resetIfNewDay,
    getTodayString,
    isReminderEnabled, // 用户是否开启复习提醒
  }
}
