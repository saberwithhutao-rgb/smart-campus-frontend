import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 定义学习计划类型 - 与types/user.ts保持一致
interface StudyPlan {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  status: 'planning' | 'in_progress' | 'completed'
  subjects: string[]
  progress: number
}

// 定义智能复习项类型 - 需要重新定义以匹配实际使用场景
interface ReviewItem {
  id: string
  question: string
  answer: string
  difficulty: string
  reviewed: boolean
  time: string
}

export const useStudyPlanStore = defineStore('studyPlan', () => {
  // 学习计划列表 - 使用正确的StudyPlan接口
  const studyPlans = ref<StudyPlan[]>([
    { 
      id: '1', 
      title: 'Java学习', 
      description: '深入学习Java编程语言', 
      startDate: '2024-12-06', 
      endDate: '2024-12-08', 
      status: 'in_progress', 
      subjects: ['Java', '编程'], 
      progress: 60 
    },
    { 
      id: '2', 
      title: 'Python学习', 
      description: 'Python基础和进阶学习', 
      startDate: '2024-12-09', 
      endDate: '2024-12-11', 
      status: 'planning', 
      subjects: ['Python', '编程'], 
      progress: 0 
    },
    { 
      id: '3', 
      title: 'C语言学习', 
      description: 'C语言基础编程', 
      startDate: '2024-12-12', 
      endDate: '2024-12-14', 
      status: 'planning', 
      subjects: ['C语言', '编程'], 
      progress: 0 
    },
  ])

  // 智能复习列表 - 从已完成的学习计划中生成
  const reviewItems = ref<ReviewItem[]>([])

  // 计算完成度
  const completionRate = computed(() => {
    if (studyPlans.value.length === 0) return 100
    const completedCount = studyPlans.value.filter((plan) => plan.progress >= 100).length
    return Math.round((completedCount / studyPlans.value.length) * 100)
  })

  // 获取已完成的学习计划
  const completedPlans = computed(() => {
    return studyPlans.value.filter((plan) => plan.progress >= 100)
  })

  // 切换计划完成状态
  const togglePlanComplete = (planId: string) => {
    const plan = studyPlans.value.find((p) => p.id === planId)
    if (plan) {
      // 使用progress来标记完成状态，而不是completed
      plan.progress = plan.progress >= 100 ? 0 : 100
      // 如果计划已完成，添加到智能复习列表
      if (plan.progress >= 100) {
        addToReviewItems(plan)
      } else {
        // 如果计划未完成，从智能复习列表中移除
        removeFromReviewItems(planId)
      }
    }
  }

  // 添加到智能复习列表
  const addToReviewItems = (plan: StudyPlan) => {
    // 检查是否已经存在
    const existingItem = reviewItems.value.find((item) => item.id === plan.id)
    if (!existingItem) {
      reviewItems.value.push({
        id: plan.id,
        question: plan.description,
        answer: plan.title,
        difficulty: '中等', // 根据实际情况设置
        reviewed: false,
        time: new Date().toISOString(),
      })
    }
  }

  // 从智能复习列表中移除
  const removeFromReviewItems = (planId: string) => {
    reviewItems.value = reviewItems.value.filter((item) => item.id !== planId)
  }

  // 删除学习计划
  const deletePlan = (planId: string) => {
    studyPlans.value = studyPlans.value.filter((p) => p.id !== planId)
    // 同时从智能复习列表中移除
    removeFromReviewItems(planId)
  }

  // 添加新计划
  const addPlan = (plan: Omit<StudyPlan, 'id'>) => {
    const newPlan: StudyPlan = {
      id: Date.now().toString(),
      ...plan,
      progress: 0
    }
    studyPlans.value.push(newPlan)
    return newPlan
  }

  // 更新计划
const updatePlan = (plan: StudyPlan) => {
  const index = studyPlans.value.findIndex((p) => p.id === plan.id)
  if (index !== -1) {
    const oldPlan = studyPlans.value[index]
    if (oldPlan) {
      studyPlans.value[index] = plan

      // 如果计划进度发生变化，更新智能复习列表
      if (plan.progress !== oldPlan.progress) {
        if (plan.progress >= 100) {
          addToReviewItems(plan)
        } else {
          removeFromReviewItems(plan.id)
        }
      } else if (plan.progress >= 100) {
        // 如果计划已完成，更新智能复习列表中的对应项
        const reviewItem = reviewItems.value.find((item) => item.id === plan.id)
        if (reviewItem) {
          reviewItem.question = plan.description
          reviewItem.answer = plan.title
          reviewItem.time = new Date().toISOString()
        }
      }
    }
  }
}

  // 切换复习状态
  const toggleReview = (itemId: string) => {
    const item = reviewItems.value.find((item) => item.id === itemId)
    if (item) {
      item.reviewed = !item.reviewed
    }
  }

  // 删除复习项
  const deleteReviewItem = (itemId: string) => {
    reviewItems.value = reviewItems.value.filter((item) => item.id !== itemId)
  }

  // 初始化智能复习列表
  const initReviewItems = () => {
    // 清空现有列表
    reviewItems.value = []
    // 添加所有已完成的学习计划
    studyPlans.value.filter(plan => plan.progress >= 100).forEach((plan) => {
      addToReviewItems(plan)
    })
  }

  return {
    studyPlans,
    reviewItems,
    completionRate,
    completedPlans,
    togglePlanComplete,
    deletePlan,
    addPlan,
    updatePlan,
    toggleReview,
    deleteReviewItem,
    initReviewItems,
  }
})
