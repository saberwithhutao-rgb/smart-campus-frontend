<template>
  <div class="smart-qa-container">
    <GlobalNavbar />

    <!-- 主内容区 -->
    <div class="main-content">
      <div class="plan-detail-container">
        <div v-if="isLoading" class="loading">
          <el-skeleton :rows="5" />
        </div>

        <div v-else-if="taskDetail" class="plan-content">
          <div class="header-actions">
            <el-button @click="goBack" icon="ArrowLeft">返回</el-button>
          </div>

          <div class="plan-header">
            <h1>{{ taskDetail.title }}</h1>
            <div class="plan-badges">
              <!-- 复习阶段标签不变 -->
              <el-tag :type="getStageTagType(taskDetail.reviewStage)" size="large">
                第 {{ taskDetail.reviewStage }} 次复习
              </el-tag>

              <!-- 状态标签 - 根据复习状态显示不同内容 -->
              <el-tag :type="getReviewStatusTagType(reviewStatus.type)" size="large">
                {{ reviewStatus.displayText }}
              </el-tag>
            </div>
          </div>

          <div class="plan-info">
            <div class="info-item">
              <span class="label">生成时间：</span>
              <span class="value">{{ formatDateTime(taskDetail.createdAt) }}</span>
            </div>
            <div class="info-item">
              <span class="label">复习阶段：</span>
              <span class="value">{{ getReviewStageDescription(taskDetail.reviewStage) }}</span>
            </div>
          </div>

          <div class="action-section">
            <el-button
              type="primary"
              @click="confirmCompleteReview"
              :disabled="taskDetail.status === 'completed'"
              :loading="isCompleting"
            >
              {{ taskDetail.status === 'completed' ? '已完成复习' : '复习完成' }}
            </el-button>
            <el-button @click="openHistory" :loading="isLoadingHistory">
              查看历史复习建议
            </el-button>
            <el-button type="success" @click="generateReviewAdvice" :loading="isGenerating">
              AI生成复习建议
            </el-button>
          </div>

          <!-- 复习计划内容 -->
          <el-card class="plan-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <h2>📚 复习计划详情</h2>
              </div>
            </template>

            <div
              v-if="taskDetail.description"
              class="plan-content markdown-body"
              v-html="renderMarkdown(taskDetail.description)"
            ></div>
            <div v-else class="empty-content">
              <el-empty description="暂无复习内容，点击AI生成复习建议" />
            </div>
          </el-card>
        </div>

        <div v-else class="not-found">
          <el-empty description="未找到复习计划" />
        </div>
      </div>
    </div>

    <!-- 历史计划弹窗 -->
    <el-dialog
      v-model="showHistoryDialog"
      title="历史复习建议"
      width="80%"
      :fullscreen="isMobile"
      destroy-on-close
      @close="clearSearch"
      class="history-dialog"
    >
      <!-- 下拉选择框 - 美化后 -->
      <div class="filter-section">
        <div class="filter-label">筛选阶段：</div>
        <el-select
          v-model="selectedStage"
          placeholder="全部阶段"
          clearable
          @clear="clearSearch"
          class="stage-select"
          size="large"
        >
          <el-option
            v-for="stage in availableStages"
            :key="stage"
            :label="`第 ${stage} 次复习`"
            :value="stage"
          >
            <div class="custom-option">
              <el-tag :type="getStageTagType(stage)" size="small" effect="plain">
                第 {{ stage }} 次
              </el-tag>
              <span class="option-count"> {{ getStageSuggestions(stage).length }} 个版本 </span>
            </div>
          </el-option>
        </el-select>
      </div>

      <!-- 统计信息 -->
      <div class="stats-info" v-if="planSuggestions.length">
        <el-alert :closable="false" type="info" show-icon>
          <template #title>
            共 {{ planSuggestions.length }} 条复习建议，{{ availableStages.length }} 个复习阶段
          </template>
        </el-alert>
      </div>

      <!-- 按阶段分组显示 -->
      <div class="suggestions-container" v-if="planSuggestions.length">
        <div v-for="stage in filteredStages" :key="stage" class="stage-group">
          <div class="stage-header">
            <h3>
              第 {{ stage }} 次复习
              <el-tag :type="getStageTagType(stage)" size="small" effect="light">
                {{ getStageSuggestions(stage).length }} 个版本
              </el-tag>
            </h3>
          </div>
          <el-timeline>
            <el-timeline-item
              v-for="suggestion in getStageSuggestions(stage)"
              :key="suggestion.id"
              :timestamp="formatDateTime(suggestion.createdAt)"
              :type="suggestion.isCurrent ? 'primary' : 'info'"
              placement="top"
              size="large"
            >
              <el-card
                class="suggestion-card"
                :class="{ 'current-version': suggestion.isCurrent }"
                @click="viewSuggestion(suggestion)"
                shadow="hover"
              >
                <div class="version-badge">
                  <span class="version-number">版本 {{ suggestion.version }}</span>
                  <el-tag v-if="suggestion.isCurrent" size="small" type="success" effect="dark"
                    >当前使用</el-tag
                  >
                  <el-tag v-else size="small" type="info" effect="plain">历史版本</el-tag>
                </div>
                <div class="preview">{{ getPlainTextPreview(suggestion.content, 150) }}</div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty v-else description="暂无历史复习建议" />
    </el-dialog>

    <!-- 确认完成复习对话框 -->
    <el-dialog
      v-model="showCompleteDialog"
      title="确认完成复习"
      width="400px"
      :close-on-click-modal="false"
    >
      <div class="complete-confirm">
        <el-icon class="warning-icon" size="40" color="#E6A23C"><WarningFilled /></el-icon>
        <p>确定已完成本次复习吗？</p>
        <p class="tip">完成后将自动生成下一次复习任务</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCompleteDialog = false">取消</el-button>
          <el-button type="primary" @click="completeReview" :loading="isCompleting">
            确认完成
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import GlobalNavbar from '../components/GlobalNavbar.vue'
import { onMounted, ref, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStudyPlanStore } from '@/stores/studyPlan'
import type { StudyTask } from '@/stores/studyPlan'
import * as studyApi from '@/api/study'
import { ElMessage, ElMessageBox } from 'element-plus'
import { WarningFilled } from '@element-plus/icons-vue'
import type { ReviewSuggestion } from '@/api/study'
import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

