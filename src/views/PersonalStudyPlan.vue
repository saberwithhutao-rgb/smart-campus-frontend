<script setup lang="ts">
import GlobalNavbar from '../components/GlobalNavbar.vue'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useStudyPlanStore } from '../stores/studyPlan'
import type { StudyPlan } from '../types/user'

// 路由实例
const router = useRouter()

// 用户状态管理
const userStore = useUserStore()

// 响应式数据 - 导航栏相关
const showUserCenter = ref(false) // 显示个人中心菜单
const activeMenu = ref('') // 当前激活的菜单
const showSubMenu = ref('') // 显示子菜单
const isMobile = ref(false) // 是否为移动端

// 响应式数据 - 学习计划相关
const showSidebar = ref(true) // 是否显示侧边栏
const selectedMenu = ref('plan') // 当前选中的菜单：plan-学习计划，review-智能复习

// 学习计划store
const studyPlanStore = useStudyPlanStore()

// 使用store中的学习计划数据和完成度计算
const studyPlans = computed(() => studyPlanStore.studyPlans)
const completionRate = computed(() => studyPlanStore.completionRate)

// 添加新计划弹窗
const showAddModal = ref(false)
const newPlan = ref({
  name: '', // 学习计划名称
  difficulty: '中', // 难易程度
  time: '', // 完成时间段
})

// 编辑计划弹窗
const showEditModal = ref(false)
const editPlan = ref({
  id: '' as string,
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  status: 'planning' as 'planning' | 'in_progress' | 'completed',
  subjects: [] as string[],
  progress: 0,
  difficulty: '中',
  time: '',
})
const currentEditPlan = ref<any>(null)

// 检查屏幕尺寸 - 响应式设计
const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 1024
  if (isMobile.value) {
    showSidebar.value = false
  }
}

// 导航栏菜单处理 - 完全复用首页导航栏交互
const goToLogin = () => {
  router.push('/login')
}

const goToRegister = () => {
  router.push('/register')
}

const goToSmartQA = () => {
  router.push('/ai/chat')
}

const goToStudyManagement = () => {
  router.push('/campus/analysis')
}

const goToCompetitionManagement = () => {
  router.push('/career/competitions')
}

// 跳转到职业导航页面
const goToCareerNavigation = () => {
  router.push('/career/position')
}

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
    // 点击首页，跳转到首页
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
    router.push('/login')
  }
  closeUserCenter()
}

// 切换学习计划菜单选中状态
const selectMenu = (menu: string) => {
  if (menu === 'review') {
    // 跳转到智能复习页面
    router.push('/ai/study/review')
  } else {
    selectedMenu.value = menu
  }
}

// 切换计划完成状态
const toggleComplete = (plan: StudyPlan) => {
  // 使用store的方法切换完成状态
  studyPlanStore.togglePlanComplete(plan.id)
}

// 排序学习计划函数：未完成在前，已完成在后，保持各自的原有顺序
const sortStudyPlans = () => {
  // 分离未完成和已完成的计划
  const incompletePlans = studyPlans.value.filter((plan) => plan.progress < 100)
  const completedPlans = studyPlans.value.filter((plan) => plan.progress >= 100)

  // 合并数组：未完成在前，已完成在后
  // 未完成项保持原添加顺序，已完成项也保持原完成顺序
  studyPlans.value = [...incompletePlans, ...completedPlans]
}

// 打开添加计划弹窗
const openAddModalHandler = () => {
  showAddModal.value = true
  newPlan.value = {
    name: '',
    difficulty: '中',
    time: '',
  }
}

// 关闭添加计划弹窗
const closeAddModalHandler = () => {
  showAddModal.value = false
}

// 添加新计划
const addPlan = () => {
  if (!newPlan.value.name.trim()) return

  // 使用store的方法添加新计划
  const planData = {
    title: newPlan.value.name,
    description: '',
    startDate: newPlan.value.time.split('-')[0].trim(),
    endDate: newPlan.value.time.split('-')[1].trim(),
    status: 'planning' as 'planning' | 'in_progress' | 'completed',
    subjects: [newPlan.value.difficulty],
    progress: 0,
  }
  studyPlanStore.addPlan(planData)

  closeAddModalHandler()
}

