<template>
  <div class="review-detail">
    <GlobalNavbar />

    <!-- 主内容区 -->
    <div class="main-content">
      <div class="detail-container">
        <!-- 加载状态 -->
        <div v-if="isLoading" class="loading-state">
          <el-skeleton :rows="8" animated />
        </div>

        <!-- 详情内容 -->
        <div v-else-if="taskDetail" class="detail-content">
          <!-- 返回按钮和操作栏 -->
          <div class="action-bar">
            <button class="btn-back" @click="goBack">
              <svg class="icon" viewBox="0 0 24 24" width="20" height="20">
                <path
                  d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
                  fill="currentColor"
                />
              </svg>
              返回列表
            </button>

            <div class="action-buttons">
              <button class="btn-history" @click="openHistory" :disabled="isLoadingHistory">
                <svg class="icon" viewBox="0 0 24 24" width="18" height="18">
                  <path
                    d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"
                    fill="currentColor"
                  />
                </svg>
                {{ isLoadingHistory ? '加载中...' : '历史版本' }}
              </button>

              <button class="btn-generate" @click="generateReviewAdvice" :disabled="isGenerating">
                <svg class="icon" viewBox="0 0 24 24" width="18" height="18">
                  <path
                    d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm4 12h-4v3h-2v-3H8v-2h4V9h2v4h4v2z"
                    fill="currentColor"
                  />
                </svg>
                {{ isGenerating ? '生成中...' : 'AI生成建议' }}
              </button>
            </div>
          </div>

          <!-- 标题和标签 -->
          <div class="detail-header">
            <h1 class="title">{{ taskDetail.title }}</h1>
            <div class="badge-group">
              <span class="badge" :class="`stage-${taskDetail.reviewStage}`">
                第 {{ taskDetail.reviewStage }} 次复习
              </span>
              <span class="badge" :class="reviewStatus.type">
                {{ reviewStatus.displayText }}
              </span>
            </div>
          </div>

          <!-- 基本信息卡片 -->
          <div class="info-card">
            <div class="info-item">
              <span class="label">📅 生成时间</span>
              <span class="value">{{ formatDateTime(taskDetail.createdAt) }}</span>
            </div>
            <div class="info-item">
              <span class="label">🔄 复习阶段</span>
              <span class="value">{{ getReviewStageDescription(taskDetail.reviewStage) }}</span>
            </div>
            <div class="info-item">
              <span class="label">📊 当前状态</span>
              <span class="value">
                <span class="status-dot" :class="taskDetail.status"></span>
                {{ taskDetail.status === 'completed' ? '已完成' : '进行中' }}
              </span>
            </div>
          </div>

          <!-- 复习内容卡片 -->
          <div class="content-card">
            <div class="card-header">
              <h2>📚 复习计划详情</h2>
              <button
                v-if="taskDetail.status !== 'completed'"
                class="btn-complete"
                @click="confirmCompleteReview"
              >
                <svg class="icon" viewBox="0 0 24 24" width="18" height="18">
                  <path
                    d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                    fill="currentColor"
                  />
                </svg>
                标记完成
              </button>
            </div>

            <div
              v-if="taskDetail.description"
              class="markdown-content"
              v-html="renderMarkdown(taskDetail.description)"
            ></div>
            <div v-else class="empty-state">
              <svg class="empty-icon" viewBox="0 0 24 24" width="60" height="60">
                <path
                  d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"
                  fill="#e0e0e0"
                />
              </svg>
              <p>暂无复习内容</p>
              <button class="btn-generate-empty" @click="generateReviewAdvice">
                点击生成复习建议
              </button>
            </div>
          </div>
        </div>

        <!-- 未找到状态 -->
        <div v-else class="not-found">
          <svg class="not-found-icon" viewBox="0 0 24 24" width="80" height="80">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
              fill="#f0f0f0"
            />
          </svg>
          <p>未找到复习计划</p>
          <button class="btn-back-home" @click="router.push('/ai/study/review')">
            返回复习列表
          </button>
        </div>
      </div>
    </div>

    <!-- 历史版本弹窗 -->
    <el-dialog
      v-model="showHistoryDialog"
      title="历史复习建议"
      width="800px"
      :fullscreen="isMobile"
      destroy-on-close
      class="history-dialog"
    >
      <!-- 筛选 -->
      <div class="filter-bar">
        <span class="filter-label">筛选阶段：</span>
        <el-select v-model="selectedStage" placeholder="全部阶段" clearable class="filter-select">
          <el-option
            v-for="stage in availableStages"
            :key="stage"
            :label="`第 ${stage} 次复习`"
            :value="stage"
          >
            <div class="stage-option">
              <span class="stage-tag">第 {{ stage }} 次</span>
              <span class="stage-count">{{ getStageSuggestions(stage).length }} 个版本</span>
            </div>
          </el-option>
        </el-select>
      </div>

      <!-- 统计 -->
      <div class="stats-banner" v-if="planSuggestions.length">
        <el-alert :closable="false" type="info" show-icon>
          共 {{ planSuggestions.length }} 条复习建议，{{ availableStages.length }} 个复习阶段
        </el-alert>
      </div>

      <!-- 历史列表 -->
      <div class="history-list" v-if="planSuggestions.length">
        <div v-for="stage in filteredStages" :key="stage" class="stage-section">
          <div class="stage-title">
            <h3>第 {{ stage }} 次复习</h3>
            <span class="stage-badge">{{ getStageSuggestions(stage).length }} 个版本</span>
          </div>

          <div class="version-list">
            <div
              v-for="suggestion in getStageSuggestions(stage)"
              :key="suggestion.id"
              class="version-card"
              :class="{ current: suggestion.isCurrent }"
              @click="viewSuggestion(suggestion)"
            >
              <div class="version-header">
                <span class="version-number">版本 {{ suggestion.version }}</span>
                <span class="version-time">{{ formatDateTime(suggestion.createdAt) }}</span>
              </div>
              <div class="version-preview">
                {{ getPlainTextPreview(suggestion.content, 120) }}
              </div>
              <div class="version-footer">
                <span v-if="suggestion.isCurrent" class="current-badge">当前使用</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-history">
        <el-empty description="暂无历史复习建议" />
      </div>
    </el-dialog>

    <!-- 确认完成对话框 -->
    <el-dialog
      v-model="showCompleteDialog"
      title="确认完成复习"
      width="400px"
      class="confirm-dialog"
    >
      <div class="confirm-content">
        <svg class="confirm-icon" viewBox="0 0 24 24" width="48" height="48">
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
            fill="#52c41a"
          />
        </svg>
        <p class="confirm-title">确定已完成本次复习吗？</p>
        <p class="confirm-tip">完成后将自动生成下一次复习任务</p>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <button class="btn-dialog-cancel" @click="showCompleteDialog = false">取消</button>
          <button class="btn-dialog-confirm" @click="completeReview" :disabled="isCompleting">
            {{ isCompleting ? '处理中...' : '确认完成' }}
          </button>
        </div>
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
import type { ReviewSuggestion } from '@/api/study'
import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

