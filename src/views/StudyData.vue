<template>
  <div class="study-data-container">
    <GlobalNavbar />
    <!-- 时间范围选择器 -->
    <div class="time-range-selector">
      <label>时间范围：</label>
      <el-select
        v-model="timeRange"
        @change="handleTimeRangeChange"
        placeholder="选择时间范围"
        size="large"
      >
        <el-option value="today" label="今天" />
        <el-option value="week" label="过去一周" />
        <el-option value="month" label="过去一个月" />
      </el-select>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- 错误提示 -->
    <el-alert v-else-if="error" :title="error" type="error" :closable="false" show-icon>
      <template #action>
        <el-button size="small" type="danger" @click="fetchData">重试</el-button>
      </template>
    </el-alert>

    <!-- 数据展示区域 -->
    <div v-else class="data-content">
      <!-- 统计分析卡片 -->
      <el-card class="statistics-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <h3>📊 统计分析</h3>
            <el-tag type="info" size="large">{{ timeRangeText }}</el-tag>
          </div>
        </template>

        <!-- 统计网格 -->
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8" v-for="stat in statisticsList" :key="stat.label">
            <div class="stat-item">
              <span class="stat-label">{{ stat.label }}</span>
              <span class="stat-value">{{ stat.value }}</span>
            </div>
          </el-col>
        </el-row>

        <!-- 环形图区域：两列布局 -->
        <el-row :gutter="24" class="charts-row">
          <!-- 难度分布环形图 -->
          <el-col :xs="24" :md="12">
            <div class="chart-container">
              <h4 class="chart-title">📈 难度分布</h4>
              <div ref="difficultyChartRef" class="chart" :style="{ height: '300px' }"></div>
              <div class="chart-legend">
                <div v-for="item in difficultyLegend" :key="item.name" class="legend-item">
                  <span class="legend-color" :style="{ backgroundColor: item.color }"></span>
                  <span class="legend-name">{{ item.name }}</span>
                  <span class="legend-value">{{ item.value }}个 ({{ item.percentage }}%)</span>
                </div>
              </div>
            </div>
          </el-col>

          <!-- 计划类型分布环形图 -->
          <el-col :xs="24" :md="12">
            <div class="chart-container">
              <h4 class="chart-title">📊 计划类型分布</h4>
              <div ref="planTypeChartRef" class="chart" :style="{ height: '300px' }"></div>
              <div class="chart-legend">
                <div v-for="item in planTypeLegend" :key="item.name" class="legend-item">
                  <span class="legend-color" :style="{ backgroundColor: item.color }"></span>
                  <span class="legend-name">{{ item.name }}</span>
                  <span class="legend-value">{{ item.value }}个 ({{ item.percentage }}%)</span>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>

        <!-- 各科目计划数量 -->
        <el-divider content-position="left">各科目计划数量</el-divider>
        <el-row :gutter="16">
          <el-col
            :xs="24"
            :sm="12"
            :md="8"
            v-for="(count, subject) in statistics?.subjectDistribution || {}"
            :key="subject"
          >
            <el-card shadow="never" class="subject-card">
              <div class="subject-info">
                <span class="subject-name">{{ subject }}</span>
                <el-tag size="small" type="primary">{{ count }}个</el-tag>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-card>

      <!-- 学习建议卡片 -->
      <el-card class="suggestions-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <h3>💡 学习建议</h3>
          </div>
        </template>

        <el-empty v-if="!hasSuggestions" description="暂无学习建议" />
        <el-timeline v-else>
          <el-timeline-item
            v-for="(suggestion, index) in suggestionList"
            :key="index"
            :type="getSuggestionType(index)"
            :size="'large'"
            :hollow="true"
          >
            <div class="suggestion-content">
              <el-icon><MagicStick /></el-icon>
              <span>{{ suggestion }}</span>
            </div>
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import { getStudyStatistics, getStudySuggestions } from '../api/study'
import type { StudyStatisticsResponse, StudySuggestionsResponse } from '../api/study'
import GlobalNavbar from '@/components/GlobalNavbar.vue'
import { useUserStore } from '@/stores/user'
import { MagicStick } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const userStore = useUserStore()

// 响应式数据
const timeRange = ref<'today' | 'week' | 'month'>('today')
const loading = ref(false)
const error = ref('')
const statistics = ref<StudyStatisticsResponse | null>(null)
const suggestions = ref<StudySuggestionsResponse | null>(null)

// ECharts 实例
const difficultyChartRef = ref<HTMLElement>()
const planTypeChartRef = ref<HTMLElement>()
const difficultyChart = ref<echarts.ECharts | null>(null)
const planTypeChart = ref<echarts.ECharts | null>(null)

// 时间范围文本
const timeRangeText = computed(() => {
  const map = {
    today: '今天',
    week: '过去一周',
    month: '过去一个月',
  }
  return map[timeRange.value]
})