// 打开编辑计划弹窗
const openEditModalHandler = (plan: StudyPlan) => {
  currentEditPlan.value = plan
  editPlan.value = {
    ...plan,
    id: plan.id,
    subjects: plan.subjects,
    difficulty: plan.subjects[0] || '中',
    time: `${plan.startDate} - ${plan.endDate}`,
  }
  showEditModal.value = true
}

// 关闭编辑计划弹窗
const closeEditModalHandler = () => {
  showEditModal.value = false
  currentEditPlan.value = null
}

// 保存编辑的计划
const saveEditPlan = () => {
  if (!editPlan.value.title.trim() || !currentEditPlan.value) return

  // 使用store的方法更新计划
  const planData = {
    id: editPlan.value.id,
    title: editPlan.value.title,
    description: editPlan.value.description,
    startDate: editPlan.value.startDate,
    endDate: editPlan.value.endDate,
    status: editPlan.value.status,
    subjects: editPlan.value.subjects,
    progress: editPlan.value.progress,
    difficulty: editPlan.value.difficulty,
    time: editPlan.value.time,
  }
  studyPlanStore.updatePlan(planData)

  closeEditModalHandler()
}

// 删除计划 - 先弹出确认窗口，确认后删除计划，并更新完成度
const deletePlan = (id: string) => {
  // 弹出确认对话框
  if (confirm('确定要删除这个学习计划吗？')) {
    // 使用store的方法删除计划
    studyPlanStore.deletePlan(id)
  }
}

// 切换侧边栏显示
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}

