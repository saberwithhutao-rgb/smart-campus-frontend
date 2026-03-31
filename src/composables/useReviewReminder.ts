import { ref, computed, watch } from 'vue'
import { useStudyPlanStore } from '@/stores/studyPlan'
import { useUserStore } from '@/stores/user'
import { useSettingsStore } from '@/stores/settings'
import { STORAGE_KEYS } from '@/utils/storageKeys'

let singletonInstance: ReturnType<typeof createReviewReminder> | null = null

function createReviewReminder() {
  const studyPlanStore = useStudyPlanStore()
  const userStore = useUserStore()
  const settingsStore = useSettingsStore()

  const hasPendingRaw = ref(false)
  const pendingCount = ref(0)
  const overdueCount = ref(0)
  const showRedDot = ref(false)

  let isRefreshing = false
  let refreshPromise: Promise<void> | null = null

  const isLoggedIn = computed(() => userStore.userState.isLoggedIn)
  const isReminderEnabled = computed(() => settingsStore.settings.studyReminder)

  const getTodayString = (): string => {
    const today = new Date()
    return today.toISOString().split('T')[0] ?? ''
  }

  const getLastViewedDate = (): string | null => {
    return localStorage.getItem('review_reminder_last_viewed')
  }

  const markAsViewed = (): void => {
    const today = getTodayString()
    localStorage.setItem('review_reminder_last_viewed', today)
    updateRedDotState()
  }

  const updateRedDotState = () => {
    if (!isReminderEnabled.value) {
      showRedDot.value = false
      return
    }

    if (!hasPendingRaw.value) {
      showRedDot.value = false
      return
    }

    const lastViewedDate = getLastViewedDate()
    const today = getTodayString()

    if (lastViewedDate === today) {
      showRedDot.value = false
    } else {
      showRedDot.value = true
    }
  }

  const updatePendingStatus = () => {
    const tasks = studyPlanStore.allReviewTasks
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const pendingTasks = tasks.filter((task) => {
      if (task.status !== 'pending') return false
      const taskDate = new Date(task.taskDate)
      taskDate.setHours(0, 0, 0, 0)
      return taskDate <= today
    })

    const overdueTasks = tasks.filter((task) => {
      if (task.status !== 'pending') return false
      const taskDate = new Date(task.taskDate)
      taskDate.setHours(0, 0, 0, 0)
      return taskDate < today
    })

    const oldHasPending = hasPendingRaw.value
    hasPendingRaw.value = pendingTasks.length > 0
    pendingCount.value = pendingTasks.length
    overdueCount.value = overdueTasks.length

    if (oldHasPending && !hasPendingRaw.value) {
      localStorage.removeItem('review_reminder_last_viewed')
    }

    updateRedDotState()
  }

  const refreshPendingStatus = async () => {
    if (refreshPromise) {
      return refreshPromise
    }

    if (isRefreshing) return

    if (!isLoggedIn.value) {
      hasPendingRaw.value = false
      pendingCount.value = 0
      overdueCount.value = 0
      showRedDot.value = false
      return
    }

    try {
      isRefreshing = true
      refreshPromise = (async () => {
        await studyPlanStore.fetchStudyPlans()
        await studyPlanStore.fetchPendingTasks()
        await studyPlanStore.fetchAllReviewTasks()
        updatePendingStatus()
      })()

      await refreshPromise
    } catch (error) {
      console.error('[复习提醒] 刷新状态失败:', error)
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  }

  watch(
    () => studyPlanStore.allReviewTasks,
    () => {
      updatePendingStatus()
    },
    { deep: true },
  )

  watch(
    isLoggedIn,
    async (loggedIn) => {
      if (loggedIn) {
        await refreshPendingStatus()
      } else {
        hasPendingRaw.value = false
        pendingCount.value = 0
        overdueCount.value = 0
        showRedDot.value = false
      }
    },
    { immediate: true },
  )

  watch(
    () => isReminderEnabled.value,
    () => {
      updateRedDotState()
    },
  )

  const resetIfNewDay = () => {
    const lastDate = localStorage.getItem(STORAGE_KEYS.STUDY_REMINDER_LAST_DATE)
    const today = getTodayString()
    if (lastDate !== today) {
      localStorage.removeItem(STORAGE_KEYS.STUDY_REMINDER_LAST_DATE)
    }
  }

  const hasRemindedToday = (): boolean => {
    const lastDate = localStorage.getItem(STORAGE_KEYS.STUDY_REMINDER_LAST_DATE)
    return lastDate === getTodayString()
  }

  const markRemindedToday = (): void => {
    localStorage.setItem(STORAGE_KEYS.STUDY_REMINDER_LAST_DATE, getTodayString())
  }

  resetIfNewDay()

  return {
    showRedDot,
    pendingCount,
    overdueCount,
    refreshPendingStatus,
    markRemindedToday,
    hasRemindedToday,
    markAsViewed,
    resetIfNewDay,
    getTodayString,
    isReminderEnabled,
  }
}

export function useReviewReminder() {
  if (!singletonInstance) {
    singletonInstance = createReviewReminder()
    console.log('[复习提醒] 创建全局单例实例')
  }
  return singletonInstance
}
