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
              <el-tag :type="getStageTagType(taskDetail.reviewStage)" size="large">
                第 {{ taskDetail.reviewStage }} 次复习
              </el-tag>
              <el-tag
                :type="taskDetail.status === 'completed' ? 'success' : 'primary'"
                size="large"
              >
                {{ taskDetail.status === 'completed' ? '已完成' : '进行中' }}
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
    >
      <!-- 下拉选择框 -->
      <div class="search-bar">
        <el-select
          v-model="selectedStage"
          placeholder="请选择复习阶段"
          clearable
          @clear="clearSearch"
          style="width: 100%"
        >
          <el-option
            v-for="stage in availableStages"
            :key="stage"
            :label="`第 ${stage} 次复习`"
            :value="stage"
          />
        </el-select>
        <div class="stage-tips" v-if="availableStages.length">
          共有 {{ availableStages.length }} 个复习阶段
        </div>
      </div>

      <!-- 按阶段分组显示 -->
      <div class="suggestions-container" v-if="planSuggestions.length">
        <div v-for="stage in filteredStages" :key="stage" class="stage-group">
          <h3>第 {{ stage }} 次复习</h3>
          <el-timeline>
            <el-timeline-item
              v-for="suggestion in getStageSuggestions(stage)"
              :key="suggestion.id"
              :timestamp="formatDateTime(suggestion.createdAt)"
              :type="suggestion.isCurrent ? 'primary' : 'info'"
            >
              <el-card
                class="suggestion-card"
                :class="{ 'current-version': suggestion.isCurrent }"
                @click="viewSuggestion(suggestion)"
              >
                <div class="version-badge">
                  版本 {{ suggestion.version }}
                  <el-tag v-if="suggestion.isCurrent" size="small" type="success">当前</el-tag>
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
.search-bar {
  margin-bottom: 20px;
}

.stage-tips {
  margin-top: 8px;
  font-size: 13px;
  color: var(--text-color-light);
}

.stage-group {
  margin-top: 24px;
}

.stage-group:first-child {
  margin-top: 0;
}

.stage-group h3 {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  padding-left: 8px;
  border-left: 3px solid var(--primary-color);
}

.suggestion-card {
  cursor: pointer;
  transition: all 0.3s;
}

.suggestion-card:hover {
  transform: translateX(4px);
  border-color: var(--primary-color);
}

.suggestion-card.current-version {
  background-color: #e8f0fe;
  border-color: #a0c0f0;
}

.version-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: 500;
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

:deep(.suggestion-detail-dialog) {
  width: 80%;
  max-width: 800px;
}

:deep(.suggestion-detail-dialog .el-message-box__message) {
  max-height: 60vh;
  overflow-y: auto;
  padding: 0 10px;
}

:deep(.suggestion-detail-dialog .markdown-body) {
  font-size: 14px;
  line-height: 1.8;
}

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

.smart-qa-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  color: #333;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.main-content {
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
  margin-top: 80px;
}

.plan-detail-container {
  background: #ffffff;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.header-actions {
  margin-bottom: 25px;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.plan-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
}

.plan-badges {
  display: flex;
  gap: 12px;
}

.plan-info {
  display: flex;
  gap: 30px;
  margin-bottom: 25px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
}

.info-item {
  display: flex;
  align-items: center;
}

.label {
  font-weight: 600;
  color: #34495e;
  margin-right: 8px;
}

.value {
  color: #7f8c8d;
}

.action-section {
  display: flex;
  gap: 20px;
  margin-bottom: 35px;
}

.plan-card {
  border-radius: 12px;
  overflow: hidden;
}

.card-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.card-header h2 {
  font-size: 20px;
  margin: 0;
}

.plan-content.markdown-body {
  padding: 25px;
  line-height: 1.9;
}

.history-list {
  max-height: 65vh;
  overflow-y: auto;
  padding: 15px;
}

.history-card {
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 15px;
}

.history-card:hover {
  transform: translateX(8px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.history-preview {
  padding: 15px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.history-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.history-content {
  font-size: 14px;
  color: #7f8c8d;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.history-detail {
  position: relative;
}

.back-btn {
  margin-bottom: 25px;
}

.empty-content {
  padding: 40px;
  text-align: center;
}

@media (max-width: 768px) {
  .main-content {
    padding: 15px;
    margin-top: 70px;
  }

  .plan-detail-container {
    padding: 20px;
  }

  .plan-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .plan-header h1 {
    font-size: 24px;
  }

  .plan-info {
    flex-direction: column;
    gap: 12px;
  }

  .action-section {
    flex-direction: column;
  }
}

.main-content {
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
  margin-top: 80px;
}

.plan-detail-container {
  background: #ffffff;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.header-actions {
  margin-bottom: 25px;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.plan-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
}

.plan-badges {
  display: flex;
  gap: 12px;
}

.plan-info {
  display: flex;
  gap: 30px;
  margin-bottom: 25px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
}

.info-item {
  display: flex;
  align-items: center;
}

.label {
  font-weight: 600;
  color: #34495e;
  margin-right: 8px;
}

.value {
  color: #7f8c8d;
}

.action-section {
  display: flex;
  gap: 20px;
  margin-bottom: 35px;
}

.plan-card {
  border-radius: 12px;
  overflow: hidden;
}

.card-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.card-header h2 {
  font-size: 20px;
  margin: 0;
}

.plan-content.markdown-body {
  padding: 25px;
  line-height: 1.9;
}

/* 历史弹窗样式 */
.history-list {
  max-height: 65vh;
  overflow-y: auto;
  padding: 15px;
}

.history-card {
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 15px;
}

.history-card:hover {
  transform: translateX(8px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.history-preview {
  padding: 15px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.history-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.history-content {
  font-size: 14px;
  color: #7f8c8d;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.history-detail {
  position: relative;
}

.back-btn {
  margin-bottom: 25px;
}

.empty-content {
  padding: 40px;
  text-align: center;
}

@media (max-width: 768px) {
  .main-content {
    padding: 15px;
    margin-top: 70px;
  }

  .plan-detail-container {
    padding: 20px;
  }

  .plan-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .plan-header h1 {
    font-size: 24px;
  }

  .plan-info {
    flex-direction: column;
    gap: 12px;
  }

  .action-section {
    flex-direction: column;
  }
}
</style>
