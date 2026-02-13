import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '@/api' // ✅ 导入api，不是自己模拟！

export interface StudyPlan {
  id: number
  user_id: number
  title: string
  description: string | null
  plan_type: 'review' | 'learning' | 'project'
  subject: string | null
  difficulty: 'easy' | 'medium' | 'hard'
  status: 'active' | 'completed' | 'paused'
  progress_percent: number
  start_date: string
  end_date: string | null
  created_at: string
  updated_at: string
}

export const useStudyPlanStore = defineStore('studyPlan', () => {
  // ----- 状态 -----
  const studyPlans = ref<StudyPlan[]>([])
  const isLoading = ref(false)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const total = ref(0)
  const selectedPlan = ref<StudyPlan | null>(null)

  // ----- 计算属性 -----
  const completionRate = computed(() => {
    if (studyPlans.value.length === 0) return 0
    const completedCount = studyPlans.value.filter(
      (plan) => plan.status === 'completed' || plan.progress_percent >= 100,
    ).length
    return Math.round((completedCount / studyPlans.value.length) * 100)
  })

  const activeCount = computed(() => {
    return studyPlans.value.filter((plan) => plan.status === 'active').length
  })

  const completedPlans = computed(() => {
    return studyPlans.value.filter((plan) => plan.status === 'completed')
  })

  // ----- API 方法：调真实后端！-----

  /**
   * 获取学习计划列表
   */
  const fetchStudyPlans = async (params?: {
    page?: number
    size?: number
    status?: 'active' | 'completed' | 'paused'
    plan_type?: 'review' | 'learning' | 'project'
    subject?: string
  }) => {
    isLoading.value = true
    try {
      // ✅ 调真实API！
      const response = await api.getStudyPlans({
        page: params?.page || 1,
        size: params?.size || 10,
        status: params?.status,
        planType: params?.plan_type, // 后端是 planType
        subject: params?.subject,
      })

      if (response.code === 200) {
        studyPlans.value = response.data.list
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

  /**
   * 创建学习计划
   */
  const addPlan = async (planData: {
    title: string
    description?: string
    plan_type: 'review' | 'learning' | 'project'
    subject?: string
    difficulty?: 'easy' | 'medium' | 'hard'
    start_date: string
    end_date?: string
    progress_percent?: number
  }) => {
    isLoading.value = true
    try {
      // ✅ 调真实API！
      const response = await api.createStudyPlan({
        title: planData.title,
        description: planData.description,
        planType: planData.plan_type,
        subject: planData.subject,
        difficulty: planData.difficulty || 'medium',
        startDate: planData.start_date,
        endDate: planData.end_date,
        progressPercent: planData.progress_percent || 0,
      })

      if (response.code === 200 || response.code === 201) {
        ElMessage.success('创建学习计划成功')
        await fetchStudyPlans() // 刷新列表
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

  /**
   * 更新学习计划
   */
  const updatePlan = async (id: number, planData: Partial<StudyPlan>) => {
    isLoading.value = true
    try {
      const response = await api.updateStudyPlan(id, {
        title: planData.title,
        description: planData.description,
        planType: planData.plan_type,
        subject: planData.subject,
        difficulty: planData.difficulty,
        status: planData.status,
        startDate: planData.start_date,
        endDate: planData.end_date,
        progressPercent: planData.progress_percent,
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

  /**
   * 删除学习计划
   */
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

  /**
   * 更新进度
   */
  const updateProgress = async (id: number, progress: number) => {
    if (progress < 0 || progress > 100) {
      ElMessage.error('进度必须在0-100之间')
      return
    }

    isLoading.value = true
    try {
      const response = await api.updateProgress(id, progress)
      if (response.code === 200) {
        ElMessage.success(response.message || '进度更新成功')
        await fetchStudyPlans()
        return response.data
      }
    } catch (error) {
      console.error('更新进度失败:', error)
      ElMessage.error('更新进度失败')
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 切换完成状态
   */
  const togglePlanComplete = async (id: number) => {
    isLoading.value = true
    try {
      const response = await api.togglePlanComplete(id)
      if (response.code === 200) {
        ElMessage.success('状态切换成功')
        await fetchStudyPlans()
        return response.data
      }
    } catch (error) {
      console.error('切换状态失败:', error)
      ElMessage.error('切换状态失败')
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 获取单个计划
   */
  const getPlanById = async (id: number) => {
    isLoading.value = true
    try {
      const response = await api.getStudyPlan(id)
      if (response.code === 200) {
        selectedPlan.value = response.data
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

  // 自动初始化
  init()

  return {
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
    updateProgress,
    togglePlanComplete,
    getPlanById,
    init,
  }
})