// 统计列表（用于循环渲染）
const statisticsList = computed(() => {
  if (!statistics.value) return []
  return [
    { label: '总计划数', value: statistics.value.totalPlanCount },
    { label: '已完成计划数', value: statistics.value.completedPlanCount },
    { label: '完成率', value: `${(statistics.value.completionRate * 100).toFixed(2)}%` },
    { label: '未完成计划数', value: statistics.value.unfinishedCount },
    { label: '延期计划数', value: statistics.value.overduePlanCount },
  ]
})

const CHART_COLORS = {
  difficulty: {
    简单: '#67C23A',
    中等: '#E6A23C',
    困难: '#F56C6C',
  },
  planType: {
    学习计划: '#409EFF',
    复习计划: '#E6A23C',
    项目计划: '#67C23A',
  },
} // 难度分布图例数据
const difficultyLegend = computed(() => {
  if (!statistics.value?.difficultyDistribution?.details) return []
  return statistics.value.difficultyDistribution.details.map((item) => ({
    name: item.type,
    value: item.count,
    percentage: (item.percentage * 100).toFixed(2),
    color: CHART_COLORS.difficulty[item.type as keyof typeof CHART_COLORS.difficulty] || '#909399',
  }))
})

// 计划类型分布图例数据
const planTypeLegend = computed(() => {
  if (!statistics.value?.planTypeDistribution?.details) return []
  return statistics.value.planTypeDistribution.details.map((item) => ({
    name: item.type,
    value: item.count,
    percentage: (item.percentage * 100).toFixed(2),
    color: CHART_COLORS.planType[item.type as keyof typeof CHART_COLORS.planType] || '#909399',
  }))
})

// 计算属性：获取建议数组
const suggestionList = computed(() => {
  if (!suggestions.value) return []

  if (Array.isArray(suggestions.value)) {
    return suggestions.value
  }

  if (suggestions.value.suggestions) {
    return suggestions.value.suggestions
  }

  if (suggestions.value.data?.suggestions) {
    return suggestions.value.data.suggestions
  }

  return []
})

const hasSuggestions = computed(() => suggestionList.value.length > 0)

// 获取建议类型
const getSuggestionType = (index: number) => {
  const types = ['primary', 'success', 'warning', 'info']
  return types[index % types.length] as 'primary' | 'success' | 'warning' | 'info'
}

// 渲染环形图
const renderCharts = () => {
  nextTick(() => {
    // 难度分布环形图
    if (difficultyChartRef.value && difficultyLegend.value.length > 0) {
      if (difficultyChart.value) difficultyChart.value.dispose()
      difficultyChart.value = echarts.init(difficultyChartRef.value)

      difficultyChart.value.setOption({
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c}个 ({d}%)',
        },
        legend: {
          show: false,
        },
        series: [
          {
            name: '难度分布',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2,
            },
            label: {
              show: false,
            },
            emphasis: {
              scale: false,
              label: {
                show: true,
                position: 'center',
                fontSize: 16,
                fontWeight: 'bold',
                formatter: '{b}\n{d}%',
              },
            },
            data: difficultyLegend.value.map((item) => ({
              name: item.name,
              value: item.value,
              itemStyle: { color: item.color },
            })),
          },
        ],
      })
    }

    // 计划类型分布环形图
    if (planTypeChartRef.value && planTypeLegend.value.length > 0) {
      if (planTypeChart.value) planTypeChart.value.dispose()
      planTypeChart.value = echarts.init(planTypeChartRef.value)

      planTypeChart.value.setOption({
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c}个 ({d}%)',
        },
        legend: {
          show: false,
        },
        series: [
          {
            name: '计划类型分布',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2,
            },
            label: {
              show: false,
            },
            emphasis: {
              scale: false,
              label: {
                show: true,
                position: 'center',
                fontSize: 16,
                fontWeight: 'bold',
                formatter: '{b}\n{d}%',
              },
            },
            data: planTypeLegend.value.map((item) => ({
              name: item.name,
              value: item.value,
              itemStyle: { color: item.color },
            })),
          },
        ],
      })
    }
  })
}

// 监听数据变化，重新渲染图表
watch(
  [statistics, difficultyLegend, planTypeLegend],
  () => {
    renderCharts()
  },
  { deep: true },
)

// 处理时间范围切换
const handleTimeRangeChange = () => {
  fetchData()
}

// 获取数据
const fetchData = async () => {
  loading.value = true
  error.value = ''

  try {
    console.log('开始获取数据，参数:', {
      timeRange: timeRange.value,
    })

    const [statsData, suggestionsData] = await Promise.all([
      getStudyStatistics({ timeRange: timeRange.value }).catch((err) => {
        console.warn('获取统计数据失败，使用模拟数据', err)
        return null
      }),
      getStudySuggestions({ timeRange: timeRange.value }).catch((err) => {
        console.warn('获取学习建议失败，使用模拟数据', err)
        return null
      }),
    ])

    statistics.value = statsData || getMockStatistics(timeRange.value)
    suggestions.value = suggestionsData || getMockSuggestions(timeRange.value)

    console.log('数据获取成功:', {
      statistics: statistics.value,
      suggestions: suggestions.value,
    })
  } catch (err) {
    console.error('请求失败:', err)
    statistics.value = getMockStatistics(timeRange.value)
    suggestions.value = getMockSuggestions(timeRange.value)
    error.value = ''
  } finally {
    loading.value = false
  }
}

