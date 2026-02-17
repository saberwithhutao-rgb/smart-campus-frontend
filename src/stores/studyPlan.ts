import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '@/api'

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
}

// 复习项类型 - 匹配 study_tasks 表
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

export const useStudyPlanStore = defineStore('studyPlan', () => {
  // ----- 状态 -----
  const studyPlans = ref<StudyPlan[]>([])
  const reviewItems = ref<ReviewItem[]>([])
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

  // ----- 复习任务相关方法 -----
  const fetchPendingTasks = async () => {
    isLoading.value = true
    try {
      const response = await api.getPendingTasks()
      if (response.code === 200) {
        reviewItems.value = response.data
      }
    } catch (error) {
      console.error('获取复习任务失败:', error)
      ElMessage.error('获取复习任务失败')
    } finally {
      isLoading.value = false
    }
  }

  const completeTask = async (id: number) => {
    try {
      // 乐观更新：先修改本地状态
      const taskIndex = reviewItems.value.findIndex((item) => item.id === id)
      if (taskIndex !== -1 && reviewItems.value[taskIndex]) {
        reviewItems.value[taskIndex] = {
          ...reviewItems.value[taskIndex],
          status: 'completed',
        }
      }

      const response = await api.completeTask(id)
      if (response.code === 200) {
        ElMessage.success('任务已完成')
        // 可选：用后端数据更新
        if (response.data) {
          reviewItems.value[taskIndex] = response.data
        }
      }
    } catch (error) {
      console.error('完成任务失败:', error)
      ElMessage.error('完成任务失败')
      await fetchPendingTasks() // 失败时重新获取
    }
  }

  // ----- 学习计划相关方法 -----
  const fetchStudyPlans = async (params?: {
    page?: number
    size?: number
    status?: 'active' | 'completed' | 'paused'
    planType?: 'review' | 'learning' | 'project'
    subject?: string
  }) => {
    isLoading.value = true
    try {
      const response = await api.getStudyPlans({
        page: params?.page || 1,
        size: params?.size || 10,
        status: params?.status,
        planType: params?.planType,
        subject: params?.subject,
      })

      if (response.code === 200) {
        studyPlans.value = response.data.list as unknown as StudyPlan[]
        total.value = response.data.total
        currentPage.value = response.data.page
        pageSize.value = response.data.size
      }
      return studyPlans.value
    } catch (error) {
      console.error('获取学习计划失败:', error)
      ElMessage.error('获取学习计划失败')
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const addPlan = async (planData: {
    title: string
    description?: string
    planType?: 'review' | 'learning' | 'project'
    subject: string
    difficulty?: 'easy' | 'medium' | 'hard'
    startDate: string
    endDate?: string
  }) => {
    isLoading.value = true
    try {
      const response = await api.createStudyPlan({
        title: planData.title,
        description: planData.description,
        planType: planData.planType,
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
      ElMessage.error('创建学习计划失败')
      throw error
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
      ElMessage.error('更新学习计划失败')
      throw error
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
      ElMessage.error('删除学习计划失败')
      throw error
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

      originalPlan = { ...studyPlans.value[planIndex] } as StudyPlan
      const newStatus = originalPlan.status === 'completed' ? 'active' : 'completed'

      const updatedPlan = {
        ...originalPlan,
        status: newStatus,
      } as StudyPlan
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
      console.error('切换状态失败:', error)
      ElMessage.error('切换状态失败')

      if (planIndex !== -1 && originalPlan) {
        studyPlans.value[planIndex] = originalPlan
      }
    } finally {
      isLoading.value = false
    }
  }

  const getPlanById = async (id: number) => {
    isLoading.value = true
    try {
      const response = await api.getStudyPlan(id)
      if (response.code === 200) {
        selectedPlan.value = response.data as unknown as StudyPlan
        return response.data
      }
    } catch (error) {
      console.error('获取计划详情失败:', error)
      ElMessage.error('获取计划详情失败')
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 初始化
  const init = async () => {
    await fetchStudyPlans()
  }

  init()

  return {
    // 学习计划相关
    studyPlans,
    isLoading,
    currentPage,
    pageSize,
    total,
    selectedPlan,
    completionRate,
    activeCount,
    completedPlans,
    fetchStudyPlans,
    addPlan,
    updatePlan,
    deletePlan,
    togglePlanComplete,
    getPlanById,
    reviewItems,
    fetchPendingTasks,
    completeTask,
    init,
  }
})
