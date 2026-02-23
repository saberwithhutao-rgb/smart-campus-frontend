import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '@/api'

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface GeneratePlanResponse {
  plan: string
  detailId: number
}

export interface StudyPlanDetail {
  id: number
  studyPlanId: number // 必须要有这个字段来区分是哪个计划的详情
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
  // 改为用 Map 存储，key 是 studyPlanId
  const planDetailsMap = ref<Map<number, StudyPlanDetail>>(new Map())
  const isGenerating = ref(false)

  const generatePlanDetail = async (params: GeneratePlanParams) => {
    isGenerating.value = true
    try {
      const response = (await api.generatePlanDetail({
        studyPlanId: params.studyPlanId,
        subject: params.subject,
        duration: params.duration,
        level: params.level,
      })) as ApiResponse<GeneratePlanResponse>

      if (response.code === 200) {
        const newDetail = {
          id: response.data.detailId,
          studyPlanId: params.studyPlanId,
          duration: params.duration,
          level: params.level as 'easy' | 'medium' | 'hard',
          plan: response.data.plan,
          createdAt: new Date().toISOString(),
        }

        // 按 studyPlanId 存储
        planDetailsMap.value.set(params.studyPlanId, newDetail)

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

  // 根据 studyPlanId 获取对应的详情
  const getPlanDetailByStudyPlanId = (studyPlanId: number) => {
    return planDetailsMap.value.get(studyPlanId) || null
  }

  const clearPlanDetail = (studyPlanId: number) => {
    planDetailsMap.value.delete(studyPlanId)
  }

  return {
    isGenerating,
    generatePlanDetail,
    getPlanDetailByStudyPlanId,
    clearPlanDetail,
  }
})
