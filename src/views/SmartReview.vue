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
          <div class="review-header">
            <h2 class="review-title">个性化智能复习</h2>
            <div class="review-actions">
              <el-button
                type="primary"
                :disabled="selectedTaskIds.length === 0"
                @click="showEbbinghausModal = true"
              >
                生成复习计划 ({{ selectedTaskIds.length }})
              </el-button>
            </div>
          </div>

          <!-- 智能复习模块 -->
          <div class="review-section">
            <h3 class="section-title">待复习任务</h3>

            <!-- 复习任务列表 -->
            <div class="review-table">
              <!-- 表头 -->
              <div class="review-table-header">
                <div class="review-table-header-item" style="width: 40px">
                  <el-checkbox
                    v-model="selectedTaskIds"
                    :label="item.id"
                    :disabled="item.reviewStage !== 0"
                  />
                </div>
                <div class="review-table-header-item">学习项名称</div>
                <div class="review-table-header-item">难度标识</div>
                <div class="review-table-header-item">时间</div>
                <div class="review-table-header-item" style="width: 100px">操作</div>
              </div>

              <!-- 表格内容 -->
              <div class="review-table-body">
                <div v-for="item in reviewItems" :key="item.id" class="review-table-row">
                  <!-- 复选框列 -->
                  <div class="review-table-cell">
                    <el-tag v-if="item.reviewStage === 0" type="warning" size="small">
                      待生产
                    </el-tag>
                    <el-tag v-else :type="getDifficultyType(item.difficulty)" size="small">
                      第{{ item.reviewStage }}次
                    </el-tag>
                  </div>

                  <!-- 学习项名称 -->
                  <div class="review-table-cell">{{ item.title }}</div>

                  <!-- 难度标识 -->
                  <div class="review-table-cell">
                    <el-tag
                      v-if="item.difficulty === 'pending' && item.reviewStage === 0"
                      type="warning"
                      size="small"
                    >
                      待生产
                    </el-tag>
                    <el-tag v-else :type="getDifficultyType(item.difficulty)" size="small">
                      第{{ item.reviewStage }}次
                    </el-tag>
                  </div>

                  <!-- 时间 -->
                  <div class="review-table-cell">{{ formatDate(item.taskDate) }}</div>

                  <!-- 操作 -->
                  <div class="review-table-cell" style="width: 100px">
                    <el-button type="danger" link size="small" @click="ignoreTask(item.id)">
                      忽略
                    </el-button>
                  </div>
                </div>

                <!-- 空状态 -->
                <div v-if="reviewItems.length === 0" class="empty-state">
                  <div class="empty-icon">📚</div>
                  <div class="empty-text">暂无复习任务</div>
                  <div class="empty-tip">完成学习计划后会自动生成待生产任务</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- 艾宾浩斯遗忘曲线弹窗 -->
    <el-dialog
      v-model="showEbbinghausModal"
      title="艾宾浩斯遗忘曲线"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="ebbinghaus-container">
        <!-- 曲线图 -->
        <div class="curve-image-container">
          <img
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 400'%3E%3Crect width='800' height='400' fill='%23f5f7fa'/%3E%3Cpath d='M100 300 L700 300' stroke='%23ccc' stroke-width='2'/%3E%3Cpath d='M100 300 L100 50' stroke='%23ccc' stroke-width='2'/%3E%3Ctext x='80' y='320' fill='%23666' font-size='12'%3E0%3C/text%3E%3Ctext x='180' y='320' fill='%23666' font-size='12'%3E1%3C/text%3E%3Ctext x='280' y='320' fill='%23666' font-size='12'%3E2%3C/text%3E%3Ctext x='380' y='320' fill='%23666' font-size='12'%3E3%3C/text%3E%3Ctext x='480' y='320' fill='%23666' font-size='12'%3E4%3C/text%3E%3Ctext x='580' y='320' fill='%23666' font-size='12'%3E5%3C/text%3E%3Ctext x='680' y='320' fill='%23666' font-size='12'%3E6%3C/text%3E%3Ctext x='60' y='300' fill='%23666' font-size='12'%3E100%25%3C/text%3E%3Ctext x='60' y='250' fill='%23666' font-size='12'%3E75%25%3C/text%3E%3Ctext x='60' y='200' fill='%23666' font-size='12'%3E50%25%3C/text%3E%3Ctext x='60' y='150' fill='%23666' font-size='12'%3E25%25%3C/text%3E%3Ctext x='60' y='100' fill='%23666' font-size='12'%3E0%25%3C/text%3E%3Cpath d='M100 100 Q200 180 300 200 Q400 220 500 250 Q600 280 700 300' stroke='%23165dff' stroke-width='4' fill='none'/%3E%3Ccircle cx='100' cy='100' r='6' fill='%23165dff'/%3E%3Ccircle cx='200' cy='180' r='6' fill='%23165dff'/%3E%3Ccircle cx='300' cy='200' r='6' fill='%23165dff'/%3E%3Ccircle cx='400' cy='220' r='6' fill='%23165dff'/%3E%3Ccircle cx='500' cy='250' r='6' fill='%23165dff'/%3E%3Ccircle cx='600' cy='280' r='6' fill='%23165dff'/%3E%3Ccircle cx='700' cy='300' r='6' fill='%23165dff'/%3E%3Ctext x='80' y='80' fill='%23165dff' font-size='14'%3E刚刚记忆%3C/text%3E%3Ctext x='180' y='160' fill='%23165dff' font-size='14'%3E1天后%3C/text%3E%3Ctext x='280' y='180' fill='%23165dff' font-size='14'%3E2天后%3C/text%3E%3Ctext x='380' y='200' fill='%23165dff' font-size='14'%3E3天后%3C/text%3E%3Ctext x='480' y='230' fill='%23165dff' font-size='14'%3E4天后%3C/text%3E%3Ctext x='580' y='260' fill='%23165dff' font-size='14'%3E5天后%3C/text%3E%3Ctext x='680' y='280' fill='%23165dff' font-size='14'%3E6天后%3C/text%3E%3C/svg%3E"
            alt="艾宾浩斯遗忘曲线"
            class="curve-image"
          />
        </div>

        <!-- 说明文字 -->
        <div class="curve-description">
          <h4>艾宾浩斯遗忘曲线复习计划</h4>
          <p>根据遗忘曲线规律，您将在以下时间点进行复习：</p>
          <ul>
            <li><span class="dot"></span> 第1天（记忆保留约44%）</li>
            <li><span class="dot"></span> 第3天（记忆保留约33%）</li>
            <li><span class="dot"></span> 第7天（记忆保留约25%）</li>
            <li><span class="dot"></span> 第15天（记忆保留约21%）</li>
            <li><span class="dot"></span> 第30天（记忆保留约19%）</li>
          </ul>
          <p class="note">每次复习后，记忆保留率会大幅提升，最终形成长期记忆。</p>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showEbbinghausModal = false">取消</el-button>
          <el-button type="primary" @click="confirmGenerate" :loading="generating">
            开始生成 ({{ selectedTaskIds.length }}个任务)
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import GlobalNavbar from '../components/GlobalNavbar.vue'
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useStudyPlanStore } from '../stores/studyPlan'
import { ElMessage } from 'element-plus'
import type { ReviewItem } from '../stores/studyPlan'

