<template>
  <div class="study-data-container">
    <!-- 时间范围选择器 -->
    <div class="time-range-selector">
      <label>时间范围：</label>
      <select v-model="timeRange" class="time-select" @change="handleTimeRangeChange">
        <option value="today">今天</option>
        <option value="week">过去一周</option>
        <option value="month">过去一个月</option>
      </select>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 错误提示 -->
    <div v-else-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>
      <button class="retry-btn" @click="fetchData">重试</button>
    </div>

    <!-- 数据展示区域 -->
    <div v-else class="data-content">
      <!-- 统计分析卡片 -->
      <div class="statistics-card">
        <h3>统计分析</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">总计划数</span>
            <span class="stat-value">{{ statistics?.totalPlanCount || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">已完成计划数</span>
            <span class="stat-value">{{ statistics?.completedPlanCount || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">完成率</span>
            <span class="stat-value"
              >{{ ((statistics?.completionRate || 0) * 100).toFixed(2) }}%</span
            >
          </div>
          <div class="stat-item">
            <span class="stat-label">平均进度</span>
            <span class="stat-value"
              >{{ ((statistics?.averageProgress || 0) * 100).toFixed(2) }}%</span
            >
          </div>
          <div class="stat-item">
            <span class="stat-label">延期计划数</span>
            <span class="stat-value">{{ statistics?.overduePlanCount || 0 }}</span>
          </div>
        </div>

        <!-- 难度分布 -->
        <div v-if="statistics?.difficultyDistribution" class="distribution-section">
          <h4>难度分布</h4>
          <div class="distribution-list">
            <div
              v-for="item in statistics.difficultyDistribution.details"
              :key="item.type"
              class="distribution-item"
            >
              <span>{{ item.type }}</span>
              <span>{{ item.count }}个 ({{ (item.percentage * 100).toFixed(2) }}%)</span>
            </div>
          </div>
        </div>

        <!-- 计划类型分布 -->
        <div v-if="statistics?.planTypeDistribution" class="distribution-section">
          <h4>计划类型分布</h4>
          <div class="distribution-list">
            <div
              v-for="item in statistics.planTypeDistribution.details"
              :key="item.type"
              class="distribution-item"
            >
              <span>{{ item.type }}</span>
              <span>{{ item.count }}个 ({{ (item.percentage * 100).toFixed(2) }}%)</span>
            </div>
          </div>
        </div>

        <!-- 各科目计划数量 -->
        <div v-if="statistics?.subjectDistribution" class="distribution-section">
          <h4>各科目计划数量</h4>
          <div class="distribution-list">
            <div
              v-for="(count, subject) in statistics.subjectDistribution"
              :key="subject"
              class="distribution-item"
            >
              <span>{{ subject }}</span>
              <span>{{ count }}个</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 学习建议卡片 -->
      <div class="suggestions-card">
        <h3>学习建议</h3>
        <div v-if="suggestions && suggestions.length > 0" class="suggestion-list">
          <div v-for="(suggestion, index) in suggestions" :key="index" class="suggestion-item">
            {{ suggestion }}
          </div>
        </div>
        <div v-else class="no-suggestions">暂无学习建议</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { getStudyStatistics, getStudySuggestions } from '../api/study'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// 获取用户ID
const userId = computed(() => userStore.userInfo?.userId)

// 响应式数据
const timeRange = ref('today') // 默认时间范围为今天
const loading = ref(false) // 加载状态
const error = ref('') // 错误信息
const statistics = ref(null) // 统计数据
const suggestions = ref([]) // 学习建议

// 处理时间范围切换
const handleTimeRangeChange = () => {
  fetchData()
}

// 获取数据
const fetchData = async () => {
  loading.value = true
  error.value = ''

  try {
    // 🔴 直接从 token 解析 userId
    const token = localStorage.getItem('userToken')
    let userId = 0

    if (token && token.startsWith('jwt-')) {
      const parts = token.split('-')
      if (parts.length >= 2) {
        userId = parseInt(parts[1], 10)
        console.log('从 token 解析出 userId:', userId)
      }
    }

    if (!userId) {
      error.value = '无法获取用户ID'
      return
    }

    console.log('请求参数:', {
      timeRange: timeRange.value,
      userId,
    })

    const [statsData, suggestionsData] = await Promise.all([
      getStudyStatistics({
        timeRange: timeRange.value,
        userId,
      }),
      getStudySuggestions({
        timeRange: timeRange.value,
        userId,
      }),
    ])

    statistics.value = statsData
    suggestions.value = suggestionsData.suggestions || suggestionsData || []
  } catch (err) {
    console.error('请求失败:', err)
    error.value = err.message || '请求失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 页面加载时自动获取数据
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.study-data-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.time-range-selector {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  gap: 10px;
}

.time-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-container {
  background-color: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 20px;
  text-align: center;
}

.error-message {
  color: #f56c6c;
  margin-bottom: 16px;
}

.retry-btn {
  padding: 6px 16px;
  background-color: #f56c6c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.retry-btn:hover {
  background-color: #f78989;
}

.data-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.statistics-card,
.suggestions-card {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  background-color: white;
  padding: 16px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.distribution-section {
  margin-bottom: 24px;
}

h4 {
  margin-top: 0;
  margin-bottom: 12px;
  color: #666;
  font-size: 14px;
  font-weight: 600;
}

.distribution-list {
  background-color: white;
  border-radius: 6px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.distribution-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.distribution-item:last-child {
  border-bottom: none;
}

.suggestion-list {
  background-color: white;
  border-radius: 6px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.suggestion-item {
  padding: 12px;
  margin-bottom: 12px;
  background-color: #f0f9eb;
  border-left: 4px solid #67c23a;
  border-radius: 4px;
  line-height: 1.5;
}

.suggestion-item:last-child {
  margin-bottom: 0;
}

.no-suggestions {
  background-color: white;
  border-radius: 6px;
  padding: 40px 20px;
  text-align: center;
  color: #999;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .time-range-selector {
    flex-direction: column;
    align-items: flex-start;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