// 生命周期钩子 - 初始化和窗口大小监听
onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)

  // 初始化排序，确保未完成的计划在前，已完成的计划在后
  sortStudyPlans()
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
          <!-- 学习计划选项 -->
          <div
            class="sidebar-item"
            :class="{ 'sidebar-item-active': selectedMenu === 'plan' }"
            @click="selectMenu('plan')"
          >
            学习计划
          </div>

          <!-- 智能复习选项 -->
          <div
            class="sidebar-item"
            :class="{ 'sidebar-item-active': selectedMenu === 'review' }"
            @click="selectMenu('review')"
          >
            智能复习
          </div>
        </div>
      </aside>

      <!-- 中间学习计划区域 -->
      <main class="study-main">
        <!-- 学习计划区域 -->
        <div v-if="selectedMenu === 'plan'" class="plan-main">
          <!-- 完成度模块 -->
          <div class="completion-section">
            <div class="completion-header">
              <h3 class="completion-title">完成度</h3>
              <div class="completion-value">{{ completionRate }}%</div>
            </div>
            <div class="completion-bar-container">
              <div class="completion-bar" :style="{ width: `${completionRate}%` }"></div>
            </div>
          </div>

          <!-- 学习计划列表 -->
          <div class="plan-section">
            <div class="plan-header">
              <h3 class="plan-title">学习计划</h3>
              <div class="plan-time">预计时效：/test-经</div>
            </div>

            <!-- 计划列表 -->
            <div class="plan-list">
              <div
                v-for="plan in studyPlans"
                :key="plan.id"
                class="plan-item"
                :class="{ 'plan-item-completed': plan.progress >= 100 }"
              >
                <!-- 计划左侧：名称和完成情况 -->
                <div class="plan-left">
                  <div class="plan-complete">
                    <input type="checkbox" v-model="plan.progress" class="complete-checkbox" />
                  </div>
                  <div class="plan-name">{{ plan.title }}</div>
                </div>

                <!-- 计划右侧：难度、时间和操作按钮 -->
                <div class="plan-right">
                  <!-- 难度和时间 -->
                  <div class="plan-meta">
                    <div
                      class="plan-difficulty"
                      :class="{
                        'difficulty-hard': plan.subjects[0] === '难',
                        'difficulty-medium': plan.subjects[0] === '中',
                        'difficulty-easy': plan.subjects[0] === '易',
                      }"
                    >
                      {{ plan.title }}
                    </div>
                    <div class="plan-time-info">{{ `${plan.startDate} - ${plan.endDate}` }}</div>
                  </div>

                  <!-- 操作按钮 - 右下角位置，更小字体 -->
                  <div class="plan-actions">
                    <button class="action-btn edit-btn" @click="openEditModalHandler(plan)">
                      修改
                    </button>
                    <button class="action-btn delete-btn" @click="deletePlan(plan.id)">删除</button>
                  </div>
                </div>
              </div>

              <!-- 空状态 -->
              <div v-if="studyPlans.length === 0" class="empty-state">
                <div class="empty-icon">📝</div>
                <div class="empty-text">暂无学习计划</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 智能复习占位区 -->
        <div v-else class="review-placeholder">
          <div class="review-icon">📚</div>
          <div class="review-text">智能复习模块开发中...</div>
        </div>
      </main>
    </div>

    <!-- 添加新计划按钮 - 固定在右下角 -->
    <button class="add-plan-btn" @click="openAddModalHandler">添加新计划</button>

    <!-- 添加新计划弹窗 -->
    <div v-if="showAddModal" class="modal-overlay" @click="closeAddModalHandler">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">添加新计划</h3>
          <button class="modal-close" @click="closeAddModalHandler">&times;</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label for="plan-name">计划名称</label>
            <input
              type="text"
              id="plan-name"
              v-model="newPlan.name"
              class="form-input"
              placeholder="请输入计划名称"
            />
          </div>

          <div class="form-group">
            <label for="plan-difficulty">难易程度</label>
            <select id="plan-difficulty" v-model="newPlan.difficulty" class="form-select">
              <option value="难">难</option>
              <option value="中">中</option>
              <option value="易">易</option>
            </select>
          </div>

          <div class="form-group">
            <label for="plan-time">完成时间段</label>
            <input
              type="text"
              id="plan-time"
              v-model="newPlan.time"
              class="form-input"
              placeholder="如：12月6日-12月8日"
            />
          </div>
        </div>

        <div class="modal-footer">
          <button class="modal-btn cancel-btn" @click="closeAddModalHandler">取消</button>
          <button class="modal-btn confirm-btn" @click="addPlan">确认添加</button>
        </div>
      </div>
    </div>

    <!-- 编辑计划弹窗 -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModalHandler">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">编辑计划</h3>
          <button class="modal-close" @click="closeEditModalHandler">&times;</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label for="edit-plan-name">计划名称</label>
            <input
              type="text"
              id="edit-plan-name"
              v-model="editPlan.name"
              class="form-input"
              placeholder="请输入计划名称"
            />
          </div>

          <div class="form-group">
            <label for="edit-plan-difficulty">难易程度</label>
            <select id="edit-plan-difficulty" v-model="editPlan.difficulty" class="form-select">
              <option value="难">难</option>
              <option value="中">中</option>
              <option value="易">易</option>
            </select>
          </div>

          <div class="form-group">
            <label for="edit-plan-time">完成时间段</label>
            <input
              type="text"
              id="edit-plan-time"
              v-model="editPlan.time"
              class="form-input"
              placeholder="如：12月6日-12月8日"
            />
          </div>
        </div>

        <div class="modal-footer">
          <button class="modal-btn cancel-btn" @click="closeEditModalHandler">取消</button>
          <button class="modal-btn confirm-btn" @click="saveEditPlan">保存修改</button>
        </div>
      </div>
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
  --border-radius-full: 9999px;

  /* 过渡 */
  --transition: all 0.3s ease;
}

/* 主容器 */
.smart-qa-container {
  min-height: 100vh;
  background-color: var(--bg-color);
  font-family: 'Microsoft YaHei', '微软雅黑', sans-serif;
  display: flex;
  flex-direction: column;
}

/* 顶部导航栏 */
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

/* Logo区域 */
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

/* 导航菜单 */
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

.nav-item.has-submenu {
  position: relative;
}

.nav-item.has-submenu::after {
  content: '▼';
  margin-left: 6px;
  font-size: 12px;
}

/* 子菜单悬浮层 */
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

/* 移动端子菜单 */
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

/* 右侧操作区 */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 登录按钮 */
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

/* 个人中心 */
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

/* 个人中心下拉菜单 */
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

