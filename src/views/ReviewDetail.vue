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
              @click="continueReview"
              :disabled="taskDetail.status === 'completed'"
            >
              {{ taskDetail.status === 'completed' ? '已完成复习' : '继续复习' }}
            </el-button>
            <el-button @click="openHistory" :loading="isLoadingHistory">
              查看历史复习计划
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
      title="历史复习计划"
      width="80%"
      :fullscreen="isMobile"
      destroy-on-close
    >
      <div v-if="!currentHistoryPlan" class="history-list">
        <div v-if="isLoadingHistory" class="text-center p-4">
          <el-skeleton :rows="3" />
        </div>
        <el-timeline v-else>
          <el-timeline-item
            v-for="plan in historyPlans"
            :key="plan.id"
            :timestamp="formatDateTime(plan.createdAt)"
            placement="top"
          >
            <el-card class="history-card" @click="viewHistoryPlan(plan)">
              <div class="history-preview">
                <div class="history-header">
                  <span class="history-title">{{ plan.title }}</span>
                  <el-tag size="small" :type="getStageTagType(plan.reviewStage)">
                    第 {{ plan.reviewStage }} 次复习
                  </el-tag>
                </div>
                <div class="history-content">
                  {{ getPlainTextPreview(plan.description || '') }}
                </div>
              </div>
            </el-card>
          </el-timeline-item>

          <el-timeline-item v-if="historyPlans.length === 0" placement="top">
            <el-empty description="暂无历史复习计划" />
          </el-timeline-item>
        </el-timeline>
      </div>

      <!-- 单个历史计划详情 -->
      <div v-else class="history-detail">
        <el-button class="back-btn" @click="backToHistoryList"> ← 返回列表 </el-button>
        <el-card class="plan-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <h2>📚 {{ currentHistoryPlan.title }}</h2>
              <el-tag :type="getStageTagType(currentHistoryPlan.reviewStage)" size="small">
                第 {{ currentHistoryPlan.reviewStage }} 次复习
              </el-tag>
            </div>
          </template>

          <div
            class="plan-content markdown-body"
            v-html="renderMarkdown(currentHistoryPlan.description || '')"
          ></div>
        </el-card>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import GlobalNavbar from '../components/GlobalNavbar.vue'
import { onMounted, ref, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { StudyTask } from '@/stores/studyPlan'
import * as studyApi from '@/api/study'
import { ElMessage } from 'element-plus'
import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

const route = useRoute()
const router = useRouter()

const taskId = Number(route.params.id)
const taskDetail = ref<StudyTask | null>(null)
const isLoading = ref(false)
const isGenerating = ref(false)
const isLoadingHistory = ref(false)
const historyPlans = ref<StudyTask[]>([])
const showHistoryDialog = ref(false)
const currentHistoryPlan = ref<StudyTask | null>(null)
const isMobile = ref(window.innerWidth <= 768)

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
const handleResize = () => {
  isMobile.value = window.innerWidth <= 768
}
// 获取复习阶段描述
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
    const task = await studyApi.getReviewTaskDetail(taskId)
    taskDetail.value = task
  } catch (error) {
    console.error('获取任务详情失败:', error)
    ElMessage.error('获取任务详情失败')
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
// AI生成复习建议
const generateReviewAdvice = async () => {
  if (!taskDetail.value) return
  if (taskDetail.value.reviewStage === 0) {
    ElMessage.warning('请先生成复习计划')
    return
  }

  isGenerating.value = true
  try {
    console.log('发送请求参数:', {
      taskId: taskDetail.value.id,
      title: taskDetail.value.title,
      reviewStage: taskDetail.value.reviewStage,
    })

    const advice = await studyApi.generateReviewAdvice({
      taskId: taskDetail.value.id,
      title: taskDetail.value.title,
      reviewStage: taskDetail.value.reviewStage,
    })
    await studyApi.updateReviewTaskContent(taskDetail.value.id, advice)

    // 刷新详情
    const res = await studyApi.getReviewTaskDetail(taskId)
    taskDetail.value = res

    ElMessage.success('复习建议生成成功')
  } catch (error) {
    console.error('生成复习建议失败:', error)
    ElMessage.error('生成复习建议失败')
  } finally {
    isGenerating.value = false
  }
}

// 查看历史
const openHistory = async () => {
  if (!taskDetail.value) return

  showHistoryDialog.value = true
  isLoadingHistory.value = true
  try {
    const tasks = await studyApi.getReviewTaskHistory(taskDetail.value.planId)
    historyPlans.value = tasks
  } catch {
    ElMessage.error('获取历史记录失败')
  } finally {
    isLoadingHistory.value = false
  }
}

// 查看单个历史计划
const viewHistoryPlan = (plan: StudyTask) => {
  currentHistoryPlan.value = plan
}

// 返回列表
const backToHistoryList = () => {
  currentHistoryPlan.value = null
}

// 继续复习
const continueReview = () => {
  ElMessage.info('复习功能开发中...')
}

const goBack = () => router.go(-1)
</script>

<style scoped>
/* 样式保持不变，添加空内容样式 */
</style>

<style scoped>
/* 复用 PlanDetail.vue 的样式，可适当调整 */
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
