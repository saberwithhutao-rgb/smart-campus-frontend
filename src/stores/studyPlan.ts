// stores/studyPlan.ts
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '@/api'
import * as studyApi from '@/api/study'
import type { ReviewSuggestion } from '@/api/study'
import type { StudyPlanDetail } from '@/stores/studyPlanDetail'

export interface StudyPlan {
  id: number
  userId: number
  title: string
  description: string | null
  planType: 'review' | 'learning' | 'project'
  subject: string | null
  difficulty: 'easy' | 'medium' | 'hard'
  status: 'active' | 'completed' | 'paused'
  startDate: string
  endDate: string | null
  createdAt: string
  updatedAt: string
  studyPlanDetails?: StudyPlanDetail[]
  latestDetailId?: number
}

export interface StudyTask {
  id: number
  planId: number
  userId: number
  title: string
  description: string | null
  currentSuggestion?: ReviewSuggestion | null
  taskDate: string
  scheduledTime: string | null
  durationMinutes: number
  status: 'pending' | 'in_progress' | 'completed'
  reviewStage: number
  completedAt: string | null
  createdAt: string
}

export type StudyPlansResponse = {
  list: StudyPlan[]
  total: number
  page: number
  size: number
  totalPages: number
}

export interface ReviewItem {
  id: number
  planId: number
  userId: number
  title: string
  description: string | null
  taskDate: string
  scheduledTime: string | null
  durationMinutes: number
  status: 'pending' | 'in_progress' | 'completed'
  reviewStage: number
  completedAt: string | null
  createdAt: string
}

// 创建计划参数
export interface CreateStudyPlanParams {
  title: string
  description?: string
  planType?: 'review' | 'learning' | 'project'
  subject: string
  difficulty?: 'easy' | 'medium' | 'hard'
  startDate: string
  endDate?: string
}

// 查询参数
export interface StudyPlanQueryParams {
  page?: number
  size?: number
  status?: 'active' | 'completed' | 'paused'
  planType?: 'review' | 'learning' | 'project'
  subject?: string
}