const route = useRoute()
const router = useRouter()
const studyPlanStore = useStudyPlanStore()
const taskId = Number(route.params.id)
const taskDetail = ref<StudyTask | null>(null)
const isLoading = ref(false)
const isGenerating = ref(false)
const isCompleting = ref(false)
const isLoadingHistory = ref(false)
const showHistoryDialog = ref(false)
const showCompleteDialog = ref(false)
const isMobile = ref(window.innerWidth <= 768)
const planSuggestions = ref<ReviewSuggestion[]>([])
const selectedStage = ref<number | null>(null)

// 配置 marked
marked.use(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value
      }
      return hljs.highlightAuto(code).value
    },
  }),
)

const availableStages = computed(() => {
  const stages = [...new Set(planSuggestions.value.map((s) => s.reviewStage))]
  return stages.sort((a, b) => a - b)
})

// 按阶段过滤
const filteredStages = computed(() => {
  if (!selectedStage.value) return availableStages.value
  return availableStages.value.filter((s) => s === selectedStage.value)
})

// 获取某个阶段的所有建议（按版本倒序）
const getStageSuggestions = (stage: number) => {
  return planSuggestions.value
    .filter((s) => s.reviewStage === stage)
    .sort((a, b) => b.version - a.version)
}

// 查看建议详情
const viewSuggestion = (suggestion: ReviewSuggestion) => {
  ElMessageBox.alert(
    `<div class="markdown-body">${renderMarkdown(suggestion.content)}</div>`,
    `第 ${suggestion.reviewStage} 次复习 - 版本 ${suggestion.version}`,
    {
      dangerouslyUseHTMLString: true,
      customClass: 'suggestion-detail-dialog',
    },
  )
}

const openHistory = async () => {
  if (!taskDetail.value) return

  showHistoryDialog.value = true
  isLoadingHistory.value = true
  try {
    // 只需要获取 suggestions
    const suggestions = await studyApi.getPlanSuggestions(taskDetail.value.planId)
    planSuggestions.value = suggestions
  } catch (error) {
    console.error('获取历史记录失败:', error)
    ElMessage.error('获取历史记录失败')
  } finally {
    isLoadingHistory.value = false
  }
}

