<script setup lang="ts">
import GlobalNavbar from '../components/GlobalNavbar.vue'
import { computed, onMounted } from 'vue'
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
  highlight: function (code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return hljs.highlightAuto(code).value
  },
  breaks: true, // 支持换行
  gfm: true, // 支持 GitHub 风格的 Markdown
})

const planId = Number(route.params.id)
const currentPlan = computed(() => studyPlanStore.studyPlans.find((p) => p.id === planId))
const isLoggedIn = computed(() => userStore.userState.isLoggedIn)

const generatedPlan = computed(() => studyPlanDetailStore.getPlanDetailByStudyPlanId(planId))
const isGenerating = computed(() => studyPlanDetailStore.isGenerating)

// 渲染 Markdown
const renderMarkdown = (content: string) => {
  if (!content) return ''
  return marked(content)
}

onMounted(() => {
  if (!currentPlan.value) {
    router.push('/ai/study')
  }
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
  }
}

// 工具函数
const getPlanTypeText = (type: string) =>
  ({ review: '复习计划', learning: '学习计划', project: '项目计划' })[type] || type
const formatDate = (date: string) => new Date(date).toLocaleDateString('zh-CN')
const getSubjectIcon = (subject: string) =>
  ({ Python: 'python', JavaScript: 'js', Java: 'java', 'C++': 'cpp' })[subject] || 'default'
const goBack = () => router.go(-1)
</script>

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
              <span class="value">{{ currentPlan.difficulty }}</span>
            </div>
            <div class="info-item">
              <span class="label">时间：</span>
              <span class="value">
                {{ formatDate(currentPlan.startDate || '') }} 至
                {{ formatDate(currentPlan.endDate || '') }}
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
          </div>

          <!-- 美化后的计划显示 -->
          <div v-if="generatedPlan" class="generated-plan">
            <el-card class="plan-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <h2>📚 专属学习计划</h2>
                  <el-tag type="info" size="small" effect="plain"
                    >计划ID: {{ generatedPlan.id }}</el-tag
                  >
                </div>
              </template>

              <!-- 使用 v-html 渲染 Markdown -->
              <div
                class="plan-content markdown-body"
                v-html="renderMarkdown(generatedPlan.plan)"
              ></div>
            </el-card>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 全局变量定义（支持浅色/深色主题） */
:root {
  --bg-color: #ffffff;
  --text-color: #303133;
  --border-color: #dcdfe6;
  --secondary-text-color: #909399;
  --shadow-color: rgba(0, 0, 0, 0.1);
  --card-bg-color: #ffffff;
  --code-bg-color: #f8f9fa;
  --blockquote-bg-color: #f8f9fa;
  --blockquote-border-color: #409eff;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-color: #1a1a1a;
    --text-color: #e4e7ed;
    --border-color: #4c4d4f;
    --secondary-text-color: #a3a6ad;
    --shadow-color: rgba(0, 0, 0, 0.3);
    --card-bg-color: #2c2c2c;
    --code-bg-color: #2c2c2c;
    --blockquote-bg-color: #2c2c2c;
    --blockquote-border-color: #409eff;
  }
}

/* 主内容区 */
.main-content {
  padding-top: 80px;
  min-height: calc(100vh - 80px);
  position: relative;
  z-index: 1;
  background-color: var(--bg-color);
  color: var(--text-color);
}

.plan-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* 加载状态 */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
}

.loading-text {
  margin-top: 10px;
  color: var(--secondary-text-color);
  font-size: 14px;
}

/* 计划详情区域 */
.plan-content h1 {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
  color: var(--text-color);
}

.description {
  font-size: 16px;
  color: var(--secondary-text-color);
  margin-bottom: 20px;
}

/* 计划信息网格布局 */
.plan-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin: 20px 0;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-item .label {
  font-size: 14px;
  color: var(--secondary-text-color);
}

.info-item .value {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color);
}

/* 操作按钮区域 */
.action-section {
  text-align: center;
  margin: 30px 0;
}

.action-section .el-button {
  transition: all 0.3s ease;
  will-change: transform, box-shadow;
}

