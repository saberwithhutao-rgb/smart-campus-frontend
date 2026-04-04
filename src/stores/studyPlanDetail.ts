// stores/studyPlanDetail.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '@/api'
import type { GeneratePlanResponse } from '@/api/index'
import { STORAGE_KEYS } from '@/utils/storageKeys'

// 数据库中的计划详情实体
export interface StudyPlanDetail {
  id: number
  studyPlanId: number
  duration: string
  level: 'easy' | 'medium' | 'hard'
  planDetails: string
  createdAt: string
}

export interface StudyPlanDetailWithParsed {
  id: number
  studyPlanId: number
  duration: string
  level: 'easy' | 'medium' | 'hard'
  plan: string
  createdAt: string
  cancelled?: boolean
}

export interface GeneratePlanParams {
  title: string
  studyPlanId: number
  subject: string
  duration: string
  level: string
}

export interface GeneratingTask {
  startTime: number
}

export const useStudyPlanDetailStore = defineStore('studyPlanDetail', () => {
  // 当前计划详情（按 studyPlanId 存储）
  const currentPlanDetails = ref<Map<number, StudyPlanDetailWithParsed>>(new Map())
  // 历史计划列表（按 studyPlanId 存储）
  const historyPlans = ref<Map<number, StudyPlanDetailWithParsed[]>>(new Map())
  // 是否显示历史弹窗
  const showHistoryDialog = ref(false)
  // 当前查看的历史计划
  const currentHistoryPlan = ref<StudyPlanDetailWithParsed | null>(null)

  // 按 planId 存储的生成状态
  const isGeneratingMap = ref<Map<number, boolean>>(new Map())
  // 生成任务信息（开始时间戳）
  const generatingTasks = ref<Map<number, GeneratingTask>>(new Map())

  const isLoading = ref(false)

  // ========== 手动持久化相关方法 ==========
  const STORAGE_KEY = STORAGE_KEYS.STUDY_PLAN_DETAIL_GENERATING_TASKS

  // 保存 generatingTasks 到 localStorage
  const saveGeneratingTasks = () => {
    const tasks: Record<number, { startTime: number }> = {}
    generatingTasks.value.forEach((value, key) => {
      tasks[key] = value
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }

  // 从 localStorage 恢复 generatingTasks
  const restoreGeneratingTasks = () => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const tasks = JSON.parse(stored) as Record<number, { startTime: number }>
        const newMap = new Map<number, GeneratingTask>()
        Object.entries(tasks).forEach(([key, value]) => {
          const planId = Number(key)
          newMap.set(planId, value)
          // 同时恢复 isGeneratingMap
          isGeneratingMap.value.set(planId, true)
        })
        generatingTasks.value = newMap
        console.log('恢复生成任务:', Array.from(generatingTasks.value.keys()))
      } catch (e) {
        console.error('恢复生成任务失败:', e)
      }
    }
  }

  // 清除指定计划的生成任务（同时清除存储）
  const clearGeneratingTask = (studyPlanId: number) => {
    isGeneratingMap.value.delete(studyPlanId)
    generatingTasks.value.delete(studyPlanId)
    saveGeneratingTasks()
  }

  // 清除所有生成任务
  const clearAllGeneratingTasks = () => {
    isGeneratingMap.value.clear()
    generatingTasks.value.clear()
    localStorage.removeItem(STORAGE_KEY)
  }
  // ========== 手动持久化相关方法结束 ==========

  // 检查某个计划是否正在生成
  const isGenerating = (studyPlanId: number): boolean => {
    return isGeneratingMap.value.get(studyPlanId) === true
  }

  // 开始生成（记录状态和开始时间）
  const startGenerating = (studyPlanId: number) => {
    isGeneratingMap.value.set(studyPlanId, true)
    generatingTasks.value.set(studyPlanId, { startTime: Date.now() })
    saveGeneratingTasks() // 持久化
  }

  // 结束生成（清除状态）
  const finishGenerating = (studyPlanId: number) => {
    isGeneratingMap.value.delete(studyPlanId)
    generatingTasks.value.delete(studyPlanId)
    saveGeneratingTasks() // 持久化
  }

  // 获取生成任务的开始时间（用于恢复计时器）
  const getGeneratingStartTime = (studyPlanId: number): number | null => {
    const task = generatingTasks.value.get(studyPlanId)
    return task?.startTime ?? null
  }

  // 获取所有正在生成中的计划ID列表
  const getGeneratingPlanIds = (): number[] => {
    return Array.from(generatingTasks.value.keys())
  }

  // 获取最后一次生成的计划
  const fetchLatestPlan = async (studyPlanId: number) => {
    isLoading.value = true
    try {
      const response = await api.getStudyPlanDetails(studyPlanId)

      if (response && Array.isArray(response)) {
        const sorted = response.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )

        const latest = sorted[0]
        if (!latest) {
          return null
        }
        const parsedPlan: StudyPlanDetailWithParsed = {
          id: latest.id,
          studyPlanId: latest.studyPlanId,
          duration: latest.duration,
          level: latest.level,
          plan: latest.planDetails,
          createdAt: latest.createdAt,
        }
        currentPlanDetails.value.set(studyPlanId, parsedPlan)
        return parsedPlan
      }
      return null
    } catch (error) {
      console.error('获取最新计划失败:', error)
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 获取全部历史
  const fetchHistoryPlans = async (studyPlanId: number) => {
    isLoading.value = true
    try {
      const response = await api.getStudyPlanDetails(studyPlanId)

      if (response && Array.isArray(response)) {
        const sorted = response.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )

        const history = sorted.map((item) => ({
          id: item.id,
          studyPlanId: item.studyPlanId,
          duration: item.duration,
          level: item.level,
          plan: item.planDetails,
          createdAt: item.createdAt,
        }))

        historyPlans.value.set(studyPlanId, history)
        return history
      }
      return []
    } catch (error) {
      console.error('获取历史计划失败:', error)
      return []
    } finally {
      isLoading.value = false
    }
  }

  const generatePlanDetail = async (params: GeneratePlanParams) => {
    const planId = params.studyPlanId

    // 如果已经在生成中，不允许重复生成
    if (isGenerating(planId)) {
      ElMessage.warning('该计划正在生成中，请稍后')
      return null
    }

    // 记录开始生成
    startGenerating(planId)

    try {
      const response = (await api.generatePlanDetail(params)) as unknown as GeneratePlanResponse

      if (response) {
        const newDetail: StudyPlanDetailWithParsed = {
          id: response.detailId,
          studyPlanId: params.studyPlanId,
          duration: params.duration,
          level: params.level as 'easy' | 'medium' | 'hard',
          plan: response.plan,
          createdAt: new Date().toISOString(),
          cancelled: response.cancelled,
        }

        currentPlanDetails.value.set(params.studyPlanId, newDetail)

        const currentHistory = historyPlans.value.get(params.studyPlanId) || []
        historyPlans.value.set(params.studyPlanId, [newDetail, ...currentHistory])

        ElMessage.success('学习计划生成成功')
        return newDetail
      } else {
        ElMessage.error('生成计划失败')
        return null
      }
    } catch (error) {
      console.error('生成计划失败:', error)
      ElMessage.error('生成计划失败: ' + (error instanceof Error ? error.message : '未知错误'))
      return null
    } finally {
      // 无论成功还是失败，都清除生成状态
      finishGenerating(planId)
    }
  }

  const getCurrentPlanDetail = (studyPlanId: number) => {
    return currentPlanDetails.value.get(studyPlanId) || null
  }

  const getHistoryPlans = (studyPlanId: number) => {
    return historyPlans.value.get(studyPlanId) || []
  }

  const openHistoryDialog = (studyPlanId: number) => {
    showHistoryDialog.value = true
    fetchHistoryPlans(studyPlanId)
  }

  const closeHistoryDialog = () => {
    showHistoryDialog.value = false
    currentHistoryPlan.value = null
  }

  const viewHistoryPlan = (plan: StudyPlanDetailWithParsed) => {
    currentHistoryPlan.value = plan
  }

  const backToHistoryList = () => {
    currentHistoryPlan.value = null
  }

  const clearPlanDetail = (studyPlanId: number) => {
    currentPlanDetails.value.delete(studyPlanId)
    historyPlans.value.delete(studyPlanId)
    clearGeneratingTask(studyPlanId)
  }

  // 在 Store 初始化时自动恢复持久化数据
  restoreGeneratingTasks()

  return {
    // 状态
    isLoading,
    showHistoryDialog,
    currentHistoryPlan,

    // 生成状态相关
    isGenerating,
    startGenerating,
    finishGenerating,
    getGeneratingStartTime,
    getGeneratingPlanIds,
    clearAllGeneratingTasks,

    // 业务方法
    generatePlanDetail,
    fetchLatestPlan,
    fetchHistoryPlans,
    getCurrentPlanDetail,
    getHistoryPlans,
    openHistoryDialog,
    closeHistoryDialog,
    viewHistoryPlan,
    backToHistoryList,
    clearPlanDetail,
  }
})
