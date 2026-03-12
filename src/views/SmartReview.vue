<template>
  <div class="smart-qa-container">
    <GlobalNavbar />

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 移动端侧边栏切换按钮 -->
      <button class="sidebar-toggle" @click="toggleSidebar" v-if="isMobile">
        {{ showSidebar ? '关闭' : '打开' }}侧边栏
      </button>

      <!-- 左侧功能栏 -->
      <aside class="sidebar" :class="{ 'sidebar-collapsed': !showSidebar && isMobile }">
        <div class="sidebar-header">
          <h2 class="sidebar-title">学习规划</h2>
        </div>

        <div class="sidebar-menu">
          <div class="sidebar-item" @click="goToStudyPlan">学习计划</div>
          <div class="sidebar-item sidebar-item-active" @click="goToSmartReview">智能复习</div>
        </div>
      </aside>

      <!-- 中间智能复习区域 -->
      <main class="study-main">
        <!-- 上部：待复习任务 -->
        <div class="review-section pending-section">
          <div class="section-header">
            <h3 class="section-title">📋 待复习任务</h3>
            <div class="section-stats">待复习: {{ pendingTasks.length }}</div>
          </div>

          <div class="task-list">
            <div
              v-for="task in pendingTasks"
              :key="task.id"
              class="task-card"
              @click="goToReviewDetail(task.planId)"
            >
              <div class="task-card-left">
                <div class="task-icon">⏰</div>
                <div class="task-info">
                  <div class="task-title">{{ task.title }}</div>
                  <div class="task-meta">
                    <span class="task-subject">{{ getTaskSubject(task) || '未分类' }}</span>
                    <span class="task-stage">
                      <el-tag :type="getStageTagType(task.reviewStage)" size="small">
                        第 {{ task.reviewStage }} 次复习
                      </el-tag>
                    </span>
                  </div>
                </div>
              </div>

              <div class="task-card-right">
                <div class="task-date">{{ formatDate(task.taskDate) }}</div>
                <div class="task-status">
                  <el-tag size="small" type="warning">待复习</el-tag>
                </div>
                <el-icon class="arrow-icon"><ArrowRight /></el-icon>
              </div>
            </div>
          </div>
        </div>

        <!-- 下部：复习计划（已完成的任务） -->
        <div class="review-section generated-section">
          <div class="section-header">
            <h3 class="section-title">📚 我的复习计划</h3>
            <div class="section-stats">
              总数: {{ studyPlanStore.completedPlansWithReviewStatus.length }}
            </div>
          </div>

          <div class="plan-list">
            <div
              v-for="plan in studyPlanStore.completedPlansWithReviewStatus"
              :key="plan.id"
              class="plan-card"
              @click="goToReviewDetail(plan.id)"
            >
              <div class="plan-card-left">
                <div class="plan-icon">📖</div>
                <div class="plan-info">
                  <div class="plan-title">{{ plan.title }}</div>
                  <div class="plan-meta">
                    <span class="plan-subject">{{ plan.subject || '未分类' }}</span>
                    <span class="plan-review-status">
                      <el-tag :type="getReviewStatusTagType(plan.reviewStatus.type)" size="small">
                        {{ plan.reviewStatus.displayText }}
                      </el-tag>
                    </span>
                  </div>
                </div>
              </div>

              <div class="plan-card-right">
                <div class="plan-time">{{ formatDate(plan.endDate || plan.startDate) }}</div>
                <div class="plan-status">
                  <el-tag size="small" type="success">已完成</el-tag>
                </div>
                <el-icon class="arrow-icon"><ArrowRight /></el-icon>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import GlobalNavbar from '../components/GlobalNavbar.vue'
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStudyPlanStore } from '../stores/studyPlan'
import type { StudyTask } from '@/stores/studyPlan'
import { ArrowRight } from '@element-plus/icons-vue'
import { nextTick } from 'vue'

const router = useRouter()
const studyPlanStore = useStudyPlanStore()
const pendingTasks = computed(() => studyPlanStore.pendingTasks)
const goToReviewDetail = (planId: number) => {
  router.push(`/ai/study/review/detail/${planId}`)
}
const isMobile = ref(false)
const showSidebar = ref(true)
const selectedTaskIds = ref<number[]>([])

const getReviewStatusTagType = (type: string) => {
  const map: Record<string, string> = {
    ongoing: 'warning', // 进行中 - 黄色
    future: 'info', // 未来 - 蓝色
    completed: 'success', // 全部完成 - 绿色
    'no-tasks': 'info', // 无任务 - 灰色
    unknown: 'danger', // 未知 - 红色
  }
  return map[type] || 'info'
}

const getTaskSubject = (task: StudyTask) => {
  const plan = studyPlanStore.studyPlans.find((p) => p.id === task.planId)
  return plan?.subject || '未分类'
}

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

const formatDate = (date: string) => {
  return new Date(date)
    .toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    .replace(/\//g, '-')
}

const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 1024
}
const goToStudyPlan = () => router.push('/ai/study')
const goToSmartReview = () => {} // 已在当前页面

// 切换侧边栏
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}

// 监听任务变化，自动清除已不在列表中的选中项
watch(
  () => studyPlanStore.reviewItems,
  (newItems) => {
    const validIds = newItems.map((item) => item.id)
    selectedTaskIds.value = selectedTaskIds.value.filter((id) => validIds.includes(id))
  },
  { deep: true },
)

onMounted(() => {
  showSidebar.value = true
  nextTick(() => {
    checkScreenSize()
    setTimeout(() => {
      checkScreenSize()
    }, 50)
  })

  window.addEventListener('resize', checkScreenSize)
  studyPlanStore.fetchPendingTasks()
  studyPlanStore.fetchAllReviewTasks()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
})
</script>