export const useStudyPlanStore = defineStore('studyPlan', () => {
  // ----- 状态 -----
  const studyPlans = ref<StudyPlan[]>([])
  const reviewItems = ref<StudyTask[]>([])
  const allReviewTasks = ref<StudyTask[]>([])
  const isLoading = ref(false)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const total = ref(0)
  const selectedPlan = ref<StudyPlan | null>(null)

  let pendingTasksCache: StudyTask[] | null = null
  let allTasksCache: StudyTask[] | null = null

  // ----- 计算属性 -----
  const completionRate = computed(() => {
    if (studyPlans.value.length === 0) return 0
    const completedCount = studyPlans.value.filter((plan) => plan.status === 'completed').length
    return Math.round((completedCount / studyPlans.value.length) * 100)
  })

  const activeCount = computed(() => {
    return studyPlans.value.filter((plan) => plan.status === 'active').length
  })

  const completedPlans = computed(() => {
    return studyPlans.value.filter((plan) => plan.status === 'completed')
  })

  // 获取有计划详情的计划
  const plansWithDetails = computed(() => {
    return studyPlans.value.filter((plan) => plan.latestDetailId)
  })

  // 新增：待复习任务（pending 且 日期 <= 今天）
  const pendingTasks = computed(() =>
    allReviewTasks.value.filter(
      (task) =>
        task.status === 'pending' && task.reviewStage >= 1 && new Date(task.taskDate) <= new Date(),
    ),
  )

  // 已完成的任务
  const completedTasks = computed(() =>
    allReviewTasks.value.filter((task) => task.reviewStage >= 1),
  )

  // ----- 复习任务相关方法 -----
  const fetchPendingTasks = async (force = false) => {
    if (!force && pendingTasksCache !== null) {
      console.log('[缓存] 使用 pending 缓存')
      reviewItems.value = pendingTasksCache
      return pendingTasksCache
    }
    isLoading.value = true
    try {
      const response = await api.getPendingTasks()
      if (Array.isArray(response)) {
        const today = new Date().toISOString().split('T')[0] ?? ''
        reviewItems.value = response.filter(
          (item: StudyTask) => item.taskDate <= today || item.reviewStage === 0,
        )
      } else {
        reviewItems.value = []
      }
      pendingTasksCache = reviewItems.value
    } catch (error) {
      reviewItems.value = []
      console.error('获取待复习任务失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  const fetchAllReviewTasks = async (force = false) => {
    if (!force && allTasksCache !== null) {
      console.log('[缓存] 使用 all 缓存')
      allReviewTasks.value = allTasksCache
      return allTasksCache
    }
    try {
      const response = await studyApi.getAllReviewTasks()
      console.log('getAllReviewTasks 返回:', response)
      allReviewTasks.value = response
    } catch (error) {
      console.error('获取复习任务失败:', error)
      allReviewTasks.value = []
    }
  }

  // ✅ 清除缓存（任务完成后调用）
  const clearCache = () => {
    console.log('[缓存] 清除缓存')
    pendingTasksCache = null
    allTasksCache = null
  }

  // ✅ 强制刷新（清除缓存后重新请求）
  const refreshReviewTasks = async () => {
    clearCache()
    await Promise.all([fetchPendingTasks(true), fetchAllReviewTasks(true)])
  }

  const completeTask = async (id: number) => {
    const taskIndex = reviewItems.value.findIndex((item) => item.id === id)
    if (taskIndex === -1 || !reviewItems.value[taskIndex]) return

    const originalTask: StudyTask = { ...reviewItems.value[taskIndex] }

    reviewItems.value[taskIndex] = {
      ...reviewItems.value[taskIndex],
      status: 'completed',
    }

    try {
      const response = await api.completeTask(id)

      if (response) {
        ElMessage.success('任务已完成')
        reviewItems.value[taskIndex] = response.data
      }
    } catch (error) {
      reviewItems.value[taskIndex] = originalTask
      console.error('完成任务失败:', error)
    }
  }

  const fetchStudyPlans = async (params?: StudyPlanQueryParams) => {
    isLoading.value = true
    try {
      const response = (await api.getStudyPlans({
        page: params?.page || currentPage.value,
        size: params?.size || pageSize.value,
        ...(params?.status && { status: params.status }),
        ...(params?.planType && { planType: params.planType }),
        ...(params?.subject && { subject: params.subject }),
      })) as unknown as StudyPlansResponse

      if (response) {
        studyPlans.value = response.list
        total.value = response.total
        currentPage.value = response.page
        pageSize.value = response.size
      }
      return studyPlans.value
    } catch (error) {
      console.error('获取学习计划失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  const getPlanById = async (id: number) => {
    isLoading.value = true
    try {
      const response = await api.getStudyPlan(id)
      if (response) {
        selectedPlan.value = response.data
        return response
      }
    } catch (error) {
      console.error('获取学习计划详情失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  const addPlan = async (planData: CreateStudyPlanParams) => {
    isLoading.value = true
    try {
      const response = await api.createStudyPlan({
        title: planData.title,
        description: planData.description,
        planType: planData.planType ?? 'learning',
        subject: planData.subject,
        difficulty: planData.difficulty || 'medium',
        startDate: planData.startDate,
        endDate: planData.endDate,
      })

      if (response) {
        ElMessage.success('创建学习计划成功')
        await fetchStudyPlans()
        return response.data
      }
    } catch (error) {
      console.error('创建学习计划失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  const updatePlan = async (id: number, planData: Partial<StudyPlan>) => {
    isLoading.value = true
    try {
      const response = await api.updateStudyPlan(id, {
        title: planData.title,
        description: planData.description ?? undefined,
        planType: planData.planType,
        subject: planData.subject ?? undefined,
        difficulty: planData.difficulty,
        status: planData.status,
        startDate: planData.startDate,
        endDate: planData.endDate ?? undefined,
      })

      if (response) {
        ElMessage.success('更新学习计划成功')
        await fetchStudyPlans()
        return response.data
      }
    } catch (error) {
      console.error('更新学习计划失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  const deletePlan = async (id: number) => {
    isLoading.value = true
    try {
      const response = await api.deleteStudyPlan(id)
      if (response) {
        ElMessage.success('删除学习计划成功')
        await fetchStudyPlans()
      }
    } catch (error) {
      console.error('删除学习计划失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  const togglePlanComplete = async (id: number) => {
    isLoading.value = true
    let planIndex = -1
    let originalPlan: StudyPlan | null = null

    try {
      planIndex = studyPlans.value.findIndex((p) => p.id === id)
      if (planIndex === -1) return

      const targetPlan = studyPlans.value[planIndex]
      if (!targetPlan) return

      originalPlan = { ...targetPlan }
      const newStatus = originalPlan.status === 'completed' ? 'active' : 'completed'

      // 乐观更新
      studyPlans.value[planIndex] = {
        ...originalPlan,
        status: newStatus,
      }

      const response = await api.togglePlanComplete(id)

      const responseData = response.data || response

      // 成功 - 用后端返回的数据更新
      studyPlans.value[planIndex] = {
        ...studyPlans.value[planIndex],
        ...responseData,
      }

      ElMessage.success('状态切换成功')
    } catch (error: unknown) {
      if (planIndex !== -1 && originalPlan) {
        studyPlans.value[planIndex] = originalPlan
      }
      console.error('切换计划状态失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  // 更新计划的最新详情ID（由详情store调用）
  const updatePlanLatestDetail = (planId: number, detailId: number) => {
    const plan = studyPlans.value.find((p) => p.id === planId)
    if (plan) {
      plan.latestDetailId = detailId
    }
    if (selectedPlan.value?.id === planId) {
      selectedPlan.value.latestDetailId = detailId
    }
  }

  // 已完成的学习计划及其复习状态
  const completedPlansWithReviewStatus = computed(() => {
    const completedPlans = studyPlans.value.filter((plan) => plan.status === 'completed')

    return completedPlans.map((plan) => {
      const planTasks = allReviewTasks.value.filter((task) => task.planId === plan.id)

      if (planTasks.length === 0) {
        return {
          ...plan,
          reviewStatus: {
            type: 'no-tasks',
            displayText: '暂无复习任务',
          },
        }
      }

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const ongoingTask = planTasks.find((task) => {
        if (task.status !== 'pending') return false
        const taskDate = new Date(task.taskDate)
        taskDate.setHours(0, 0, 0, 0)
        return taskDate <= today
      })

      const futureTask = planTasks.find((task) => {
        if (task.status !== 'pending') return false
        const taskDate = new Date(task.taskDate)
        taskDate.setHours(0, 0, 0, 0)
        return taskDate > today
      })

      const allCompleted =
        planTasks.length > 0 && planTasks.every((task) => task.status === 'completed')

      let type = ''
      let displayText = ''
      let daysLeft = 0
      let stage = 0

      if (ongoingTask) {
        type = 'ongoing'
        stage = ongoingTask.reviewStage
        displayText = `正在进行第${stage}次复习`
      } else if (futureTask) {
        type = 'future'
        stage = futureTask.reviewStage
        const taskDate = new Date(futureTask.taskDate)
        taskDate.setHours(0, 0, 0, 0)
        const diffTime = taskDate.getTime() - today.getTime()
        daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        displayText = `距离第${stage}次复习还有${daysLeft}天`
      } else if (allCompleted) {
        type = 'completed'
        displayText = '已完成全部复习任务'
      } else {
        type = 'unknown'
        displayText = '复习状态未知'
      }

      return {
        ...plan,
        reviewStatus: { type, stage, daysLeft, displayText },
      }
    })
  })

  return {
    // 状态
    studyPlans,
    reviewItems,
    allReviewTasks,
    isLoading,
    currentPage,
    pageSize,
    total,
    selectedPlan,

    // 计算属性
    completionRate,
    activeCount,
    completedPlans,
    plansWithDetails,
    pendingTasks,
    completedTasks,

    // 复习任务方法
    fetchPendingTasks,
    fetchAllReviewTasks,
    completeTask,
    completedPlansWithReviewStatus,

    // 学习计划方法
    fetchStudyPlans,
    getPlanById,
    addPlan,
    updatePlan,
    deletePlan,
    togglePlanComplete,

    // 关联方法
    updatePlanLatestDetail,

    clearCache,
    refreshReviewTasks,
  }
})
