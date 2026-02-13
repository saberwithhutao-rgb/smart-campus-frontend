import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

// ---------- 1. 类型定义：完全匹配数据库表结构 ----------
export interface StudyPlan {
  // 基础字段
  id: number // 自增主键
  user_id: number // 用户ID，外键

  // 计划内容
  title: string // 计划标题
  description: string | null // 计划描述
  plan_type: 'review' | 'learning' | 'project' // 计划类型
  subject: string | null // 学科/科目
  difficulty: 'easy' | 'medium' | 'hard' // 难易程度

  // 状态进度
  status: 'active' | 'completed' | 'paused' // 状态
  progress_percent: number // 进度百分比 0-100

  // 时间相关
  start_date: string // 开始日期 (yyyy-MM-dd)
  end_date: string | null // 结束日期

  // 系统字段
  created_at: string // 创建时间
  updated_at: string // 更新时间
}

// 创建计划时的请求参数（省略自动生成的字段）
export interface CreatePlanRequest {
  title: string
  description?: string
  plan_type: 'review' | 'learning' | 'project'
  subject?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  start_date: string
  end_date?: string
  progress_percent?: number
}

// 更新计划时的请求参数（所有字段可选）
export interface UpdatePlanRequest extends Partial<CreatePlanRequest> {}

