import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/api'
import type { StudyTask } from './studyPlan'

export const useReviewDetailStore = defineStore('reviewDetail', () => {
  const currentReviewPlan = ref<StudyTask | null>(null)
  const historyPlans = ref<StudyTask[]>([])
  const isLoading = ref(false)
  const isGenerating = ref(false)
  const showHistoryDialog = ref(false)
  const currentHistoryPlan = ref<StudyTask | null>(null) // 改为 StudyTask

  const fetchReviewPlanDetail = async (planId: number) => {
    isLoading.value = true
    try {
      const task = await api.getReviewTaskDetail(planId)
      currentReviewPlan.value = task // task 已经是 StudyTask
    } catch (error) {
      console.error('获取复习计划详情失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  // 获取历史复习计划列表
  const fetchHistoryPlans = async (studyPlanId: number) => {
    isLoading.value = true
    try {
      const response = await api.getReviewPlanHistory(studyPlanId)
      historyPlans.value = response.data
    } catch (error) {
      console.error('获取历史复习计划失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  // 生成复习计划（复用原有逻辑）
  const generateReviewPlan = async (taskIds: number[]) => {
    isGenerating.value = true
    try {
      const response = await api.batchGenerateReviewPlans(taskIds)
      return response.data
    } catch (error) {
      console.error('生成复习计划失败:', error)
      throw error
    } finally {
      isGenerating.value = false
    }
  }

  // 打开历史弹窗
  const openHistoryDialog = async (studyPlanId: number) => {
    showHistoryDialog.value = true
    await fetchHistoryPlans(studyPlanId)
  }

  // 查看单个历史计划
  const viewHistoryPlan = (plan: StudyTask) => {
    // 改为 StudyTask
    currentHistoryPlan.value = plan
  }

  // 返回历史列表
  const backToHistoryList = () => {
    currentHistoryPlan.value = null
  }

  return {
    currentReviewPlan,
    historyPlans,
    isLoading,
    isGenerating,
    showHistoryDialog,
    currentHistoryPlan,
    fetchReviewPlanDetail,
    fetchHistoryPlans,
    generateReviewPlan,
    openHistoryDialog,
    viewHistoryPlan,
    backToHistoryList,
  }
})