const router = useRouter()
const userStore = useUserStore()
const studyPlanStore = useStudyPlanStore()

// 响应式数据
const showUserCenter = ref(false)
const activeMenu = ref('')
const showSubMenu = ref('')
const isMobile = ref(false)
const showSidebar = ref(true)

// 复习任务数据
const reviewItems = computed(() => studyPlanStore.reviewItems)

// 选中状态
const selectedTaskIds = ref<number[]>([])
const showEbbinghausModal = ref(false)
const generating = ref(false)

// 全选逻辑
const selectAll = computed({
  get: () => {
    const selectableTasks = reviewItems.value.filter(
      (item) => item.difficulty === 'pending' && item.reviewStage === 0,
    )
    return selectableTasks.length > 0 && selectedTaskIds.value.length === selectableTasks.length
  },
  set: (value) => {
    if (value) {
      selectedTaskIds.value = reviewItems.value
        .filter((item) => item.difficulty === 'pending' && item.reviewStage === 0)
        .map((item) => item.id)
    } else {
      selectedTaskIds.value = []
    }
  },
})

const isIndeterminate = computed(() => {
  const selectableTasks = reviewItems.value.filter(
    (item) => item.difficulty === 'pending' && item.reviewStage === 0,
  )
  return selectedTaskIds.value.length > 0 && selectedTaskIds.value.length < selectableTasks.length
})

