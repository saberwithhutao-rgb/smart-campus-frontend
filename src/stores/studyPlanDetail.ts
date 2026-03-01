// stores/studyPlanDetail.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '@/api'

// 定义响应类型
interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

// 定义生成计划的响应数据类型
interface GeneratePlanResponse {
  plan: string
  detailId: number
}

// 数据库中的计划详情实体
export interface StudyPlanDetailEntity {
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
}

export interface GeneratePlanParams {
  studyPlanId: number
  subject: string
  duration: string
  level: string
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
  const isGenerating = ref(false)
  const isLoading = ref(false)

  // 获取最后一次生成的计划
  const fetchLatestPlan = async (studyPlanId: number) => {
    isLoading.value = true
    try {
      const response = (await api.getStudyPlanDetails(studyPlanId)) as ApiResponse<
        StudyPlanDetailEntity[]
      >

      if (response.code === 200 && response.data.length > 0) {
        // 按创建时间倒序排序
        const sorted = response.data.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )

        // 只取最新的保存到当前计划
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

  // 获取全部历史（只存 historyPlans）
  const fetchHistoryPlans = async (studyPlanId: number) => {
    isLoading.value = true
    try {
      const response = (await api.getStudyPlanDetails(studyPlanId)) as ApiResponse<
        StudyPlanDetailEntity[]
      >

      if (response.code === 200) {
        // 按创建时间倒序排序
        const sorted = response.data.sort(
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
    isGenerating.value = true
    try {
      const response = (await api.generatePlanDetail(params)) as ApiResponse<GeneratePlanResponse>

      if (response.code === 200) {
        const newDetail: StudyPlanDetailWithParsed = {
          id: response.data.detailId,
          studyPlanId: params.studyPlanId,
          duration: params.duration,
          level: params.level as 'easy' | 'medium' | 'hard',
          plan: response.data.plan,
          createdAt: new Date().toISOString(),
        }

        // 更新当前计划
        currentPlanDetails.value.set(params.studyPlanId, newDetail)

        // 更新历史列表
        const currentHistory = historyPlans.value.get(params.studyPlanId) || []
        historyPlans.value.set(params.studyPlanId, [newDetail, ...currentHistory])

        ElMessage.success('学习计划生成成功')
        return newDetail
      } else {
        ElMessage.error(response.message || '生成计划失败')
        return null
      }
    } catch (error) {
      console.error('生成计划失败:', error)
      ElMessage.error('生成计划失败: ' + (error instanceof Error ? error.message : '未知错误'))
      return null
    } finally {
      isGenerating.value = false
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
  }

  return {
    isGenerating,
    isLoading,
    showHistoryDialog,
    currentHistoryPlan,
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
