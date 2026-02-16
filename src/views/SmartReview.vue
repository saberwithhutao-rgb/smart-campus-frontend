<script setup lang="ts">
import GlobalNavbar from '../components/GlobalNavbar.vue'
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useStudyPlanStore } from '../stores/studyPlan'
import { ElMessage, ElMessageBox } from 'element-plus'

// 路由实例
const router = useRouter()
const userStore = useUserStore()
const studyPlanStore = useStudyPlanStore()

// 响应式数据
const showUserCenter = ref(false)
const activeMenu = ref('')
const showSubMenu = ref('')
const isMobile = ref(false)
const showSidebar = ref(true)

// 复习任务列表
const reviewItems = computed(() => studyPlanStore.reviewItems)

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return '待定'
  return new Date(date).toLocaleDateString('zh-CN')
}

// 获取难度显示
const getDifficultyText = (stage: number) => {
  // 根据复习阶段返回难度标识
  const difficulties = ['易', '中', '难']
  return difficulties[Math.min(stage - 1, 2)] || '中'
}

// 获取难度类名
const getDifficultyClass = (stage: number) => {
  const text = getDifficultyText(stage)
  return {
    'difficulty-hard': text === '难',
    'difficulty-medium': text === '中',
    'difficulty-easy': text === '易',
  }
}

// 完成任务
const completeTask = async (id: number) => {
  try {
    await studyPlanStore.completeTask(id)
    ElMessage.success('任务已完成')
  } catch (error) {
    console.error('完成任务失败:', error)
    ElMessage.error('操作失败')
  }
}

// 忽略任务
const ignoreTask = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要忽略这个复习任务吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    // 这里可以调用标记忽略的API
    await studyPlanStore.fetchReviewTasks()
    ElMessage.success('已忽略')
  } catch {
    // 用户取消
  }
}

// 生成复习计划
const generateReviewPlan = async () => {
  const selectedItems = reviewItems.value.filter((item) => item.status === 'pending')
  if (selectedItems.length === 0) {
    ElMessage.warning('请先选择要复习的任务')
    return
  }

  ElMessage.success(`已选择 ${selectedItems.length} 个复习任务`)
  // TODO: 调用生成复习计划的API
}

// 标记难点
const markSelectedDifficulty = async () => {
  const selectedItems = reviewItems.value.filter((item) => item.status === 'pending')
  if (selectedItems.length === 0) {
    ElMessage.warning('请先选择要标记的任务')
    return
  }

  ElMessage.success(`已标记 ${selectedItems.length} 个难点`)
  // TODO: 调用标记难点的API
}

// 检查屏幕尺寸
const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 1024
  if (isMobile.value) {
    showSidebar.value = false
  }
}

// 导航
const goToStudyPlan = () => router.push('/ai/study')
const goToSmartReview = () => {
  /* 当前页面 */
}
const toggleSidebar = () => (showSidebar.value = !showSidebar.value)

// 生命周期
onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
  studyPlanStore.fetchReviewTasks()
})
</script>

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
        <div class="review-main">
          <h2 class="review-title">个性化智能复习</h2>

          <div class="review-section">
            <h3 class="section-title">待复习任务</h3>

            <!-- 任务列表 -->
            <div class="review-table" v-if="reviewItems.length > 0">
              <!-- 表头 -->
              <div class="review-table-header">
                <div class="review-table-header-item">任务名称</div>
                <div class="review-table-header-item">复习阶段</div>
                <div class="review-table-header-item">计划时间</div>
                <div class="review-table-header-item">状态</div>
                <div class="review-table-header-item">操作</div>
              </div>

              <!-- 表格内容 -->
              <div class="review-table-body">
                <div v-for="item in reviewItems" :key="item.id" class="review-table-row">
                  <div class="review-table-cell">{{ item.title }}</div>

                  <div class="review-table-cell">
                    <span class="difficulty-tag" :class="getDifficultyClass(item.reviewStage)">
                      第{{ item.reviewStage }}次
                    </span>
                  </div>

                  <div class="review-table-cell">{{ formatDate(item.taskDate) }}</div>

                  <div class="review-table-cell">
                    <input
                      type="checkbox"
                      :checked="item.status === 'completed'"
                      @change="completeTask(item.id)"
                      class="complete-checkbox"
                    />
                  </div>

                  <div class="review-table-cell">
                    <button class="delete-btn" @click="ignoreTask(item.id)">忽略</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-else class="empty-state">
              <p>暂无复习任务</p>
              <p class="empty-tip">完成学习计划后会自动生成复习任务</p>
            </div>

            <!-- 操作按钮 -->
            <div class="review-footer">
              <button class="generate-btn" @click="generateReviewPlan">生成复习计划</button>
              <button class="difficulty-btn" @click="markSelectedDifficulty">标记难点</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* 全局变量 */
