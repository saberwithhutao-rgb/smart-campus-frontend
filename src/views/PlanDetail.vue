<template>
  <div class="smart-qa-container">
    <GlobalNavbar />

    <!-- 主内容区 -->
    <div class="main-content">
      <div class="plan-detail-container">
        <div v-if="!currentPlan" class="loading">
          <el-skeleton :rows="5" />
        </div>

        <div v-else class="plan-content">
          <div class="header-actions">
            <el-button @click="goBack" icon="ArrowLeft">返回</el-button>
          </div>

          <h1>{{ currentPlan.title }}</h1>
          <p class="description">{{ currentPlan.description }}</p>

          <div class="plan-info">
            <div class="info-item">
              <span class="label">计划类型：</span>
              <span class="value">{{ getPlanTypeText(currentPlan.planType) }}</span>
            </div>
            <div class="info-item">
              <span class="label">学科：</span>
              <span class="value">{{ currentPlan.subject }}</span>
            </div>
            <div class="info-item">
              <span class="label">难度：</span>
              <span class="value">{{ getDifficultyText(currentPlan.difficulty) }}</span>
            </div>
            <div class="info-item">
              <span class="label">时间：</span>
              <span class="value">
                {{ formatDateRange(currentPlan.startDate, currentPlan.endDate) }}
              </span>
            </div>
          </div>

          <div class="action-section">
            <el-button
              type="primary"
              @click="generateStudyPlan"
              :loading="isGenerating"
              :disabled="isGenerating"
            >
              生成专属学习计划
            </el-button>
            <el-button @click="openHistory" :loading="isLoading"> 查看往期计划 </el-button>
          </div>

          <!-- 当前计划显示 -->
          <div v-if="generatedPlan" class="generated-plan">
            <el-card class="plan-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <h2>📚 专属学习计划</h2>
                  <div>
                    <el-tag type="info" size="small" effect="plain" class="mr-2">
                      生成时间: {{ formatDateTime(generatedPlan.createdAt) }}
                    </el-tag>
                    <el-tag type="primary" size="small" effect="plain">
                      计划ID: {{ generatedPlan.id }}
                    </el-tag>
                  </div>
                </div>
              </template>

              <div
                class="plan-content markdown-body"
                v-html="renderMarkdown(generatedPlan.plan)"
              ></div>
            </el-card>
          </div>
        </div>
      </div>
    </div>

    <!-- 历史计划弹窗 -->
    <el-dialog
      v-model="studyPlanDetailStore.showHistoryDialog"
      title="往期计划"
      width="80%"
      :fullscreen="isMobile"
      destroy-on-close
    >
      <div v-if="!studyPlanDetailStore.currentHistoryPlan" class="history-list">
        <div v-if="isLoading" class="text-center p-4">
          <el-skeleton :rows="3" />
        </div>
        <el-timeline v-else>
          <el-timeline-item
            v-for="plan in historyPlans"
            :key="plan.id"
            :timestamp="formatDateTime(plan.createdAt)"
            placement="top"
          >
            <el-card class="history-card" @click="studyPlanDetailStore.viewHistoryPlan(plan)">
              <div class="history-preview">
                <div class="history-title">计划 #{{ plan.id }}</div>
                <div class="history-meta">
                  <el-tag size="small" type="info">时长: {{ plan.duration }}</el-tag>
                  <el-tag size="small" type="success">难度: {{ plan.level }}</el-tag>
                </div>
                <div class="history-content">
                  {{ getPlainTextPreview(plan.plan) }}
                </div>
              </div>
            </el-card>
          </el-timeline-item>

          <el-timeline-item v-if="historyPlans.length === 0" placement="top">
            <el-empty description="暂无历史计划" />
          </el-timeline-item>
        </el-timeline>
      </div>

      <!-- 单个历史计划详情 -->
      <div v-else class="history-detail">
        <el-button class="back-btn" @click="studyPlanDetailStore.backToHistoryList">
          ← 返回列表
        </el-button>
        <el-card class="plan-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <h2>📚 历史计划 #{{ studyPlanDetailStore.currentHistoryPlan.id }}</h2>
              <el-tag type="info" size="small" effect="plain">
                生成时间: {{ formatDateTime(studyPlanDetailStore.currentHistoryPlan.createdAt) }}
              </el-tag>
            </div>
          </template>

          <div
            class="plan-content markdown-body"
            v-html="renderMarkdown(studyPlanDetailStore.currentHistoryPlan.plan)"
          ></div>
        </el-card>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import GlobalNavbar from '../components/GlobalNavbar.vue'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useStudyPlanStore } from '@/stores/studyPlan'