/* 动画 */
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

/* 主内容区 */
.main-content {
  display: flex;
  flex: 1;
  margin-top: 70px;
  min-height: calc(100vh - 70px);
}

/* 移动端侧边栏切换按钮 */
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

/* 左侧功能栏 */
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

/* 中间学习计划区域 */
.study-main {
  flex: 1;
  background-color: var(--bg-color);
  padding: 20px;
  max-width: calc(100% - 280px);
  overflow-y: auto;
}

/* 智能复习占位区 */
.review-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 40px 20px;
  text-align: center;
}

.review-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.review-text {
  font-size: 18px;
  color: var(--text-color-light);
}

/* 学习计划主区域 */
.plan-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 完成度模块 */
.completion-section {
  background-color: #fff;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 20px;
}

.completion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.completion-title {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-color);
  margin: 0;
}

.completion-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--primary-color);
}

.completion-bar-container {
  height: 8px;
  background-color: var(--bg-color-light);
  border-radius: var(--border-radius-sm);
  overflow: hidden;
}

.completion-bar {
  height: 100%;
  background-color: var(--primary-color);
  transition: width 0.3s ease;
  border-radius: var(--border-radius-sm);
}

/* 学习计划区域 */
.plan-section {
  background-color: #fff;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.plan-title {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-color);
  margin: 0;
}

.plan-time {
  font-size: 14px;
  color: var(--text-color-light);
}

/* 添加新计划按钮 - 右下角定位，确保不与其他元素重叠 */
.add-plan-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  padding: 12px 28px;
  background-color: var(--primary-color);
  color: #fff;
  border: none;
  border-radius: var(--border-radius-lg);
  font-size: 14px;
  cursor: pointer;
  transition: var(--transition);
  box-shadow: var(--shadow-lg);
  z-index: 100;
}

.add-plan-btn:hover {
  background-color: var(--primary-color-dark);
  box-shadow: var(--shadow-xl);
  transform: translateY(-2px);
}

/* 学习计划区域 - 相对定位，用于内部元素定位 */
.plan-section {
  position: relative;
}

/* 计划列表 */
.plan-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.plan-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  background-color: var(--bg-color-light);
  border-radius: var(--border-radius-md);
  transition: var(--transition);
  gap: 16px;
  position: relative;
}

.plan-item:hover {
  box-shadow: var(--shadow-md);
  background-color: #fff;
}

/* 计划左侧：名称和完成情况 */
.plan-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.plan-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
}

/* 完成复选框 */
.plan-complete {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}

.complete-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--primary-color);
}

/* 计划右侧：难度、时间和操作按钮 */
.plan-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

/* 难度和时间 */
.plan-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* 难度标签 */
.plan-difficulty {
  padding: 3px 10px;
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

/* 时间信息 */
.plan-time-info {
  font-size: 12px;
  color: var(--text-color-light);
}

/* 操作按钮 */
.plan-actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  padding: 4px 10px;
  border: none;
  border-radius: var(--border-radius-sm);
  font-size: 12px;
  font-weight: 400;
  cursor: pointer;
  transition: var(--transition);
  min-width: 50px;
  text-align: center;
}

.edit-btn {
  background-color: var(--primary-color);
  color: #fff;
}

.edit-btn:hover {
  background-color: var(--primary-color-dark);
  transform: translateY(-1px);
}

.delete-btn {
  background-color: var(--accent-color);
  color: #fff;
}

.delete-btn:hover {
  background-color: var(--accent-color-dark);
  transform: translateY(-1px);
}

/* 移除不再使用的样式 */
.plan-info {
  display: none;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background-color: var(--bg-color-light);
  border-radius: var(--border-radius-md);
  color: var(--text-color-light);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
}

/* 模态框遮罩 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  backdrop-filter: blur(4px);
  animation: modalFadeIn 0.3s ease;
}

/* 模态框内容 */
.modal-content {
  background-color: #fff;
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(22, 93, 255, 0.1);
}

