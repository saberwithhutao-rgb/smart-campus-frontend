// stores/studyPlanDetail.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '@/api'
import { useStudyPlanStore } from './studyPlan'

// AI生成的学习计划详情（JSON结构）
export interface AIGeneratedPlan {
  plan: Array<{
    week: number
    title: string
    days: Array<{
      day: number
      topic: string
      tasks: string[]
      resources: string[]
      assignments: string[]
    }>
  }>
}

// 解析后的详情（包含JSON对象）
export interface StudyPlanDetailWithParsed {
  id: number
  studyPlanId: number
  duration: string
  level: 'easy' | 'medium' | 'hard'
  planDetails: AIGeneratedPlan
  createdAt: string
}

// 数据库实体
export interface StudyPlanDetail {
  id: number
  studyPlanId: number
  duration: string
  level: 'easy' | 'medium' | 'hard'
  planDetails: string // JSON字符串
  createdAt: string
}

// 生成计划参数
export interface GeneratePlanParams {
  studyPlanId: number
  subject: string
  duration: string
  level: string
}

export const useStudyPlanDetailStore = defineStore('studyPlanDetail', () => {
  // ----- 状态 -----
  const currentDetail = ref<StudyPlanDetailWithParsed | null>(null)
  const isGenerating = ref(false)

  // 辅助函数：解析JSON
  const parsePlanDetails = (detail: StudyPlanDetail): StudyPlanDetailWithParsed => {
    try {
      const parsed = JSON.parse(detail.planDetails) as AIGeneratedPlan
      return {
        ...detail,
        planDetails: parsed,
      }
    } catch (e) {
      console.error('解析计划详情JSON失败:', e)
      return {
        ...detail,
        planDetails: { plan: [] },
      }
    }
  }

  // ----- 生成新的学习计划详情 -----
  const generatePlanDetail = async (params: GeneratePlanParams) => {
    isGenerating.value = true
    try {
      const response = await api.generatePlanDetail({
        studyPlanId: params.studyPlanId,
        subject: params.subject,
        duration: params.duration,
        level: params.level,
      })

      if (response.code === 200) {
        const data = response.data // { planDetails: {...}, detailId: xxx }

        // 构建详情对象
        const newDetail: StudyPlanDetail = {
          id: data.detailId,
          studyPlanId: params.studyPlanId,
          duration: params.duration,
          level: params.level as 'easy' | 'medium' | 'hard',
          planDetails: JSON.stringify(data.planDetails),
          createdAt: new Date().toISOString(),
        }

        // 设置为当前选中的详情（解析后的）
        currentDetail.value = parsePlanDetails(newDetail)

        // 更新学习计划store中的最新详情ID
        const studyPlanStore = useStudyPlanStore()
        studyPlanStore.updatePlanLatestDetail(params.studyPlanId, data.detailId)

        ElMessage.success('学习计划生成成功')
        return currentDetail.value
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

  // 清空当前选中的详情
  const clearCurrentDetail = () => {
    currentDetail.value = null
  }

  return {
    // 状态
    currentDetail,
    isGenerating,

    // 方法
    generatePlanDetail,
    clearCurrentDetail,
    parsePlanDetails,
  }
})