// ---------- 2. Store 定义 ----------
export const useStudyPlanStore = defineStore('studyPlan', () => {
  // ----- 状态 State -----
  const studyPlans = ref<StudyPlan[]>([])
  const isLoading = ref(false)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const total = ref(0)
  const selectedPlan = ref<StudyPlan | null>(null)

  // ----- 计算属性 Getters -----

  /**
   * 整体完成度：已完成计划数量 / 总计划数量
   */
  const completionRate = computed(() => {
    if (studyPlans.value.length === 0) return 0
    const completedCount = studyPlans.value.filter(
      (plan) => plan.status === 'completed' || plan.progress_percent >= 100,
    ).length
    return Math.round((completedCount / studyPlans.value.length) * 100)
  })

  /**
   * 进行中的计划数量
   */
  const activeCount = computed(() => {
    return studyPlans.value.filter((plan) => plan.status === 'active').length
  })

  /**
   * 已完成计划列表
   */
  const completedPlans = computed(() => {
    return studyPlans.value.filter((plan) => plan.status === 'completed')
  })

  /**
   * 按计划类型分组
   */
  const plansByType = computed(() => {
    return {
      learning: studyPlans.value.filter((p) => p.plan_type === 'learning'),
      review: studyPlans.value.filter((p) => p.plan_type === 'review'),
      project: studyPlans.value.filter((p) => p.plan_type === 'project'),
    }
  })

  // ----- 模拟数据生成（后端未开发时使用）-----
  const generateMockPlans = (): StudyPlan[] => {
    return [
      {
        id: 1,
        user_id: 1,
        title: 'Java学习',
        description: '深入学习Java编程语言，包括集合、多线程、JVM等核心知识',
        plan_type: 'learning',
        subject: '编程',
        difficulty: 'medium',
        status: 'active',
        progress_percent: 60,
        start_date: '2024-12-06',
        end_date: '2024-12-08',
        created_at: '2024-12-01T10:00:00Z',
        updated_at: '2024-12-06T15:30:00Z',
      },
      {
        id: 2,
        user_id: 1,
        title: 'Python学习',
        description: 'Python基础和进阶学习，包括语法、Web框架、数据分析',
        plan_type: 'learning',
        subject: '编程',
        difficulty: 'easy',
        status: 'active',
        progress_percent: 0,
        start_date: '2024-12-09',
        end_date: '2024-12-11',
        created_at: '2024-12-02T09:00:00Z',
        updated_at: '2024-12-02T09:00:00Z',
      },
      {
        id: 3,
        user_id: 1,
        title: 'C语言复习',
        description: 'C语言基础复习，指针、内存管理、数据结构',
        plan_type: 'review',
        subject: '编程',
        difficulty: 'hard',
        status: 'completed',
        progress_percent: 100,
        start_date: '2024-12-12',
        end_date: '2024-12-14',
        created_at: '2024-12-03T14:00:00Z',
        updated_at: '2024-12-10T11:20:00Z',
      },
      {
        id: 4,
        user_id: 1,
        title: '毕业设计',
        description: '基于Vue3和Spring Boot的在线学习平台',
        plan_type: 'project',
        subject: '全栈',
        difficulty: 'hard',
        status: 'active',
        progress_percent: 30,
        start_date: '2024-12-01',
        end_date: '2024-12-30',
        created_at: '2024-12-05T16:00:00Z',
        updated_at: '2024-12-07T10:15:00Z',
      },
    ]
  }

  // ----- API 方法（模拟版，完全匹配表结构）-----

  /**
   * 1. 获取学习计划列表
   * GET /api/study/plans
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
      // 模拟网络延迟
      await new Promise((resolve) => setTimeout(resolve, 600))

      // 获取当前用户ID（从token或store中）
      // const userStore = useUserStore()
      // const userId = userStore.userInfo?.id
      const userId = 1 // 模拟当前用户ID

      // 生成模拟数据
      let plans = generateMockPlans().filter((p) => p.user_id === userId)

      // 应用筛选条件
      if (params?.status) {
        plans = plans.filter((p) => p.status === params.status)
      }
      if (params?.plan_type) {
        plans = plans.filter((p) => p.plan_type === params.plan_type)
      }
      if (params?.subject) {
        plans = plans.filter((p) => p.subject?.includes(params.subject!))
      }

      // 分页
      const page = params?.page || 1
      const size = params?.size || 10
      const start = (page - 1) * size
      const paginatedPlans = plans.slice(start, start + size)

      // 按更新时间倒序排列
      studyPlans.value = paginatedPlans.sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      )

      total.value = plans.length
      currentPage.value = page
      pageSize.value = size

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
   * 2. 创建学习计划
   * POST /api/study/plans
   */
  const addPlan = async (planData: CreatePlanRequest) => {
    isLoading.value = true
    try {
      // 模拟网络请求
      await new Promise((resolve) => setTimeout(resolve, 800))

      // 获取当前用户ID
      // const userStore = useUserStore()
      // const userId = userStore.userInfo?.id
      const userId = 1 // 模拟当前用户ID

      const newPlan: StudyPlan = {
        id: Date.now(), // 模拟自增ID
        user_id: userId,
        title: planData.title,
        description: planData.description || null,
        plan_type: planData.plan_type,
        subject: planData.subject || null,
        difficulty: planData.difficulty || 'medium',
        status: 'active',
        progress_percent: planData.progress_percent || 0,
        start_date: planData.start_date,
        end_date: planData.end_date || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      studyPlans.value.unshift(newPlan)
      total.value++

      ElMessage.success('创建学习计划成功')
      return newPlan
    } catch (error) {
      console.error('创建学习计划失败:', error)
      ElMessage.error('创建学习计划失败')
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 3. 更新学习计划
   * PUT /api/study/plans/{id}
   */
  const updatePlan = async (id: number, planData: UpdatePlanRequest) => {
    isLoading.value = true
    try {
      await new Promise((resolve) => setTimeout(resolve, 600))

      const index = studyPlans.value.findIndex((p) => p.id === id)
      if (index === -1) throw new Error('计划不存在')

      // 显式保留不可变字段，仅更新可变字段
      const updatedPlan: StudyPlan = {
        ...studyPlans.value[index], // 保留原对象的所有字段
        ...(planData as Partial<StudyPlan>), // 合并更新字段（断言为 Partial<StudyPlan>）
        updated_at: new Date().toISOString(), // 强制更新时间戳
      }

      studyPlans.value[index] = updatedPlan

      ElMessage.success('更新学习计划成功')
      return updatedPlan
    } catch (error) {
      console.error('更新学习计划失败:', error)
      ElMessage.error('更新学习计划失败')
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 4. 删除学习计划
   * DELETE /api/study/plans/{id}
   */
  const deletePlan = async (id: number) => {
    isLoading.value = true
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

      studyPlans.value = studyPlans.value.filter((p) => p.id !== id)
      total.value--

      ElMessage.success('删除学习计划成功')
    } catch (error) {
      console.error('删除学习计划失败:', error)
      ElMessage.error('删除学习计划失败')
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 5. 更新进度
   * PATCH /api/study/plans/{id}/progress
   */
  const updateProgress = async (id: number, progress: number) => {
    if (progress < 0 || progress > 100) {
      ElMessage.error('进度必须在0-100之间')
      return
    }

    return updatePlan(id, {
      progress_percent: progress,
      status: progress >= 100 ? 'completed' : 'active',
    })
  }

  /**
   * 6. 切换完成状态
   * 便捷方法：0% ↔ 100%
   */
  const togglePlanComplete = async (id: number) => {
    const plan = studyPlans.value.find((p) => p.id === id)
    if (!plan) return

    const newProgress = plan.progress_percent >= 100 ? 0 : 100
    return updateProgress(id, newProgress)
  }

  /**
   * 7. 获取学习计划详情
   * GET /api/study/plans/{id}
   */
  const getPlanById = async (id: number) => {
    isLoading.value = true
    try {
      await new Promise((resolve) => setTimeout(resolve, 300))

      const plan = studyPlans.value.find((p) => p.id === id)
      if (!plan) throw new Error('计划不存在')

      selectedPlan.value = plan
      return plan
    } catch (error) {
      console.error('获取计划详情失败:', error)
      ElMessage.error('获取计划详情失败')
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 8. 获取学习进度/日程
   * GET /api/study/schedule
   */
  const fetchSchedule = async (params?: {
    start_date?: string
    end_date?: string
    plan_id?: number
  }) => {
    isLoading.value = true
    try {
      await new Promise((resolve) => setTimeout(resolve, 600))

      // 根据时间范围筛选
      let plans = studyPlans.value

      if (params?.plan_id) {
        plans = plans.filter((p) => p.id === params.plan_id)
      }

      if (params?.start_date) {
        plans = plans.filter((p) => p.start_date >= params.start_date!)
      }

      if (params?.end_date) {
        plans = plans.filter((p) => p.end_date && p.end_date <= params.end_date!)
      }

      // 转换为日程格式
      const schedule = plans.map((plan) => ({
        id: plan.id,
        title: plan.title,
        type: plan.plan_type,
        start_date: plan.start_date,
        end_date: plan.end_date,
        progress: plan.progress_percent,
        status: plan.status,
      }))

      return schedule
    } catch (error) {
      console.error('获取学习进度失败:', error)
      ElMessage.error('获取学习进度失败')
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 初始化：加载第一页数据
   */
  const init = async () => {
    await fetchStudyPlans()
  }

  // 自动初始化
  init()

  return {
    // 状态
    studyPlans,
    isLoading,
    currentPage,
    pageSize,
    total,
    selectedPlan,

    // 计算属性
    completionRate,
    activeCount,
    completedPlans,
    plansByType,

    // CRUD 方法
    fetchStudyPlans,
    addPlan,
    updatePlan,
    deletePlan,
    getPlanById,

    // 进度相关
    updateProgress,
    togglePlanComplete,
    fetchSchedule,

    // 初始化
    init,
  }
})