const route = useRoute()
const router = useRouter()
const studyPlanStore = useStudyPlanStore()
const taskId = Number(route.params.id)

// 状态
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

// 计算属性
const availableStages = computed(() => {
  const stages = [...new Set(planSuggestions.value.map((s) => s.reviewStage))]
  return stages.sort((a, b) => a - b)
})

const filteredStages = computed(() => {
  if (!selectedStage.value) return availableStages.value
  return availableStages.value.filter((s) => s === selectedStage.value)
})

const reviewStatus = computed(() => {
  if (!taskDetail.value) return { type: 'unknown', displayText: '未知状态' }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const taskDate = new Date(taskDetail.value.taskDate)
  taskDate.setHours(0, 0, 0, 0)

  if (taskDetail.value.status === 'completed') {
    return { type: 'completed', displayText: '已完成' }
  }

  if (taskDetail.value.status === 'pending' && taskDate <= today) {
    return { type: 'ongoing', displayText: '待复习' }
  }

  if (taskDetail.value.status === 'pending' && taskDate > today) {
    const diffTime = taskDate.getTime() - today.getTime()
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return { type: 'future', displayText: `距离复习还有 ${daysLeft} 天` }
  }

  return { type: 'unknown', displayText: '未知状态' }
})

// 方法
const getStageSuggestions = (stage: number) => {
  return planSuggestions.value
    .filter((s) => s.reviewStage === stage)
    .sort((a, b) => b.version - a.version)
}