.action-section .el-button:hover {
  transform: translateY(-2px) translateZ(0);
  box-shadow: 0 4px 12px var(--shadow-color);
}

.action-section .el-button:focus {
  outline: 2px solid #409eff;
  outline-offset: 2px;
}

/* 生成的学习计划展示区域 */
.generated-plan {
  margin-top: 30px;
}

.plan-card {
  background-color: var(--card-bg-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 20px;
  color: var(--text-color);
}

/* Markdown 样式 - 使用 markdown-body 类名避免冲突 */
.markdown-body {
  font-size: 16px;
  line-height: 1.8;
  color: var(--text-color);
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4 {
  font-weight: 600;
  margin: 16px 0;
}

.markdown-body h1 {
  font-size: 28px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.markdown-body h2 {
  font-size: 24px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border-color);
}

.markdown-body h3 {
  font-size: 20px;
}

.markdown-body h4 {
  font-size: 18px;
}

.markdown-body p {
  margin: 12px 0;
}

.markdown-body ul,
.markdown-body ol {
  padding-left: 24px;
  margin: 12px 0;
}

.markdown-body li {
  margin: 6px 0;
}

.markdown-body li > p {
  margin: 0;
}

.markdown-body strong {
  font-weight: 600;
  color: #409eff;
}

.markdown-body em {
  font-style: italic;
  color: #67c23a;
}

.markdown-body blockquote {
  margin: 16px 0;
  padding: 12px 20px;
  background-color: var(--blockquote-bg-color);
  border-left: 4px solid var(--blockquote-border-color);
  border-radius: 0 4px 4px 0;
}

.markdown-body code {
  padding: 2px 6px;
  background-color: var(--code-bg-color);
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #e06c75;
  border: 1px solid var(--border-color);
}

.markdown-body pre {
  padding: 16px;
  background-color: var(--code-bg-color);
  border-radius: 8px;
  overflow-x: auto;
  margin: 16px 0;
  border: 1px solid var(--border-color);
}

.markdown-body pre code {
  padding: 0;
  background-color: transparent;
  border: none;
  color: inherit;
}

.markdown-body table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  display: block;
  overflow-x: auto;
  white-space: nowrap;
}

.markdown-body th {
  background-color: #f5f7fa;
  padding: 10px 16px;
  border: 1px solid var(--border-color);
  font-weight: 600;
}

.markdown-body td {
  padding: 10px 16px;
  border: 1px solid var(--border-color);
}

.markdown-body hr {
  margin: 24px 0;
  border: none;
  border-top: 2px solid var(--border-color);
}

.markdown-body img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  cursor: zoom-in;
}

.markdown-body a {
  color: #409eff;
  text-decoration: none;
}

.markdown-body a:hover {
  text-decoration: underline;
}

/* 焦点状态样式 */
.markdown-body a:focus,
.markdown-body button:focus,
.markdown-body input:focus {
  outline: 2px solid #409eff;
  outline-offset: 2px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .plan-info {
    gap: 10px;
    padding: 15px;
  }

  .info-item .value {
    font-size: 14px;
  }

  .markdown-body h1 {
    font-size: 24px;
  }

  .markdown-body h2 {
    font-size: 20px;
  }

  .markdown-body h3 {
    font-size: 18px;
  }

  .markdown-body p {
    font-size: 14px;
  }

  .generated-plan {
    padding: 0;
  }
}

/* 小屏手机适配 */
@media (max-width: 480px) {
  .plan-info {
    gap: 8px;
    padding: 10px;
  }

  .markdown-body h1 {
    font-size: 22px;
  }

  .markdown-body h2 {
    font-size: 18px;
  }

  .markdown-body h3 {
    font-size: 16px;
  }

  .markdown-body p {
    font-size: 13px;
  }
}

/* 平板适配 */
@media (min-width: 769px) and (max-width: 1024px) {
  .plan-info {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  :root {
    --text-color: #000000;
    --bg-color: #ffffff;
    --border-color: #000000;
  }
}
</style>