:root {
  /* 主色调：科技蓝 */
  --primary-color: #165dff;
  --primary-color-dark: #0e46cc;
  --primary-color-light: #4c8aff;

  /* 辅助色：浅红色 */
  --accent-color: #f53f3f;
  --accent-color-dark: #e13d3d;
  --accent-color-light: #f76d6d;

  /* 背景色：浅灰色 */
  --bg-color: #f5f7fa;
  --bg-color-light: #fafafb;
  --bg-color-dark: #eef1f5;

  /* 文字主色：深灰色 */
  --text-color: #1d2129;
  --text-color-secondary: #4e5969;
  --text-color-light: #86909c;

  /* 边框和阴影 */
  --border-color: #e5e7eb;
  --border-color-light: #f0f2f5;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

  /* 圆角 */
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  --border-radius-xl: 16px;

  /* 过渡 */
  --transition: all 0.3s ease;
}

/* 继承自学习计划页面的样式 */
.smart-qa-container {
  min-height: 100vh;
  background-color: var(--bg-color);
  font-family: 'Microsoft YaHei', '微软雅黑', sans-serif;
  display: flex;
  flex-direction: column;
}

.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  box-shadow: var(--shadow-sm);
  z-index: 100;
  height: 70px;
  border-bottom: 1px solid var(--border-color-light);
}

.navbar-container {
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 100%;
}

.logo {
  display: flex;
  align-items: center;
}

.logo-placeholder {
  padding: 8px 16px;
  background-color: var(--primary-color);
  color: #fff;
  border-radius: var(--border-radius-md);
  font-size: 16px;
  font-weight: 600;
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: 32px;
}

.nav-menu.mobile-menu {
  display: none;
}

.nav-item {
  position: relative;
  padding: 12px 16px;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color);
  cursor: pointer;
  transition: var(--transition);
  border-radius: var(--border-radius-md);
}

.nav-item:hover {
  color: var(--primary-color);
  background-color: var(--bg-color-light);
}

.nav-item.active {
  color: var(--primary-color);
  font-weight: 600;
}

.nav-item.has-submenu::after {
  content: '▼';
  margin-left: 6px;
  font-size: 12px;
}

.submenu {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 12px 0;
  min-width: 160px;
  z-index: 200;
  animation: slideDown 0.2s ease;
  display: block;
}

.submenu-item {
  padding: 12px 20px;
  font-size: 14px;
  color: var(--text-color);
  cursor: pointer;
  transition: var(--transition);
  white-space: nowrap;
}

.submenu-item:hover {
  background-color: var(--bg-color-light);
  color: var(--primary-color);
}

.mobile-submenu {
  background-color: var(--bg-color-light);
  border-radius: var(--border-radius-md);
  margin-top: 8px;
  padding: 8px 0;
  display: block;
}

.mobile-submenu-item {
  padding: 10px 20px;
  font-size: 14px;
  color: var(--text-color);
  cursor: pointer;
  transition: var(--transition);
}

.mobile-submenu-item:hover {
  background-color: var(--primary-color);
  color: #fff;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-login {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background-color: var(--primary-color);
  color: #fff;
  border: 1px solid var(--primary-color);
  border-radius: var(--border-radius-md);
  font-size: 14px;
  font-weight: 500;
  transition: var(--transition);
  cursor: pointer;
}

.btn-login:hover {
  background-color: var(--primary-color-dark);
  border-color: var(--primary-color-dark);
}

.login-icon {
  font-size: 16px;
}

.user-center {
  position: relative;
}

.btn-user-center {
  padding: 10px 20px;
  background-color: transparent;
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  font-size: 14px;
  font-weight: 500;
  transition: var(--transition);
  cursor: pointer;
}

.btn-user-center:hover {
  background-color: var(--bg-color-light);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.user-center-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 8px 0;
  min-width: 140px;
  z-index: 200;
  margin-top: 8px;
}

.dropdown-item {
  padding: 12px 20px;
  font-size: 14px;
  color: var(--text-color);
  cursor: pointer;
  transition: var(--transition);
}

.dropdown-item:hover {
  background-color: var(--bg-color-light);
  color: var(--primary-color);
}

.dropdown-item.register {
  color: var(--primary-color);
  border-bottom: 1px solid var(--border-color-light);
  margin-bottom: 8px;
  padding-bottom: 8px;
}

