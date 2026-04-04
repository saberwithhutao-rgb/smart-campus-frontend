import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/api'
import type { StudyTask } from './studyPlan'
import { STORAGE_KEYS } from '@/utils/storageKeys'

export interface GeneratingTask {
  startTime: number
}

export const useReviewDetailStore = defineStore('reviewDetail', () => {
  const currentReviewPlan = ref<StudyTask | null>(null)
  const historyPlans = ref<StudyTask[]>([])
  const isLoading = ref(false)
  // 改为按 taskId 存储的生成状态
  const isGeneratingMap = ref<Map<number, boolean>>(new Map())
  const generatingTasks = ref<Map<number, GeneratingTask>>(new Map())
  const showHistoryDialog = ref(false)
  const currentHistoryPlan = ref<StudyTask | null>(null)

  // ========== 手动持久化相关方法 ==========
  const STORAGE_KEY = STORAGE_KEYS.REVIEW_DETAIL_GENERATING_TASKS || 'reviewDetail_generatingTasks'

  const saveGeneratingTasks = () => {
    const tasks: Record<number, { startTime: number }> = {}
    generatingTasks.value.forEach((value, key) => {
      tasks[key] = value
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }

  const restoreGeneratingTasks = () => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const tasks = JSON.parse(stored) as Record<number, { startTime: number }>
        Object.entries(tasks).forEach(([key, value]) => {
          const taskId = Number(key)
          generatingTasks.value.set(taskId, value)
          isGeneratingMap.value.set(taskId, true)
        })
        console.log('恢复复习生成任务:', Array.from(generatingTasks.value.keys()))
      } catch (e) {
        console.error('恢复复习生成任务失败:', e)
      }
    }
  }

  const clearGeneratingTask = (taskId: number) => {
    isGeneratingMap.value.delete(taskId)
    generatingTasks.value.delete(taskId)
    saveGeneratingTasks()
  }
  // ========== 手动持久化相关方法结束 ==========

  // 检查某个任务是否正在生成
  const isGenerating = (taskId: number): boolean => {
    return isGeneratingMap.value.get(taskId) === true
  }

  // 开始生成
  const startGenerating = (taskId: number) => {
    isGeneratingMap.value.set(taskId, true)
    generatingTasks.value.set(taskId, { startTime: Date.now() })
    saveGeneratingTasks()
  }

  // 结束生成
  const finishGenerating = (taskId: number) => {
    isGeneratingMap.value.delete(taskId)
    generatingTasks.value.delete(taskId)
    saveGeneratingTasks()
  }

  // 获取开始时间
  const getGeneratingStartTime = (taskId: number): number | null => {
    const task = generatingTasks.value.get(taskId)
    return task?.startTime ?? null
  }

  const fetchReviewPlanDetail = async (planId: number) => {
    isLoading.value = true
    try {
      const task = (await api.getReviewTaskDetail(planId)) as unknown as StudyTask
      currentReviewPlan.value = task
    } catch (error) {
      console.error('获取复习计划详情失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  const fetchHistoryPlans = async (studyPlanId: number) => {
    isLoading.value = true
    try {
      const response = (await api.getReviewPlanHistory(studyPlanId)) as unknown as StudyTask[]
      historyPlans.value = response
    } catch (error) {
      console.error('获取历史复习计划失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  const openHistoryDialog = async (studyPlanId: number) => {
    showHistoryDialog.value = true
    await fetchHistoryPlans(studyPlanId)
  }

  const viewHistoryPlan = (plan: StudyTask) => {
    currentHistoryPlan.value = plan
  }

  const backToHistoryList = () => {
    currentHistoryPlan.value = null
  }

  // 初始化时恢复持久化数据
  restoreGeneratingTasks()

  return {
    currentReviewPlan,
    historyPlans,
    isLoading,
    showHistoryDialog,
    currentHistoryPlan,
    // 生成状态相关
    isGenerating,
    startGenerating,
    finishGenerating,
    getGeneratingStartTime,
    clearGeneratingTask,
    // 业务方法
    fetchReviewPlanDetail,
    fetchHistoryPlans,
    openHistoryDialog,
    viewHistoryPlan,
    backToHistoryList,
  }
})