const handleSelectAllChange = (value: boolean) => {
  selectAll.value = value
}

// 检查屏幕尺寸
const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 1024
}

// 导航栏方法
const goToLogin = () => router.push('/login')
const goToRegister = () => router.push('/register')
const goToSmartQA = () => router.push('/ai/chat')
const goToStudyPlan = () => router.push('/ai/study')
const goToStudyManagement = () => router.push('/campus/analysis')
const goToSmartReview = () => {} // 已在当前页面

const toggleUserCenter = () => {
  showUserCenter.value = !showUserCenter.value
}

const closeUserCenter = () => {
  showUserCenter.value = false
}

const showSubMenuHandler = (menu: string) => {
  if (!isMobile.value) {
    showSubMenu.value = menu
  }
}

const hideSubMenu = () => {
  showSubMenu.value = ''
}

const handleMenuClick = (menu: string) => {
  if (menu === '首页') {
    router.push('/index')
    return
  }

  if (isMobile.value) {
    if (showSubMenu.value === menu) {
      showSubMenu.value = ''
    } else {
      showSubMenu.value = menu
    }
  } else {
    if (['个性化学习伴侣', '校园生活', '竞赛相关'].includes(menu)) {
      showSubMenuHandler(menu)
    } else {
      hideSubMenu()
    }
  }
}

const handleUserMenuClick = (item: string) => {
  if (item === '个人信息') {
    router.push('/profile')
  } else if (item === '退出登录') {
    localStorage.removeItem('token')
    localStorage.removeItem('userToken')
    router.push('/login')
  }
  closeUserCenter()
}

// 切换侧边栏
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}

// 格式化日期
const formatDate = (date: string) => {
  return new Date(date)
    .toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    .replace(/\//g, '-')
}

// 获取难度标签类型
const getDifficultyType = (difficulty: string) => {
  const map: Record<string, string> = {
    easy: 'success',
    medium: 'warning',
    hard: 'danger',
  }
  return map[difficulty] || 'info'
}

// 忽略任务
const ignoreTask = async (id: number) => {
  try {
    // 这里可以调用一个忽略API，或者直接删除
    // 暂时先刷新列表
    await studyPlanStore.fetchPendingTasks()
    ElMessage.success('任务已忽略')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 确认生成复习计划
const confirmGenerate = async () => {
  if (selectedTaskIds.value.length === 0) {
    ElMessage.warning('请至少选择一个任务')
    return
  }

  generating.value = true
  try {
    // ✅ 调用批量生成接口
    await api.batchGenerateReviewPlans(selectedTaskIds.value)

    ElMessage.success(`已为 ${selectedTaskIds.value.length} 个任务生成复习计划`)
    showEbbinghausModal.value = false
    selectedTaskIds.value = []

    // 刷新任务列表
    await studyPlanStore.fetchPendingTasks()
  } catch (error) {
    console.error('生成复习计划失败:', error)
    ElMessage.error('生成复习计划失败')
  } finally {
    generating.value = false
  }
}

// 生命周期
onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
  studyPlanStore.fetchPendingTasks()
})
</script>

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
  justify-content: center;
  text-align: center;
}

.review-table-cell:first-child {
  justify-content: flex-start;
  text-align: left;
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
  color: black;
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
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
}

.empty-tip {
  font-size: 14px;
  color: var(--text-color-light);
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

  .review-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .review-title {
    font-size: 24px;
    font-weight: 600;
    color: var(--text-color);
    margin: 0;
  }

  .review-actions {
    display: flex;
    gap: 12px;
  }

  /* 艾宾浩斯弹窗样式 */
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

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}
</style>