// 清空搜索
const clearSearch = () => {
  selectedStage.value = null
}
const handleResize = () => {
  isMobile.value = window.innerWidth <= 768
}

// 获取复习阶段描述（去掉天数）
const getReviewStageDescription = (stage: number) => {
  const descriptions: Record<number, string> = {
    1: '第一次复习',
    2: '第二次复习',
    3: '第三次复习',
    4: '第四次复习',
    5: '第五次复习',
  }
  return descriptions[stage] || `第${stage}次复习`
}

// 获取阶段标签类型
const getStageTagType = (stage: number) => {
  const types: Record<number, string> = {
    1: 'info',
    2: 'primary',
    3: 'warning',
    4: 'danger',
    5: 'success',
  }
  return types[stage] || 'info'
}

// 渲染 Markdown
const renderMarkdown = (content: string) => {
  if (!content) return ''
  return marked(content)
}

// 获取纯文本预览
const getPlainTextPreview = (content: string, maxLength: number = 100) => {
  if (!content) return ''
  const plain = content
    .replace(/#{1,6}\s?/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/`{1,3}[^`]+`{1,3}/g, '')
    .replace(/\n/g, ' ')
    .trim()
  return plain.length > maxLength ? plain.substring(0, maxLength) + '...' : plain
}

// 格式化日期时间
const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '未知时间'
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '未知时间'
    return `${date.toLocaleDateString('zh-CN')} ${date.toLocaleTimeString('zh-CN')}`
  } catch {
    return '未知时间'
  }
}

const reviewStatus = computed(() => {
  if (!taskDetail.value) return { type: 'unknown', displayText: '未知状态' }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const taskDate = new Date(taskDetail.value.taskDate)
  taskDate.setHours(0, 0, 0, 0)

  // 已完成状态
  if (taskDetail.value.status === 'completed') {
    return {
      type: 'completed',
      displayText: '已完成',
    }
  }

  // 待复习 - 日期 <= 今天
  if (taskDetail.value.status === 'pending' && taskDate <= today) {
    return {
      type: 'ongoing',
      displayText: '待复习',
    }
  }

  // 未来复习 - 日期 > 今天
  if (taskDetail.value.status === 'pending' && taskDate > today) {
    const diffTime = taskDate.getTime() - today.getTime()
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return {
      type: 'future',
      displayText: `距离复习还有 ${daysLeft} 天`,
    }
  }

  return { type: 'unknown', displayText: '未知状态' }
})

// 获取状态标签类型（复用 SmartReview.vue 的逻辑）
const getReviewStatusTagType = (type: string) => {
  const map: Record<string, string> = {
    ongoing: 'warning', // 待复习 - 黄色
    future: 'info', // 未来 - 蓝色
    completed: 'success', // 已完成 - 绿色
    unknown: 'danger', // 未知 - 红色
  }
  return map[type] || 'info'
}