import { useStudyPlanDetailStore } from '@/stores/studyPlanDetail'
import { ElMessage } from 'element-plus'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const studyPlanStore = useStudyPlanStore()
const studyPlanDetailStore = useStudyPlanDetailStore()

// 配置 marked
marked.setOptions({
  highlight: function (code: string, lang?: string) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return hljs.highlightAuto(code).value
  },
  breaks: true,
  gfm: true,
})

const planId = Number(route.params.id)
const currentPlan = computed(() => studyPlanStore.studyPlans.find((p) => p.id === planId))
const isLoggedIn = computed(() => userStore.userState.isLoggedIn)
const isMobile = ref(window.innerWidth <= 768)

// 难度映射：英文转中文
const difficultyMap: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}
// 获取中文难度文本
const getDifficultyText = (difficulty: string) => {
  if (!difficulty) return '未知'
  return difficultyMap[difficulty.toLowerCase()] || difficulty
}

const generatedPlan = computed(() => studyPlanDetailStore.getCurrentPlanDetail(planId))
const isGenerating = computed(() => studyPlanDetailStore.isGenerating)
const isLoading = computed(() => studyPlanDetailStore.isLoading)
const historyPlans = computed(() => studyPlanDetailStore.getHistoryPlans(planId))

// 渲染 Markdown
const renderMarkdown = (content: string) => {
  if (!content) return ''
  return marked(content)
}