// 模拟统计数据
const getMockStatistics = (range: 'today' | 'week' | 'month'): StudyStatisticsResponse => {
  const baseData: StudyStatisticsResponse = {
    totalPlanCount: 12,
    completedPlanCount: 5,
    completionRate: 0.42,
    unfinishedCount: 7,
    overduePlanCount: 2,
    difficultyDistribution: {
      details: [
        { type: '简单', count: 4, percentage: 0.33 },
        { type: '中等', count: 6, percentage: 0.5 },
        { type: '困难', count: 2, percentage: 0.17 },
      ],
    },
    planTypeDistribution: {
      details: [
        { type: '学习计划', count: 8, percentage: 0.67 },
        { type: '复习计划', count: 3, percentage: 0.25 },
        { type: '项目计划', count: 1, percentage: 0.08 },
      ],
    },
    subjectDistribution: {
      数学: 4,
      英语: 3,
      编程: 5,
    },
  }

  if (range === 'today') {
    return {
      ...baseData,
      totalPlanCount: 3,
      completedPlanCount: 1,
      completionRate: 0.33,
      unfinishedCount: 2,
    }
  } else if (range === 'week') {
    return {
      ...baseData,
      totalPlanCount: 8,
      completedPlanCount: 3,
      completionRate: 0.38,
      unfinishedCount: 5,
    }
  }
  return baseData
}

// 模拟学习建议
const getMockSuggestions = (range: 'today' | 'week' | 'month'): StudySuggestionsResponse => {
  const suggestionsList = [
    '根据您的学习进度，建议每天安排2小时进行编程练习',
    '数学复习进度较慢，可以适当增加学习时间',
    '英语学习效果不错，继续保持',
    '下周有期中考试，建议提前复习重点内容',
    '可以尝试使用番茄工作法提高学习效率',
  ]

  let suggestions: string[] = []
  if (range === 'today') {
    suggestions = suggestionsList.slice(0, 2)
  } else if (range === 'week') {
    suggestions = suggestionsList.slice(0, 3)
  } else {
    suggestions = suggestionsList
  }

  return {
    success: true,
    suggestions,
    data: { suggestions },
  }
}

// 监听时间范围变化
watch(timeRange, () => {
  if (userStore.userState?.isLoggedIn) {
    fetchData()
  }
})

// 监听登录状态变化
watch(
  () => userStore.userState?.isLoggedIn,
  (newVal) => {
    if (newVal) {
      console.log('用户登录状态变化，重新获取数据')
      fetchData()
    }
  },
)

// 页面加载时自动获取数据
onMounted(() => {
  console.log('组件挂载，userStore:', userStore.userState)
  if (userStore.userState?.isLoggedIn) {
    fetchData()
  } else {
    error.value = '请先登录'
  }
})

// 组件卸载时销毁图表
onUnmounted(() => {
  if (difficultyChart.value) difficultyChart.value.dispose()
  if (planTypeChart.value) planTypeChart.value.dispose()
})
</script>

<style scoped>
.study-data-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  background-color: #f5f7fa;
  min-height: calc(100vh - 70px);
}

.time-range-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  background: white;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.time-range-selector label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

:deep(.el-select) {
  width: 160px;
}

.loading-container {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.data-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.statistics-card,
.suggestions-card {
  border-radius: 12px;
  overflow: hidden;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.stat-item {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  transition: all 0.3s ease;
  margin-bottom: 16px;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-label {
  display: block;
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  line-height: 1.3;
}

.charts-row {
  margin-top: 24px;
}

.chart-container {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
}

.chart {
  width: 100%;
  height: 300px;
}

.chart-legend {
  margin-top: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-size: 14px;
  color: #606266;
  border-bottom: 1px solid #e4e7ed;
}

.legend-item:last-child {
  border-bottom: none;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-name {
  flex: 1;
  font-weight: 500;
}

.legend-value {
  color: #909399;
}

.subject-card {
  margin-bottom: 12px;
  background: #f8f9fa;
  border: none;
}

.subject-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.subject-name {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.suggestion-content {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
}

.suggestion-content .el-icon {
  font-size: 18px;
  color: #409eff;
}

:deep(.el-divider__text) {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .study-data-container {
    padding: 16px;
  }

  .time-range-selector {
    flex-direction: column;
    align-items: flex-start;
  }

  :deep(.el-select) {
    width: 100%;
  }

  .stat-value {
    font-size: 20px;
  }

  .chart {
    height: 250px;
  }
}
</style>