onMounted(async () => {
  isLoading.value = true
  try {
    const response = await studyApi.getReviewTaskDetail(taskId)
    console.log('api返回原始数据:', response)
    console.log('是否有id:', response?.id)

    taskDetail.value = response || null
    console.log('赋值后的taskDetail:', taskDetail.value)
  } catch (error) {
    console.error('获取复习详情失败:', error)
    ElMessage.error('获取复习详情失败')
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// 显示确认完成对话框
const confirmCompleteReview = () => {
  if (!taskDetail.value) return
  if (taskDetail.value.status === 'completed') {
    ElMessage.info('该复习已完成')
    return
  }
  showCompleteDialog.value = true
}

// 完成复习
const completeReview = async () => {
  if (!taskDetail.value) return
  console.log('准备完成复习，taskDetail.value:', taskDetail.value)
  console.log('taskDetail.value.id:', taskDetail.value.id)

  isCompleting.value = true
  try {
    // 调用完成复习接口
    await studyApi.completeReviewTask(taskDetail.value.id)

    ElMessage.success('复习完成，已生成下一次复习任务')
    showCompleteDialog.value = false

    // 刷新任务列表
    await studyPlanStore.fetchAllReviewTasks()

    // 返回列表页
    router.push('/ai/study/review')
  } catch (error) {
    console.error('完成复习失败:', error)
    ElMessage.error('完成复习失败')
  } finally {
    isCompleting.value = false
  }
}

const generateReviewAdvice = async () => {
  if (!taskDetail.value) return

  isGenerating.value = true
  try {
    // 只需要这一个请求
    const advice = await studyApi.generateReviewAdvice({
      taskId: taskDetail.value.id,
      title: taskDetail.value.title,
      reviewStage: taskDetail.value.reviewStage,
    })

    taskDetail.value.description = advice // 直接更新页面显示

    ElMessage.success('复习建议生成成功')
  } catch (error) {
    console.error('生成复习建议失败:', error)
    ElMessage.error('生成复习建议失败')
  } finally {
    isGenerating.value = false
  }
}

const goBack = () => router.go(-1)
</script>

<style scoped>
/* ==================== 全局弹窗样式 ==================== */
.history-dialog :deep(.el-dialog__body) {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

/* 版本详情弹窗 - 调宽 */
:deep(.suggestion-detail-dialog) {
  width: 90% !important;
  max-width: 1000px !important;
}

:deep(.suggestion-detail-dialog .el-message-box__message) {
  max-height: 70vh;
  overflow-y: auto;
  padding: 0 20px;
}

:deep(.suggestion-detail-dialog .markdown-body) {
  font-size: 15px;
  line-height: 1.8;
}

/* ==================== 筛选区域 ==================== */
.filter-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.filter-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
  white-space: nowrap;
}

/* 选择框 - 缩短宽度 */
.stage-select {
  width: 280px !important; /* 固定宽度，不要太长 */
}

.stage-select :deep(.el-input__wrapper) {
  background-color: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.stage-select :deep(.el-input__inner) {
  height: 40px;
  font-size: 14px;
}

/* 自定义选项样式 */
.custom-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 4px 0;
}

.option-count {
  font-size: 13px;
  color: var(--text-color-light);
}

/* ==================== 统计信息 ==================== */
.stats-info {
  margin-bottom: 20px;
}

.stats-info :deep(.el-alert) {
  background-color: #ecf5ff;
  border: none;
  border-radius: 8px;
}

/* ==================== 阶段分组 ==================== */
.stage-group {
  margin-bottom: 32px;
}

.stage-group:last-child {
  margin-bottom: 0;
}

.stage-header {
  margin-bottom: 16px;
}

.stage-header h3 {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

/* ==================== 建议卡片 ==================== */
.suggestion-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.suggestion-card:hover {
  transform: translateX(4px);
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.suggestion-card.current-version {
  background-color: #f0f9eb;
  border-color: #67c23a;
}

.suggestion-card.current-version:hover {
  background-color: #e1f3d8;
}

.version-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.version-number {
  font-weight: 600;
  color: var(--text-color);
}

.preview {
  font-size: 14px;
  color: var(--text-color-secondary);
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* ==================== 时间线样式 ==================== */
:deep(.el-timeline-item__timestamp) {
  color: var(--text-color-light);
  font-size: 13px;
  font-weight: normal;
}

:deep(.el-timeline-item__wrapper) {
  padding-left: 20px;
}

:deep(.el-timeline-item__tail) {
  border-left: 2px solid #e4e7ed;
}

:deep(.el-timeline-item__node--primary) {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

:deep(.el-timeline-item__node--info) {
  background-color: #909399;
  border-color: #909399;
}

/* ==================== 确认完成对话框 ==================== */
.complete-confirm {
  text-align: center;
  padding: 20px 0;
}

.complete-confirm p {
  margin: 10px 0;
  font-size: 16px;
}

.complete-confirm .tip {
  font-size: 14px;
  color: #909399;
}

.warning-icon {
  margin-bottom: 10px;
}

/* ==================== 移动端适配 ==================== */
@media (max-width: 768px) {
  .filter-section {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  /* 移动端选择框宽度自适应 */
  .stage-select {
    width: 100% !important;
  }

  .stage-header h3 {
    font-size: 16px;
  }

  /* 移动端弹窗宽度 */
  :deep(.suggestion-detail-dialog) {
    width: 95% !important;
    max-width: 95% !important;
  }
}
</style>
