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
    <div v-if="statsLoading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- 错误提示 -->
    <el-alert v-else-if="error" :title="error" type="error" :closable="false" show-icon>
      <template #action>
        <el-button size="small" type="danger" @click="fetchStatistics">重试</el-button>
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

      <!-- 学习建议卡片 - 手动生成 -->
      <el-card class="suggestions-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <h3>💡 AI 学习建议</h3>
            <div class="suggestions-actions">
              <span v-if="currentSuggestion?.time" class="suggestions-time">
                <el-icon><Clock /></el-icon>
                生成于 {{ currentSuggestion.time }}
              </span>
              <el-button
                type="primary"
                size="small"
                :loading="suggestionsLoading"
                @click="generateSuggestions"
              >
                {{ currentSuggestion?.content ? '重新生成' : '生成建议' }}
              </el-button>
            </div>
          </div>
        </template>

        <div v-if="currentSuggestion?.content">
          <el-empty v-if="!hasSuggestions" description="暂无学习建议" />
          <el-timeline v-else>
            <el-timeline-item
              v-for="(suggestion, index) in currentSuggestion.content"
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
        </div>
        <div v-else class="suggestions-empty">
          <el-empty description="点击「生成建议」获取 AI 学习建议">
            <template #image>
              <el-icon :size="60"><MagicStick /></el-icon>
            </template>
          </el-empty>
        </div>
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
import { MagicStick, Clock } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const userStore = useUserStore()

// 响应式数据
const timeRange = ref<'today' | 'week' | 'month'>('month')
const statsLoading = ref(false)
const suggestionsLoading = ref(false)
const error = ref('')
const statistics = ref<StudyStatisticsResponse | null>(null)

// 缓存结构：每个时间范围存储建议内容和生成时间
interface SuggestionCache {
  content: StudySuggestionsResponse | null
  time: string
}

const suggestionsCache = ref<Record<'today' | 'week' | 'month', SuggestionCache>>({
  today: { content: null, time: '' },
  week: { content: null, time: '' },
  month: { content: null, time: '' },
})

// 当前显示的建议（根据 timeRange 从缓存读取）
const currentSuggestion = computed(() => {
  return suggestionsCache.value[timeRange.value]
})

// ECharts 实例
const difficultyChartRef = ref<HTMLElement>()
const planTypeChartRef = ref<HTMLElement>()
let difficultyChart: echarts.ECharts | null = null
let planTypeChart: echarts.ECharts | null = null

// 时间范围文本
const timeRangeText = computed(() => {
  const map = { today: '今天', week: '过去一周', month: '过去一个月' }
  return map[timeRange.value]
})

// 统计列表
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
  difficulty: { 简单: '#67C23A', 中等: '#E6A23C', 困难: '#F56C6C' },
  planType: { 学习计划: '#409EFF', 复习计划: '#E6A23C', 项目计划: '#67C23A' },
}

// 难度分布图例数据
const difficultyLegend = computed(() => {
  const details = statistics.value?.difficultyDistribution?.details || []
  return details.map((item) => ({
    name: item.type,
    value: item.count,
    percentage: (item.percentage * 100).toFixed(2),
    color: CHART_COLORS.difficulty[item.type as keyof typeof CHART_COLORS.difficulty] || '#909399',
  }))
})

// 计划类型分布图例数据
const planTypeLegend = computed(() => {
  const details = statistics.value?.planTypeDistribution?.details || []
  return details.map((item) => ({
    name: item.type,
    value: item.count,
    percentage: (item.percentage * 100).toFixed(2),
    color: CHART_COLORS.planType[item.type as keyof typeof CHART_COLORS.planType] || '#909399',
  }))
})

const hasSuggestions = computed(() => {
  const list = suggestionList.value
  return list && list.length > 0
})

const suggestionList = computed(() => {
  const content = currentSuggestion.value?.content
  if (!content) return []
  if (Array.isArray(content)) return content
  if (content.suggestions) return content.suggestions
  if (content.data?.suggestions) return content.data.suggestions
  return []
})

const getSuggestionType = (index: number) => {
  const types = ['primary', 'success', 'warning', 'info']
  return types[index % types.length] as 'primary' | 'success' | 'warning' | 'info'
}

