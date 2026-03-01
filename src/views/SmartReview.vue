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

          <!-- 智能复习模块 -->
          <div class="review-section">
            <h3 class="section-title">待复习任务</h3>

            <!-- 复习任务列表 -->
            <div class="review-table">
              <!-- 表头 - 6列：复选框 | 名称 | 难度 | 时间 | 是否复习 | 操作 -->
              <div class="review-table-header">
                <div class="review-table-header-item" style="width: 40px">
                  <el-checkbox
                    :model-value="selectAll"
                    :indeterminate="isIndeterminate"
                    @change="handleSelectAllChange"
                  />
                </div>
                <div class="review-table-header-item">学习项名称</div>
                <div class="review-table-header-item">难度标识</div>
                <div class="review-table-header-item">时间</div>
                <div class="review-table-header-item">是否复习</div>
                <div class="review-table-header-item" style="width: 100px">操作</div>
              </div>

              <!-- 数据行 - 6列 -->
              <div v-for="item in reviewItems" :key="item.id" class="review-table-row">
                <!-- 复选框列 -->
                <div class="review-table-cell" style="width: 40px">
                  <el-checkbox
                    v-model="selectedTaskIds"
                    :label="item.id"
                    :disabled="item.reviewStage !== 0"
                  >
                    <!-- 空插槽 + CSS隐藏，双重保险 -->
                    <span style="display: none"></span>
                  </el-checkbox>
                </div>

                <!-- 名称 -->
                <div class="review-table-cell" :title="item.title">{{ item.title }}</div>

                <!-- 难度标识 -->
                <div class="review-table-cell">
                  <el-tag v-if="item.reviewStage === 0" type="warning" size="small" effect="dark">
                    待生成
                  </el-tag>
                  <span v-else> 第{{ item.reviewStage }}次复习 </span>
                </div>

                <!-- 时间 -->
                <div class="review-table-cell">{{ formatDate(item.taskDate) }}</div>

                <div class="review-table-cell">
                  <el-checkbox
                    :model-value="item.status === 'completed'"
                    @change="
                      (val: boolean) => {
                        if (val) {
                          if (item.reviewStage === 0) {
                            ElMessage.warning('请先生成复习计划')
                          } else {
                            completeTask(item.id)
                          }
                        }
                      }
                    "
                  />
                </div>

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

            <!-- 按钮放在表格下面，居中 -->
            <div class="review-footer">
              <el-button
                type="primary"
                size="large"
                :disabled="selectedTaskIds.length === 0"
                @click="showEbbinghausModal = true"
              >
                生成复习计划 ({{ selectedTaskIds.length }})
              </el-button>
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
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStudyPlanStore } from '../stores/studyPlan'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '@/api'
import { nextTick } from 'vue'

const router = useRouter()
const studyPlanStore = useStudyPlanStore()

const isMobile = ref(false)
const showSidebar = ref(true)

// 复习任务数据
const reviewItems = computed(() => studyPlanStore.reviewItems)
const completeTask = async (id: number) => {
  try {
    await studyPlanStore.completeTask(id)
    ElMessage.success('任务已完成')
  } catch {
    ElMessage.error('操作失败')
  }
}
// 选中状态
const selectedTaskIds = ref<number[]>([])
const showEbbinghausModal = ref(false)
const generating = ref(false)

// 全选逻辑 - 用 reviewStage === 0 判断
const selectAll = computed({
  get: () => {
    const selectableTasks = reviewItems.value.filter((item) => item.reviewStage === 0)
    return selectableTasks.length > 0 && selectedTaskIds.value.length === selectableTasks.length
  },
  set: (value) => {
    if (value) {
      selectedTaskIds.value = reviewItems.value
        .filter((item) => item.reviewStage === 0)
        .map((item) => item.id)
    } else {
      selectedTaskIds.value = []
    }
  },
})

const isIndeterminate = computed(() => {
  const selectableTasks = reviewItems.value.filter((item) => item.reviewStage === 0)
  return selectedTaskIds.value.length > 0 && selectedTaskIds.value.length < selectableTasks.length
})

const handleSelectAllChange = (value: boolean) => {
  selectAll.value = value
}

// 检查屏幕尺寸
const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 1024
}
const goToStudyPlan = () => router.push('/ai/study')
const goToSmartReview = () => {} // 已在当前页面

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

