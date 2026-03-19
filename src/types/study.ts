// src/types/study.ts

// 难度分布项
export interface DifficultyDistributionItem {
  type: string // '简单' | '中等' | '困难'
  count: number
  percentage: number // 0-1之间的小数
}

// 计划类型分布项
export interface PlanTypeDistributionItem {
  type: string // '学习计划' | '复习计划' | '项目计划'
  count: number
  percentage: number // 0-1之间的小数
}

// 统计数据接口 - 匹配后端返回格式
export interface StudyStatistics {
  totalPlanCount: number
  completedPlanCount: number
  completionRate: number // 0-1之间的小数
  unfinishedCount: number // 未完成计划数
  overduePlanCount: number

  difficultyDistribution: {
    details: DifficultyDistributionItem[]
  }

  planTypeDistribution: {
    details: PlanTypeDistributionItem[]
  }

  subjectDistribution: Record<string, number> // key: 科目名, value: 数量
}

// 学习建议接口
export interface StudySuggestions {
  success: boolean
  message?: string
  suggestions?: string[]
  data?: {
    suggestions: string[]
  }
}