// 渲染环形图
const renderCharts = () => {
  nextTick(() => {
    // 难度分布环形图
    if (difficultyChartRef.value && difficultyLegend.value.length > 0) {
      if (difficultyChart) difficultyChart.dispose()
      difficultyChart = echarts.init(difficultyChartRef.value)

      difficultyChart.setOption({
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c}个 ({d}%)',
        },
        series: [
          {
            name: '难度分布',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
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
      if (planTypeChart) planTypeChart.dispose()
      planTypeChart = echarts.init(planTypeChartRef.value)

      planTypeChart.setOption({
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c}个 ({d}%)',
        },
        series: [
          {
            name: '计划类型分布',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
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

// 窗口大小变化处理
const handleResize = () => {
  difficultyChart?.resize()
  planTypeChart?.resize()
}

// 获取统计数据
const fetchStatistics = async () => {
  statsLoading.value = true
  error.value = ''
  try {
    const data = await getStudyStatistics({ timeRange: timeRange.value })
    statistics.value = data
  } catch (err) {
    console.error('获取统计数据失败:', err)
    error.value = err instanceof Error ? err.message : '获取数据失败，请稍后重试'
    statistics.value = null
  } finally {
    statsLoading.value = false
  }
}

// 生成 AI 建议（带缓存）
const generateSuggestions = async () => {
  suggestionsLoading.value = true
  try {
    const data = await getStudySuggestions({ timeRange: timeRange.value })

    // 存入缓存
    const now = new Date()
    const timeStr = `${now.getMonth() + 1}-${now.getDate()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    suggestionsCache.value[timeRange.value] = {
      content: data,
      time: timeStr,
    }
  } catch (err) {
    console.error('生成学习建议失败:', err)
    suggestionsCache.value[timeRange.value] = {
      content: null,
      time: '',
    }
  } finally {
    suggestionsLoading.value = false
  }
}

// 处理时间范围切换
const handleTimeRangeChange = () => {
  fetchStatistics()
  // 不需要清空建议，直接从缓存读取
}

// 监听登录状态
watch(
  () => userStore.userState?.isLoggedIn,
  (newVal) => {
    if (newVal) {
      fetchStatistics()
    }
  },
)

// 页面加载
onMounted(() => {
  if (userStore.userState?.isLoggedIn) {
    fetchStatistics()
  } else {
    error.value = '请先登录'
  }
  window.addEventListener('resize', handleResize)
})

// 组件卸载时销毁图表
onUnmounted(() => {
  if (difficultyChart) {
    difficultyChart.dispose()
    difficultyChart = null
  }
  if (planTypeChart) {
    planTypeChart.dispose()
    planTypeChart = null
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
/* 整体布局 */
.study-data-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  background-color: var(--color-bg);
  min-height: calc(100vh - 70px);
  margin-top: 70px;
}

/* 时间范围选择器 */
.time-range-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  background: var(--color-bg-card);
  padding: 16px 24px;
  border-radius: var(--radius-lg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.time-range-selector label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

:deep(.el-select) {
  width: 160px;
}

/* 加载状态 */
.loading-container {
  background: var(--color-bg-card);
  padding: 40px;
  border-radius: var(--radius-lg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* 数据内容区域 */
.data-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 卡片通用样式 */
.statistics-card,
.suggestions-card {
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
}

/* 建议卡片操作区 */
.suggestions-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.suggestions-time {
  font-size: 12px;
  color: var(--color-text-light);
  display: flex;
  align-items: center;
  gap: 4px;
}

.suggestions-time .el-icon {
  font-size: 12px;
}

/* 统计项 */
.stat-item {
  background: var(--color-bg-light);
  padding: 20px;
  border-radius: var(--radius-md);
  text-align: center;
  transition: all 0.3s ease;
  margin-bottom: 16px;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-label {
  display: block;
  font-size: 14px;
  color: var(--color-text-light);
  margin-bottom: 8px;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.3;
}

/* 图表行 */
.charts-row {
  margin-top: 24px;
}

/* 图表容器 */
.chart-container {
  background: var(--color-bg-card);
  padding: 20px;
  border-radius: var(--radius-lg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 16px 0;
}

.chart {
  width: 100%;
  height: 300px;
}

/* 图例 */
.chart-legend {
  margin-top: 16px;
  padding: 12px;
  background: var(--color-bg-light);
  border-radius: var(--radius-md);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-size: 14px;
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
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
  color: var(--color-text-light);
}

/* 科目卡片 */
.subject-card {
  margin-bottom: 12px;
  background: var(--color-bg-light);
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
  color: var(--color-text-secondary);
}

/* 建议内容 */
.suggestion-content {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text-secondary);
}

.suggestion-content .el-icon {
  font-size: 18px;
  color: var(--color-primary);
}

/* 空状态 */
.suggestions-empty {
  padding: 40px 0;
  text-align: center;
}

.suggestions-empty .el-icon {
  color: var(--color-text-light);
}

:deep(.el-divider__text) {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
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
