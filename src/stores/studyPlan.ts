// stores/studyPlan.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '@/api'
import * as studyApi from '@/api/study'

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
  studyPlanDetails?: any[]
  latestDetailId?: number
}

export interface StudyTask {
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
  const fetchPendingTasks = async () => {
    isLoading.value = true
    try {
      const response = await api.getPendingTasks()
      if (response.code === 200) {
        const today = new Date().toISOString().split('T')[0] ?? ''
        reviewItems.value = response.data.filter(
          (item: StudyTask) => item.taskDate <= today || item.reviewStage === 0,
        )
      }
    } catch (error) {
      console.error('获取待复习任务失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  // 新增：获取所有复习任务
  const fetchAllReviewTasks = async () => {
    try {
      const response = await studyApi.getAllReviewTasks()
      // 直接判断 response 是否是数组
      if (Array.isArray(response)) {
        allReviewTasks.value = response
      }
      // 如果是标准的 {code, data} 格式
      else if (response && response.code === 200) {
        allReviewTasks.value = response.data.data as unknown as StudyTask[]
      }
      // 如果数据直接就在 response 里
      else if (response && response.data) {
        allReviewTasks.value = response.data.data as unknown as StudyTask[]
      } else {
        console.log('【fetchAllReviewTasks】未知的响应格式:', response)
      }
    } catch (error) {
      console.error('【fetchAllReviewTasks】捕获错误:', error)
    }
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

      if (response.code === 200) {
        ElMessage.success('任务已完成')
        if (response.data) {
          reviewItems.value[taskIndex] = response.data
        }
      } else {
        reviewItems.value[taskIndex] = originalTask
        ElMessage.error(response.message || '操作失败')
      }
    } catch (error) {
      reviewItems.value[taskIndex] = originalTask
      console.error('完成任务失败:', error)
    }
  }

  // ----- 学习计划相关方法 -----
  const fetchStudyPlans = async (params?: StudyPlanQueryParams) => {
    isLoading.value = true
    try {
      const response = await api.getStudyPlans({
        page: params?.page || currentPage.value,
        size: params?.size || pageSize.value,
        status: params?.status,
        planType: params?.planType,
        subject: params?.subject,
      })

      if (response.code === 200) {
        studyPlans.value = response.data.list as StudyPlan[]
        total.value = response.data.total
        currentPage.value = response.data.page
        pageSize.value = response.data.size
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
      if (response.code === 200) {
        selectedPlan.value = response.data as StudyPlan
        return response.data
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

      if (response.code === 200 || response.code === 201) {
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

      if (response.code === 200) {
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
      if (response.code === 200) {
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

      originalPlan = { ...studyPlans.value[planIndex] }
      const newStatus = originalPlan.status === 'completed' ? 'active' : 'completed'

      const updatedPlan = {
        ...originalPlan,
        status: newStatus,
      }
      studyPlans.value[planIndex] = updatedPlan

      const response = await api.togglePlanComplete(id)

      if (response.code === 200) {
        ElMessage.success('状态切换成功')
        if (response.data) {
          studyPlans.value[planIndex] = {
            ...studyPlans.value[planIndex],
            ...response.data,
          }
        }
      }
    } catch (error) {
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

  // 初始化
  const init = async () => {
    await fetchStudyPlans()
  }

  init()

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

    // 学习计划方法
    fetchStudyPlans,
    getPlanById,
    addPlan,
    updatePlan,
    deletePlan,
    togglePlanComplete,

    // 关联方法
    updatePlanLatestDetail,

    init,
  }
})