// 获取纯文本预览（去掉 Markdown 标记）
const getPlainTextPreview = (content: string, maxLength: number = 100) => {
  if (!content) return ''
  // 简单去掉 Markdown 标记
  const plain = content
    .replace(/#{1,6}\s?/g, '') // 去掉标题标记
    .replace(/\*\*/g, '') // 去掉加粗
    .replace(/\*/g, '') // 去掉斜体
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // 替换链接为文字
    .replace(/`{1,3}[^`]+`{1,3}/g, '') // 去掉代码块
    .replace(/\n/g, ' ') // 换行变空格
    .trim()
  return plain.length > maxLength ? plain.substring(0, maxLength) + '...' : plain
}

// 格式化日期时间
const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '未知时间'

  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      return '未知时间'
    }
    return `${date.toLocaleDateString('zh-CN')} ${date.toLocaleTimeString('zh-CN')}`
  } catch {
    return '未知时间'
  }
}

onMounted(async () => {
  if (!currentPlan.value) {
    router.push('/ai/study')
    return
  }

  // 页面加载时获取最新生成的计划
  await Promise.all([
    studyPlanDetailStore.fetchLatestPlan(planId), // 获取当前显示的
    studyPlanDetailStore.fetchHistoryPlans(planId), // 获取历史列表（让按钮显示）
  ])

  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth <= 768
  })
})

const generateStudyPlan = async () => {
  if (!isLoggedIn.value) {
    ElMessage.error('请先登录')
    return router.push('/login')
  }
  if (!currentPlan.value) return

  const getDuration = () => {
    if (currentPlan.value && currentPlan.value.endDate) {
      const start = new Date(currentPlan.value.startDate)
      const end = new Date(currentPlan.value.endDate)
      const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      return diffDays + '天'
    } else {
      return '无限期'
    }
  }

  const result = await studyPlanDetailStore.generatePlanDetail({
    studyPlanId: currentPlan.value.id,
    subject: currentPlan.value.subject || '',
    duration: getDuration(),
    level: currentPlan.value.difficulty,
  })

  if (result) {
    ElMessage.success('学习计划已生成!')
    // 重新获取历史列表（包含新生成的计划）
    await studyPlanDetailStore.fetchLatestPlan(planId)
  }
}

// 打开历史弹窗
const openHistory = () => {
  studyPlanDetailStore.openHistoryDialog(planId)
}

// 工具函数
const getPlanTypeText = (type: string) =>
  ({ review: '复习计划', learning: '学习计划', project: '项目计划' })[type] || type
const formatDate = (date: string | undefined | null) => {
  if (!date) return '无限期'

  try {
    const d = new Date(date)
    // 检查日期是否有效
    if (isNaN(d.getTime())) {
      return '无限期'
    }
    return d.toLocaleDateString('zh-CN')
  } catch {
    return '无限期'
  }
}

const formatDateRange = (
  startDate: string | undefined | null,
  endDate: string | undefined | null,
) => {
  const start = formatDate(startDate)
  const end = formatDate(endDate)

  if (start === '无限期' && end === '无限期') {
    return '无限期'
  }

  if (end === '无限期') {
    return `${start} 至 无限期`
  }

  return `${start} 至 ${end}`
}
const goBack = () => router.go(-1)
</script>

<style scoped>
/* 全局容器样式 */
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
  transition: all 0.3s ease;
}

.plan-detail-container:hover {
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
}

.loading {
  text-align: center;
  padding: 50px;
}

/* 头部操作按钮 */
.header-actions {
  margin-bottom: 25px;
  position: relative;
  z-index: 10;
}

.header-actions .el-button {
  font-size: 14px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.header-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 标题和描述 */
h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #2c3e50;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

.description {
  font-size: 17px;
  color: #7f8c8d;
  line-height: 1.7;
  margin-bottom: 25px;
}

/* 计划信息展示 */
.plan-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
}

.info-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.info-item:hover {
  background: #e9ecef;
  transform: translateY(-3px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.label {
  font-weight: 600;
  margin-right: 10px;
  color: #34495e;
}

.value {
  color: #7f8c8d;
  font-weight: 500;
}

/* 操作区域 */
.action-section {
  display: flex;
  gap: 20px;
  margin-bottom: 35px;
}

.action-section .el-button {
  font-size: 15px;
  padding: 12px 24px;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.action-section .el-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
}

/* 生成的学习计划卡片 */
.generated-plan {
  margin-top: 25px;
}

.plan-card {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.plan-card:hover {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.card-header h2 {
  font-size: 22px;
  margin: 0;
  font-weight: 600;
}

.plan-content.markdown-body {
  padding: 25px;
  line-height: 1.9;
  color: #333;
  background: #ffffff;
}

/* 历史计划弹窗 */
.el-dialog {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
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
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
}

.history-card:hover {
  transform: translateX(8px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.history-preview {
  padding: 15px;
}

.history-title {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #2c3e50;
}

.history-meta {
  margin-bottom: 10px;
  display: flex;
  gap: 10px;
}

.history-content {
  font-size: 15px;
  color: #7f8c8d;
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.history-detail {
  position: relative;
}

.back-btn {
  margin-bottom: 25px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.back-btn:hover {
  transform: translateX(-5px);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .main-content {
    padding: 15px;
    margin-top: 70px;
  }

  .plan-detail-container {
    padding: 20px;
  }

  h1 {
    font-size: 24px;
  }

  .description {
    font-size: 15px;
  }

  .plan-info {
    grid-template-columns: 1fr;
  }

  .action-section {
    flex-direction: column;
  }

  .history-list {
    max-height: none;
  }

  .history-card {
    margin-bottom: 20px;
  }

  .history-title {
    font-size: 15px;
  }

  .history-content {
    font-size: 13px;
  }

  .card-header h2 {
    font-size: 20px;
  }
}

/* 工具类 */
.mr-2 {
  margin-right: 10px;
}

.text-center {
  text-align: center;
}

.p-4 {
  padding: 25px;
}
</style>