const getReviewStageDescription = (stage: number) => {
  const descriptions: Record<number, string> = {
    1: '第一次复习（1天后）',
    2: '第二次复习（3天后）',
    3: '第三次复习（7天后）',
    4: '第四次复习（15天后）',
    5: '第五次复习（30天后）',
  }
  return descriptions[stage] || `第${stage}次复习`
}

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '未知时间'
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '未知时间'
    return `${date.toLocaleDateString('zh-CN')} ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  } catch {
    return '未知时间'
  }
}

const renderMarkdown = (content: string) => {
  if (!content) return ''
  return marked(content)
}

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

const openHistory = async () => {
  if (!taskDetail.value) return
  showHistoryDialog.value = true
  isLoadingHistory.value = true
  try {
    const suggestions = await studyApi.getPlanSuggestions(taskDetail.value.planId)
    planSuggestions.value = suggestions
  } catch (error) {
    console.error('获取历史记录失败:', error)
    ElMessage.error('获取历史记录失败')
  } finally {
    isLoadingHistory.value = false
  }
}

const viewSuggestion = (suggestion: ReviewSuggestion) => {
  ElMessageBox({
    title: `第 ${suggestion.reviewStage} 次复习 - 版本 ${suggestion.version}`,
    message: `<div class="markdown-body">${renderMarkdown(suggestion.content)}</div>`,
    dangerouslyUseHTMLString: true,
    customClass: 'suggestion-detail-dialog',
    showConfirmButton: true,
    confirmButtonText: '关闭',
  })
}

const generateReviewAdvice = async () => {
  if (!taskDetail.value) return
  isGenerating.value = true
  try {
    const advice = await studyApi.generateReviewAdvice({
      taskId: taskDetail.value.id,
      title: taskDetail.value.title,
      reviewStage: taskDetail.value.reviewStage,
    })
    taskDetail.value.description = advice
    ElMessage.success('复习建议生成成功')
  } catch (error) {
    console.error('生成复习建议失败:', error)
    ElMessage.error('生成复习建议失败')
  } finally {
    isGenerating.value = false
  }
}

const confirmCompleteReview = () => {
  if (!taskDetail.value) return
  if (taskDetail.value.status === 'completed') {
    ElMessage.info('该复习已完成')
    return
  }
  showCompleteDialog.value = true
}

const completeReview = async () => {
  if (!taskDetail.value) return
  isCompleting.value = true
  try {
    await studyApi.completeReviewTask(taskDetail.value.id)
    ElMessage.success('复习完成，已生成下一次复习任务')
    showCompleteDialog.value = false
    await studyPlanStore.fetchAllReviewTasks()
    router.push('/ai/study/review')
  } catch (error) {
    console.error('完成复习失败:', error)
    ElMessage.error('完成复习失败')
  } finally {
    isCompleting.value = false
  }
}

const goBack = () => router.go(-1)

const handleResize = () => {
  isMobile.value = window.innerWidth <= 768
}

// 生命周期
onMounted(async () => {
  window.addEventListener('resize', handleResize)
  isLoading.value = true
  try {
    const response = await studyApi.getReviewTaskDetail(taskId)
    taskDetail.value = response || null
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
</script>

<style scoped>
.review-detail {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.main-content {
  margin-top: 70px;
  padding: 32px 24px;
  min-height: calc(100vh - 70px);
}

.detail-container {
  max-width: 1000px;
  margin: 0 auto;
}

/* 加载状态 */
.loading-state {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

/* 操作栏 */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 16px 24px;
  border-radius: 60px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.btn-back,
.btn-history,
.btn-generate {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 30px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-back {
  background: transparent;
  color: #666;
}

.btn-back:hover {
  color: #667eea;
  transform: translateX(-4px);
}

.btn-history {
  background: white;
  color: #666;
  border: 1px solid #e0e0e0;
}

.btn-history:hover:not(:disabled) {
  border-color: #667eea;
  color: #667eea;
}

.btn-generate {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-generate:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.action-buttons {
  display: flex;
  gap: 12px;
}

/* 详情头部 */
.detail-header {
  margin-bottom: 24px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin: 0 0 16px 0;
}

.badge-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.badge {
  padding: 6px 16px;
  border-radius: 30px;
  font-size: 14px;
  font-weight: 500;
  background: white;
}

.badge.stage-1 {
  background: #e6f7ff;
  color: #1890ff;
}
.badge.stage-2 {
  background: #f6ffed;
  color: #52c41a;
}
.badge.stage-3 {
  background: #fff7e6;
  color: #fa8c16;
}
.badge.stage-4 {
  background: #fff1f0;
  color: #f5222d;
}
.badge.stage-5 {
  background: #f9f0ff;
  color: #722ed1;
}

.badge.ongoing {
  background: #fff7e6;
  color: #fa8c16;
}
.badge.future {
  background: #e6f7ff;
  color: #1890ff;
}
.badge.completed {
  background: #f6ffed;
  color: #52c41a;
}

/* 信息卡片 */
.info-card {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  font-size: 14px;
  color: #999;
}

.value {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.pending {
  background: #fa8c16;
}
.status-dot.completed {
  background: #52c41a;
}

/* 内容卡片 */
.content-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.card-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.btn-complete {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #52c41a;
  color: white;
  border: none;
  border-radius: 30px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-complete:hover {
  background: #389e0d;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.3);
}

/* Markdown 内容 */
.markdown-content {
  padding: 32px;
  font-size: 15px;
  line-height: 1.8;
  color: #333;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3) {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.markdown-content :deep(p) {
  margin-bottom: 16px;
}

.markdown-content :deep(code) {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 14px;
  color: #d14;
}

.markdown-content :deep(pre) {
  background: #f6f8fa;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 16px;
}

/* 空状态 */
.empty-state {
  padding: 60px 32px;
  text-align: center;
}

.empty-icon {
  opacity: 0.5;
  margin-bottom: 16px;
}

.empty-state p {
  color: #999;
  font-size: 16px;
  margin-bottom: 20px;
}

.btn-generate-empty {
  padding: 12px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 30px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-generate-empty:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

/* 未找到状态 */
.not-found {
  text-align: center;
  padding: 80px 32px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 24px;
}

.not-found-icon {
  opacity: 0.5;
  margin-bottom: 16px;
}

.not-found p {
  color: #999;
  font-size: 16px;
  margin-bottom: 24px;
}

.btn-back-home {
  padding: 12px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 30px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

/* 历史版本弹窗 */
.history-dialog :deep(.el-dialog) {
  border-radius: 24px;
  overflow: hidden;
}

.history-dialog :deep(.el-dialog__header) {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
}

.history-dialog :deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.history-dialog :deep(.el-dialog__body) {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
}

.filter-label {
  font-size: 14px;
  font-weight: 500;
  color: #666;
}

.filter-select {
  width: 240px;
}

.stage-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.stage-tag {
  font-weight: 500;
}

.stage-count {
  font-size: 12px;
  color: #999;
}

/* 统计横幅 */
.stats-banner {
  margin-bottom: 24px;
}

/* 历史列表 */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.stage-section {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 24px;
}

.stage-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.stage-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.stage-title h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.stage-badge {
  padding: 2px 8px;
  background: #f0f0f0;
  border-radius: 12px;
  font-size: 12px;
  color: #666;
}

.version-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.version-card {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
}

.version-card:hover {
  transform: translateX(4px);
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.version-card.current {
  background: #f0f9eb;
  border-color: #52c41a;
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.version-number {
  font-weight: 600;
  color: #333;
}

.version-time {
  font-size: 12px;
  color: #999;
}

.version-preview {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.version-footer {
  display: flex;
  justify-content: flex-end;
}

.current-badge {
  padding: 2px 8px;
  background: #52c41a;
  color: white;
  border-radius: 12px;
  font-size: 12px;
}

.empty-history {
  padding: 40px 0;
}

/* 确认对话框 */
.confirm-dialog :deep(.el-dialog) {
  border-radius: 24px;
}

.confirm-content {
  text-align: center;
  padding: 24px 0;
}

.confirm-icon {
  margin-bottom: 16px;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.confirm-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.confirm-tip {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 0 24px 24px;
}

.btn-dialog-cancel,
.btn-dialog-confirm {
  padding: 10px 30px;
  border: none;
  border-radius: 30px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-dialog-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-dialog-cancel:hover {
  background: #e8e8e8;
}

.btn-dialog-confirm {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-dialog-confirm:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-dialog-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 图标 */
.icon {
  transition: all 0.3s ease;
}

/* 响应式 */
@media (max-width: 768px) {
  .main-content {
    margin-top: 60px;
    padding: 16px;
  }

  .action-bar {
    flex-direction: column;
    gap: 12px;
    border-radius: 20px;
    padding: 16px;
  }

  .action-buttons {
    width: 100%;
  }

  .btn-history,
  .btn-generate {
    flex: 1;
    justify-content: center;
  }

  .info-card {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .title {
    font-size: 22px;
  }

  .badge-group {
    flex-direction: column;
  }

  .badge {
    width: fit-content;
  }

  .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .btn-complete {
    width: 100%;
    justify-content: center;
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-select {
    width: 100%;
  }

  .version-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .dialog-footer {
    flex-direction: column;
  }

  .btn-dialog-cancel,
  .btn-dialog-confirm {
    width: 100%;
  }
}
</style>