/* 模态框动画 */
@keyframes modalFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 模态框头部 */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px;
  border-bottom: 1px solid var(--border-color-light);
  background: linear-gradient(135deg, #f8fafc 0%, #f0f2f5 100%);
  border-radius: var(--border-radius-xl) var(--border-radius-xl) 0 0;
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
  font-family: 'Microsoft YaHei', '微软雅黑', sans-serif;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-color-light);
  cursor: pointer;
  padding: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-lg);
  transition: var(--transition);
  background-color: var(--bg-color-light);
}

.modal-close:hover {
  background-color: var(--bg-color-dark);
  color: var(--text-color);
  transform: rotate(90deg);
}

/* 模态框主体 */
.modal-body {
  padding: 28px;
}

/* 表单组 */
.form-group {
  margin-bottom: 24px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
  font-family: 'Microsoft YaHei', '微软雅黑', sans-serif;
}

.form-input,
.form-select {
  width: 100%;
  padding: 14px 18px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  font-size: 14px;
  font-family: 'Microsoft YaHei', '微软雅黑', sans-serif;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background-color: #fff;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(22, 93, 255, 0.12);
  transform: translateY(-1px);
}

/* 模态框底部 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding: 24px 28px;
  border-top: 1px solid var(--border-color-light);
  background-color: var(--bg-color-light);
  border-radius: 0 0 var(--border-radius-xl) var(--border-radius-xl);
}

.modal-btn {
  padding: 12px 28px;
  border: none;
  border-radius: var(--border-radius-lg);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  font-family: 'Microsoft YaHei', '微软雅黑', sans-serif;
  min-width: 100px;
}

.cancel-btn {
  background-color: #fff;
  color: var(--text-color);
  border: 1px solid var(--border-color);
}

.cancel-btn:hover {
  background-color: var(--bg-color-light);
  border-color: var(--primary-color);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.confirm-btn {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.3);
}

.confirm-btn:hover {
  background: linear-gradient(135deg, var(--primary-color-dark) 0%, #0a36b9 100%);
  box-shadow: 0 6px 16px rgba(22, 93, 255, 0.4);
  transform: translateY(-2px);
}

/* 计划项样式优化 */
.plan-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 18px 20px;
  background-color: #fff;
  border-radius: var(--border-radius-lg);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  gap: 16px;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border-color-light);
}

.plan-item:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
  border-color: var(--primary-color-light);
}

/* 已完成计划的样式 */
.plan-item-completed {
  background-color: #f9fafb;
  border-color: #e5e7eb;
  opacity: 0.8;
}

.plan-item-completed .plan-name {
  color: var(--text-color-light);
  text-decoration: line-through;
}

.plan-item-completed .plan-difficulty {
  opacity: 0.7;
}

.plan-item-completed .plan-time-info {
  color: var(--text-color-light);
}

/* 完成度模块样式优化 */
.completion-section {
  background-color: #fff;
  border-radius: var(--border-radius-lg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 20px 24px;
  border: 1px solid var(--border-color-light);
  margin-bottom: 20px;
}

.completion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.completion-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
  font-family: 'Microsoft YaHei', '微软雅黑', sans-serif;
}

.completion-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--primary-color);
  font-family: 'Microsoft YaHei', '微软雅黑', sans-serif;
}

.completion-bar-container {
  height: 10px;
  background-color: var(--bg-color-light);
  border-radius: var(--border-radius-full);
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
}

.completion-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color) 0%, var(--primary-color-light) 100%);
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: var(--border-radius-full);
  box-shadow: 0 0 10px rgba(22, 93, 255, 0.3);
}

/* 学习计划区域样式优化 */
.plan-section {
  background-color: #fff;
  border-radius: var(--border-radius-lg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 20px 24px;
  border: 1px solid var(--border-color-light);
  position: relative;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color-light);
}

.plan-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
  font-family: 'Microsoft YaHei', '微软雅黑', sans-serif;
}

.plan-time {
  font-size: 14px;
  color: var(--text-color-light);
  font-family: 'Microsoft YaHei', '微软雅黑', sans-serif;
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

  .sidebar-collapsed {
    transform: translateX(-100%);
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

  .plan-item {
    flex-wrap: wrap;
    gap: 12px;
  }

  .plan-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .plan-actions {
    width: 100%;
    justify-content: flex-end;
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