<style scoped>
/* 复用原有全局变量 */
:root {
  --primary-color: #165dff;
  --primary-color-dark: #0e46cc;
  --primary-color-light: #4c8aff;
  --accent-color: #f53f3f;
  --accent-color-dark: #e13d3d;
  --bg-color: #f5f7fa;
  --bg-color-light: #fafafb;
  --bg-color-dark: #eef1f5;
  --text-color: #1d2129;
  --text-color-secondary: #4e5969;
  --text-color-light: #86909c;
  --border-color: #e5e7eb;
  --border-color-light: #f0f2f5;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  --border-radius-xl: 16px;
  --transition: all 0.3s ease;
}

.smart-qa-container {
  min-height: 100vh;
  background-color: var(--bg-color);
  font-family: 'Microsoft YaHei', sans-serif;
  display: flex;
  flex-direction: column;
}

.main-content {
  display: flex;
  flex: 1;
  margin-top: 70px;
  min-height: calc(100vh - 70px);
  position: relative;
  width: 100%;
}

.sidebar-toggle {
  position: fixed;
  top: 80px;
  left: 10px;
  z-index: 98;
  padding: 8px 16px;
  background-color: var(--primary-color);
  color: #fff;
  border: none;
  border-radius: var(--border-radius-md);
  font-size: 14px;
  cursor: pointer;
  display: none;
}

.sidebar {
  width: 280px;
  background-color: #fff;
  border-right: 1px solid var(--border-color);
  padding: 20px 0;
  transition: var(--transition);
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
  position: relative;
  z-index: 2;
}

.sidebar-header {
  padding: 0 20px 20px;
  border-bottom: 1px solid var(--border-color-light);
}

.sidebar-title {
  font-size: 20px;
  font-weight: bold;
  color: var(--text-color);
  margin: 0;
}

.sidebar-menu {
  margin-top: 20px;
}

.sidebar-item {
  padding: 16px 20px;
  font-size: 16px;
  color: var(--text-color);
  cursor: pointer;
  transition: var(--transition);
  border-left: 3px solid transparent;
}

.sidebar-item:hover {
  background-color: var(--bg-color-light);
  color: var(--primary-color);
}

.sidebar-item-active {
  background-color: var(--bg-color-light);
  color: var(--primary-color) !important;
  border-left-color: var(--primary-color);
  font-weight: 500;
}

.study-main {
  flex: 1;
  background-color: var(--bg-color);
  padding: 20px;
  overflow-y: auto;
  position: relative;
  z-index: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 模块通用样式 */
.review-section {
  background-color: #fff;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 24px;
  border: 1px solid var(--border-color-light);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.section-stats {
  font-size: 14px;
  color: var(--text-color-light);
}

.section-footer {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color-light);
}

/* 任务卡片列表 */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #fff;
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
  transition: var(--transition);
}

.task-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--primary-color-light);
}

.task-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.task-info {
  flex: 1;
}

.task-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 4px;
}

.task-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--text-color-light);
}

.task-subject {
  color: var(--primary-color);
}

.task-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.task-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.review-stage {
  font-size: 13px;
  color: var(--text-color-secondary);
}

/* 计划卡片列表 */
.plan-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plan-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #fff;
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: var(--transition);
}

.plan-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--primary-color);
  transform: translateY(-2px);
}

.plan-card-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.plan-icon {
  font-size: 24px;
}

.plan-info {
  flex: 1;
}

.plan-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 4px;
}

.plan-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.plan-subject {
  font-size: 13px;
  color: var(--text-color-secondary);
}

.plan-card-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.plan-time {
  font-size: 13px;
  color: var(--text-color-light);
}

.arrow-icon {
  color: var(--text-color-light);
  font-size: 16px;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: var(--text-color-light);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--text-color-secondary);
}

.empty-tip {
  font-size: 14px;
  color: var(--text-color-light);
}

/* 艾宾浩斯弹窗样式（保持不变） */
.ebbinghaus-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.curve-image-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.curve-image {
  width: 100%;
  height: auto;
  display: block;
}

.curve-description {
  padding: 0 16px;
}

.curve-description h4 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 12px 0;
}

.curve-description p {
  font-size: 14px;
  color: var(--text-color-secondary);
  margin: 8px 0;
}

.curve-description ul {
  list-style: none;
  padding: 0;
  margin: 16px 0;
}

.curve-description li {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--text-color);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary-color);
  display: inline-block;
}

.note {
  color: var(--text-color-light);
  font-style: italic;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color-light);
}

.task-card-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.task-icon {
  font-size: 24px;
}

.task-info {
  flex: 1;
}

.task-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 4px;
}

.task-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.task-subject {
  font-size: 13px;
  color: var(--text-color-secondary);
}

.task-card-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.task-date {
  font-size: 13px;
  color: var(--text-color-light);
}

.task-status {
  min-width: 60px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .sidebar-toggle {
    display: block;
  }

  .sidebar {
    position: fixed;
    left: 0;
    top: 70px;
    height: calc(100vh - 70px);
    z-index: 98;
    transform: translateX(0);
    width: 280px;
  }

  .sidebar-collapsed {
    transform: translateX(-100%);
  }

  .study-main {
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .main-content {
    margin-top: 60px;
  }

  .task-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .task-right {
    width: 100%;
    justify-content: space-between;
  }

  .plan-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .plan-card-right {
    width: 100%;
    justify-content: space-between;
  }

  .section-footer .el-button {
    width: 100%;
  }
  .plan-card {
    cursor: pointer;
    transition: var(--transition);
  }

  .plan-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: var(--primary-color);
  }

  .arrow-icon {
    transition: transform 0.2s ease;
  }

  .plan-card:hover .arrow-icon {
    transform: translateX(4px);
    color: var(--primary-color);
  }
}
</style>
