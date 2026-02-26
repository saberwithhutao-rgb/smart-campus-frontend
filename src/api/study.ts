// src/api/study.ts
import request from '@/utils/request'

/**
 * 学习计划统计分析接口
 * @param {StudyStatisticsParams} params - 请求参数
 * @returns {Promise<StudyStatisticsResponse>} - 返回Promise对象
 */
export interface StudyStatisticsParams {
  timeRange: string // 时间范围：today/week/month
  userId: number    // 用户ID
}

export interface StudyStatisticsResponse {
  totalPlanCount: number         // 总计划数
  completedPlanCount: number     // 已完成计划数
  completionRate: number         // 完成率
  unfinishedCount: number        // 未完成计划数
  overduePlanCount: number       // 延期计划数
  difficultyDistribution: {
    details: Array<{
      type: string
      count: number
      percentage: number
    }>
  }
  planTypeDistribution: {
    details: Array<{
      type: string
      count: number
      percentage: number
    }>
  }
  subjectDistribution: Record<string, number> // 各科目计划数量
}

export async function getStudyStatistics(params: StudyStatisticsParams): Promise<StudyStatisticsResponse> {
  return request({
    url: '/api/study/statistics',
    method: 'GET',
    params,
  })
}

/**
 * 学习建议接口
 * @param {StudySuggestionsParams} params - 请求参数
 * @returns {Promise<StudySuggestionsResponse>} - 返回Promise对象
 */
export interface StudySuggestionsParams {
  timeRange: string // 时间范围：today/week/month
  userId: number    // 用户ID
}

export interface StudySuggestionsResponse {
  success: boolean
  message?: string
  suggestions?: string[]
  data?: {
    suggestions: string[]
  }
}

export async function getStudySuggestions(params: StudySuggestionsParams): Promise<StudySuggestionsResponse> {
  return request({
    url: '/api/study/suggestions',
    method: 'GET',
    params,
  })
}