// 忽略任务
const ignoreTask = async (id: number) => {
  try {
    // 添加确认提示
    await ElMessageBox.confirm('确定要忽略这个任务吗？此操作不可撤销。', '确认操作', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await studyPlanStore.ignoreTask(id) // 假设store中有这个方法
    ElMessage.success('任务已忽略')
    // 刷新任务列表
    await studyPlanStore.fetchPendingTasks()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
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
    // 调用批量生成接口
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

// 监听任务变化，自动清除已不在列表中的选中项
watch(
  reviewItems,
  (newItems) => {
    const validIds = newItems.map((item) => item.id)
    selectedTaskIds.value = selectedTaskIds.value.filter((id) => validIds.includes(id))
  },
  { deep: true },
)

onMounted(() => {
  // 强制初始化侧边栏为显示状态
  showSidebar.value = true

  // 等待 DOM 更新
  nextTick(() => {
    checkScreenSize()

    // 再次确认
    setTimeout(() => {
      checkScreenSize()
    }, 50)
  })
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
  studyPlanStore.fetchPendingTasks()
})

// 页面卸载时移除事件监听器
onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
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
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  --border-radius-xl: 16px;
  --transition: all 0.3s ease;
}

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
  cursor: pointer;
}

.btn-login:hover {
  background-color: var(--primary-color-dark);
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
}

.dropdown-item:hover {
  background-color: var(--bg-color-light);
  color: var(--primary-color);
}

.dropdown-item.logout {
  color: var(--accent-color);
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

/* ===== 主要修复部分 ===== */
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
  flex-shrink: 0; /* 防止侧边栏被压缩 */
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
  flex: 1; /* 自动占满剩余空间 */
  background-color: var(--bg-color);
  padding: 20px;
  overflow-y: auto;
  position: relative;
  z-index: 1;
  min-width: 0; /* 防止flex子项溢出 */
}

/* 智能复习页面样式 */
.review-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  border: 1px solid var(--border-color-light);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 16px 0;
}

/* 表格样式 */
.review-table {
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

/* 表头样式 */
.review-table-header {
  background-color: var(--bg-color-light);
  font-weight: 600;
}

.review-table-header,
.review-table-row {
  display: grid;
  grid-template-columns: 40px 1fr 120px 120px 80px 100px;
  align-items: center;
  width: 100%;
}

/* 单元格样式 */
.review-table-header-item,
.review-table-cell {
  padding: 12px 8px;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

/* 复选框列居中 */
.review-table-cell:first-child,
.review-table-header-item:first-child {
  text-align: center;
  padding-left: 0;
  padding-right: 0;
}

.el-checkbox {
  display: flex;
  justify-content: center;
  align-items: center;
}

.el-checkbox__inner {
  margin: 0;
}

/* 是否复习列居中 */
.review-table-cell:nth-child(5),
.review-table-header-item:nth-child(5) {
  text-align: center;
}

.el-checkbox__label {
  display: none !important;
}

/* 按钮容器 - 居中 */
.review-footer {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color-light);
}

/* 按钮样式 */
.review-footer .el-button {
  min-width: 200px;
  height: 40px;
}

.review-table-cell {
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-color);
}

.review-table-cell:last-child {
  border-right: none;
}

/* 空状态 */
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

/* 响应式设计 */
@media (max-width: 1366px) {
  .sidebar {
    width: 240px;
  }
}

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
  .navbar-container {
    padding: 0 16px;
    height: 60px;
  }

  .navbar {
    height: 60px;
  }

  .main-content {
    margin-top: 60px;
  }

  .sidebar {
    top: 60px;
    height: calc(100vh - 60px);
  }

  .review-table-header {
    display: none;
  }

  .review-table-row {
    display: flex;
    flex-direction: column;
    padding: 16px;
    gap: 12px;
  }

  .review-table-cell {
    border-right: none;
    border-bottom: 1px solid var(--border-color-light);
    padding: 8px 0;
    justify-content: space-between;
  }

  .review-table-cell:last-child {
    border-bottom: none;
  }

  /* 移动端按钮样式调整 */
  .review-footer .el-button {
    min-width: 160px;
    height: 36px;
    font-size: 13px;
  }
}

/* 超小屏幕 */
@media (max-width: 480px) {
  .review-title {
    font-size: 20px;
  }

  .section-title {
    font-size: 16px;
  }

  .empty-icon {
    font-size: 36px;
  }

  .empty-text {
    font-size: 14px;
  }

  .empty-tip {
    font-size: 12px;
  }
}
</style>
