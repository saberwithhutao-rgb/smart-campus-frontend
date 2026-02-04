// src/api/study.js
import request from '@/utils/request'

/**
 * 学习计划统计分析接口
 * @param {Object} params - 请求参数
 * @param {string} params.timeRange - 时间范围：today/week/month
 * @param {number} params.userId - 用户ID
 * @returns {Promise} - 返回Promise对象
 */
export function getStudyStatistics(params) {
  return request({
    url: '/api/study/statistics',
    method: 'GET',
    params,
  })
}

/**
 * 学习建议接口
 * @param {Object} params - 请求参数
 * @param {string} params.timeRange - 时间范围：today/week/month
 * @param {number} params.userId - 用户ID
 * @returns {Promise} - 返回Promise对象
 */
export function getStudySuggestions(params) {
  return request({
    url: '/api/study/suggestions',
    method: 'GET',
    params,
  })
}