.dropdown-item.register:hover {
  background-color: var(--primary-color);
  color: #fff;
}

.dropdown-item.logout {
  color: var(--accent-color);
}

.dropdown-item.logout:hover {
  background-color: var(--accent-color);
  color: #fff;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.main-content {
  display: flex;
  flex: 1;
  margin-top: 70px;
  min-height: calc(100vh - 70px);
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
  max-width: calc(100% - 280px);
  overflow-y: auto;
}

/* 智能复习页面特有样式 */
.review-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.review-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.review-section {
  background-color: #fff;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border: 1px solid var(--border-color-light);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.sort-note {
  color: var(--accent-color);
  font-size: 14px;
  font-weight: 500;
}

/* 表格样式 */
.review-table {
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.review-table-header {
  display: grid;
  grid-template-columns: 1fr 120px 120px 120px 100px;
  background-color: var(--bg-color-light);
  border-bottom: 1px solid var(--border-color);
}

.review-table-header-item {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  border-right: 1px solid var(--border-color);
}

.review-table-header-item:last-child {
  border-right: none;
}

.review-table-body {
  display: flex;
  flex-direction: column;
}

.review-table-row {
  display: grid;
  grid-template-columns: 1fr 120px 120px 120px 100px;
  border-bottom: 1px solid var(--border-color);
  transition: var(--transition);
}

.review-table-row:hover {
  background-color: var(--bg-color-light);
}

.review-table-row:last-child {
  border-bottom: none;
}

.review-table-cell {
  padding: 16px;
  font-size: 14px;
  color: var(--text-color);
  border-right: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.review-table-cell:last-child {
  border-right: none;
  justify-content: center;
}

/* 难度标签样式 */
.difficulty-tag {
  padding: 4px 12px;
  border-radius: var(--border-radius-sm);
  font-size: 12px;
  font-weight: 500;
  color: #fff;
}

.difficulty-hard {
  background-color: var(--accent-color);
}

.difficulty-medium {
  background-color: #f7ba1e;
}

.difficulty-easy {
  background-color: #52c41a;
}

/* 完成复选框 */
.complete-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--primary-color);
  margin: 0;
  padding: 0;
}

/* 是否复习列居中 */
.review-table-cell:nth-child(4) {
  justify-content: center;
}

/* 删除按钮 */
.delete-btn {
  background: none;
  border: none;
  color: var(--accent-color);
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--border-radius-sm);
  transition: var(--transition);
}

.delete-btn:hover {
  background-color: var(--accent-color-light);
  color: #fff;
}

/* 生成复习计划按钮 */
.review-footer {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.generate-btn {
  padding: 12px 32px;
  background-color: var(--primary-color);
  color: #fff;
  border: none;
  border-radius: var(--border-radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  box-shadow: var(--shadow-md);
}

.generate-btn:hover {
  background-color: var(--primary-color-dark);
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

/* 响应式设计 */
@media (max-width: 1366px) {
  /* 笔记本端适配 */
  .sidebar {
    width: 240px;
  }

  .study-main {
    max-width: calc(100% - 240px);
  }
}

@media (max-width: 1024px) {
  /* 平板端适配 */
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
  }

  .study-main {
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  /* 移动端适配 */
  .navbar-container {
    padding: 0 16px;
    height: 60px;
  }

  .nav-menu {
    display: none;
  }

  .nav-menu.mobile-menu {
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: #fff;
    box-shadow: var(--shadow-lg);
    border-top: 1px solid var(--border-color-light);
    padding: 16px;
    gap: 8px;
  }

  .nav-item {
    padding: 12px 16px;
    border-radius: var(--border-radius-md);
    border: 1px solid var(--border-color-light);
  }

  .study-main {
    padding: 10px;
  }

  /* 表格在移动端改为垂直布局 */
  .review-table-header {
    display: none;
  }

  .review-table-row {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    border-bottom: 1px solid var(--border-color);
  }

  .review-table-cell {
    border-right: none;
    border-bottom: 1px solid var(--border-color-light);
    padding: 8px 0;
    justify-content: space-between;
  }

  .review-table-cell:last-child {
    border-bottom: none;
    justify-content: flex-start;
  }

  /* 移动端导航栏高度调整 */
  .navbar {
    height: 60px;
  }

  /* 移动端主内容区顶部边距调整 */
  .main-content {
    margin-top: 60px;
    min-height: calc(100vh - 60px);
  }

  /* 移动端侧边栏高度调整 */
  .sidebar {
    top: 60px;
    height: calc(100vh - 60px);
  }
}
</style>
