<template>
  <div class="library-status-container">
    <GlobalNavbar />
    <!-- 主体内容区 -->
    <div class="main-content">
      <!-- 左侧导航栏 -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2 class="sidebar-title">馆藏实况</h2>
        </div>
        <div class="sidebar-menu">
          <div class="sidebar-item sidebar-item-active" @click="selectMenu('status')">馆藏实况</div>
          <div class="sidebar-item" @click="selectMenu('books')">图书查询</div>
          <div class="sidebar-item" @click="selectMenu('borrow')">借阅记录</div>
        </div>
      </aside>

      <!-- 右侧内容区 -->
      <section class="content">
        <!-- 主标题 -->
        <h1 class="main-title">图书馆相关信息</h1>

        <!-- 图书馆开放时间 -->
        <div class="info-item">
          <span class="info-label">图书馆开放时间：</span>
          <span class="info-value">7:00-22:30（节假日除外）</span>
        </div>

        <!-- 位置使用情况统计 -->
        <div class="stats-container" v-if="!isLoading || totalSeats > 0">
          <div class="stat-item">
            <span class="stat-label">总座位数：</span>
            <span class="stat-value">{{ totalSeats }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">已占用：</span>
            <span class="stat-value">{{ occupiedSeats }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">剩余座位：</span>
            <span class="stat-value">{{ remainingSeats }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">剩余百分比：</span>
            <span
              class="stat-value"
              :class="{ 'status-red': remainingRatio < 10, 'status-green': remainingRatio >= 10 }"
            >
              {{ remainingRatio }}%
            </span>
          </div>
        </div>

        <!-- 加载状态 -->
        <div class="loading-container" v-if="isLoading && totalSeats === 0">
          <span>加载中...</span>
        </div>

        <!-- 进入/离开馆内按钮 -->
        <div class="entry-button-container">
          <!-- 进入按钮：未进入时可点击，进入后变灰 -->
          <div
            class="entry-button"
            @click="enterLibrary"
            :class="{ disabled: isInLibrary || isLoading }"
            :disabled="isInLibrary || isLoading"
          >
            {{ isLoading ? '处理中...' : '进入' }}
          </div>
          <!-- 离开按钮：进入后可点击，未进入时变灰 -->
          <div
            class="entry-button"
            @click="leaveLibrary"
            :class="{ disabled: !isInLibrary || isLoading }"
            :disabled="!isInLibrary || isLoading"
          >
            {{ isLoading ? '处理中...' : '离开' }}
          </div>
        </div>

        <!-- 今日总时长显示 -->
        <div class="today-duration">你当日的在图书馆的学习时间为：{{ todayDurationText }}</div>
      </section>
    </div>

    <!-- 确认弹窗 -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-text">{{ modalText }}</div>
        <div class="modal-actions">
          <button class="modal-btn confirm" @click="confirmAction">确认</button>
          <button class="modal-btn cancel" @click="closeModal">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import GlobalNavbar from '../components/GlobalNavbar.vue'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'

// 路由实例
const router = useRouter()

// 用户状态管理
const userStore = useUserStore()

// 响应式数据
const isMobile = ref(false)
const showUserCenter = ref(false)
const selectedMenu = ref('status')
const showModal = ref(false)
const modalText = ref('')
const actionType = ref<'enter' | 'leave'>('enter')

// 座位状态数据
const totalSeats = ref(0)
const occupiedSeats = ref(0)
const remainingSeats = ref(0)
const remainingRatio = ref(0) // 剩余座位百分比
const isLoading = ref(false) // 加载状态

// 图书馆相关状态
const userId = ref(1) // 测试阶段固定为1
const recordId = ref<number | null>(null) // 进入图书馆时返回的记录ID
const todayDuration = ref(0) // 今日总学习时长（分钟）
const todayDurationText = ref('') // 格式化后的今日学习时长
const isInLibrary = ref(false) // 是否在图书馆内

// 从本地存储加载状态
const loadLibraryState = () => {
  const savedRecordId = localStorage.getItem('libraryRecordId')
  const savedIsInLibrary = localStorage.getItem('libraryIsInLibrary')

  if (savedRecordId) {
    recordId.value = parseInt(savedRecordId)
  }

  if (savedIsInLibrary) {
    isInLibrary.value = savedIsInLibrary === 'true'
  }
}

// 保存状态到本地存储
const saveLibraryState = () => {
  localStorage.setItem('libraryRecordId', recordId.value?.toString() || 'null')
  localStorage.setItem('libraryIsInLibrary', isInLibrary.value.toString())
}

// 检查屏幕尺寸
const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 1024
}

// 选择侧边栏菜单
const selectMenu = (menu: string) => {
  selectedMenu.value = menu
}

// 获取座位状态
const fetchSeatStatus = async () => {
  try {
    const response = await fetch('/api/library/seat/status', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    console.log('获取座位状态响应:', data)

    if (data.code === 200 && data.data) {
      // 从data字段中读取数据
      totalSeats.value = data.data.totalSeats
      occupiedSeats.value = data.data.occupiedSeats
      // 计算剩余座位和百分比
      remainingSeats.value = totalSeats.value - occupiedSeats.value
      remainingRatio.value =
        totalSeats.value > 0
          ? Number(((remainingSeats.value / totalSeats.value) * 100).toFixed(2))
          : 0
    } else {
      console.error('获取座位状态失败:', data.message || '未知错误')
      ElMessage.error(data.message || '获取座位状态失败')
    }
  } catch (error) {
    console.error('获取座位状态失败:', error)
    ElMessage.error('网络错误，请稍后重试')
  }
}

// 时长格式化工具函数
const formatDuration = (minutes: number): string => {
  if (minutes <= 0) return '0分钟'

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours > 0 && mins > 0) {
    return `${hours}小时${mins}分钟`
  } else if (hours > 0) {
    return `${hours}小时`
  } else {
    return `${mins}分钟`
  }
}

// 进入图书馆
const enterLibrary = async () => {
  if (isLoading.value) return

  try {
    isLoading.value = true
    console.log('进入图书馆请求参数:', { userId: userId.value })

    // 1. 先调用记录图书馆时间的接口
    const timeResponse = await fetch(
      `http://localhost:8080/api/library/enter?userId=${userId.value}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    const timeData = await timeResponse.json()
    console.log('记录图书馆时间响应:', timeData)

    if (timeData.code === 200 && timeData.data) {
      // 保存记录ID和状态
      recordId.value = timeData.data
      isInLibrary.value = true
      // 保存状态到本地存储
      saveLibraryState()
      console.log('记录图书馆时间成功，recordId:', recordId.value)

      // 2. 再调用座位进入接口
      const seatResponse = await fetch('/api/library/seat/enter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const seatData = await seatResponse.json()
      console.log('座位进入响应:', seatData)

      if (seatData.code === 200) {
        ElMessage.success(seatData.message || '进入座位成功')
        // 刷新座位状态
        await fetchSeatStatus()
      } else {
        console.error('座位进入失败:', seatData.message || '未知错误')
        ElMessage.error(seatData.message || '进入座位失败')
      }
    } else {
      console.error('记录图书馆时间失败:', timeData.message || '未知错误')
      ElMessage.error(timeData.message || '进入图书馆失败')
    }
  } catch (error) {
    console.error('进入图书馆失败:', error)
    ElMessage.error('网络错误，请稍后重试')
  } finally {
    isLoading.value = false
  }
}

// 离开图书馆
const leaveLibrary = async () => {
  if (!recordId.value) {
    ElMessage.warning('请先点击进入按钮')
    return
  }

  if (isLoading.value) return

  try {
    console.log('离开图书馆请求参数:', { recordId: recordId.value })
    await ElMessageBox.confirm('确认离开图书馆？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    })

    isLoading.value = true

    // 1. 先调用记录图书馆时间的接口
    const timeResponse = await fetch(
      `http://localhost:8080/api/library/leave?recordId=${recordId.value}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    const timeData = await timeResponse.json()
    console.log('记录图书馆离开时间响应:', timeData)

    if (timeData.code === 200 && timeData.data !== undefined) {
      const studyMinutes = timeData.data
      console.log('离开图书馆成功，本次学习时长:', studyMinutes)
      ElMessage.success(`本次学习时长：${formatDuration(studyMinutes)}`)
      // 重置状态
      recordId.value = null
      isInLibrary.value = false
      // 保存状态到本地存储
      saveLibraryState()
      // 重新查询今日总时长
      await fetchTodayDuration()

      // 2. 再调用座位离开接口
      const seatResponse = await fetch('/api/library/seat/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const seatData = await seatResponse.json()
      console.log('座位离开响应:', seatData)

      if (seatData.code === 200) {
        ElMessage.success(seatData.message || '离开座位成功')
        // 刷新座位状态
        await fetchSeatStatus()
      } else {
        console.error('座位离开失败:', seatData.message || '未知错误')
        ElMessage.error(seatData.message || '离开座位失败')
      }
    } else {
      console.error('记录图书馆离开时间失败:', timeData.message || '未知错误')
      ElMessage.error(timeData.message || '离开图书馆失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('离开图书馆失败:', error)
      ElMessage.error('网络错误，请稍后重试')
    }
  } finally {
    isLoading.value = false
  }
}

// 查询今日总时长
const fetchTodayDuration = async () => {
  try {
    console.log('查询今日总时长请求参数:', { userId: userId.value })
    const response = await fetch(
      `http://localhost:8080/api/library/today-duration?userId=${userId.value}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    const data = await response.json()
    console.log('查询今日总时长响应:', data)

    if (data.code === 200) {
      todayDuration.value = data.data
      todayDurationText.value = formatDuration(data.data)
      console.log('查询今日总时长成功:', data.data)
    } else {
      console.error('查询今日总时长失败:', data.message)
      ElMessage.error(data.message || '查询今日总时长失败')
    }
  } catch (error) {
    console.error('查询今日总时长失败:', error)
    ElMessage.error('网络错误，请稍后重试')
  }
}

// 22:30弹窗提醒功能
const checkLibraryClosingTime = () => {
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()

  // 检查是否是22:30
  if (hour === 22 && minute === 30) {
    const hasShownClosingReminder = localStorage.getItem('libraryClosingReminder')

    if (!hasShownClosingReminder) {
      ElMessageBox.warning('图书馆即将闭馆，请及时离开', '闭馆提醒', {
        confirmButtonText: '知道了',
        cancelButtonText: '稍后提醒',
        type: 'warning',
        duration: 0,
        showClose: true,
      })
        .then(() => {
          // 标记已显示提醒
          localStorage.setItem('libraryClosingReminder', 'true')
          // 10分钟后可以再次提醒
          setTimeout(
            () => {
              localStorage.removeItem('libraryClosingReminder')
            },
            10 * 60 * 1000,
          )
        })
        .catch(() => {
          // 取消提醒，10分钟后再次提醒
          setTimeout(
            () => {
              localStorage.removeItem('libraryClosingReminder')
            },
            10 * 60 * 1000,
          )
        })
    }
  }
}

// 生命周期钩子
onMounted(async () => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
  // 加载本地存储的状态
  loadLibraryState()
  // 页面加载时查询今日总时长
  await fetchTodayDuration()
  // 页面加载时获取座位状态
  await fetchSeatStatus()

  // 启动22:30弹窗检查
  setInterval(checkLibraryClosingTime, 60000) // 每分钟检查一次
})
</script>

<style scoped>
/* 主容器 */
.library-status-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 顶部导航栏 - 复用现有样式 */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  z-index: 100;
  height: 70px;
  border-bottom: 1px solid #e5e7eb;
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
  background-color: #165dff;
  color: #fff;
  border-radius: 8px;
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
  color: #1d2129;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
}

.nav-item:hover {
  color: #165dff;
  background-color: #f0f9ff;
}

.nav-item.has-submenu::after {
  content: '▼';
  margin-left: 6px;
  font-size: 12px;
  transition: all 0.3s ease;
}

.submenu {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
  padding: 12px 0;
  min-width: 160px;
  z-index: 200;
  display: none;
}

.nav-item.has-submenu:hover .submenu {
  display: block;
}

.submenu-item {
  padding: 12px 20px;
  font-size: 14px;
  color: #1d2129;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submenu-item:hover {
  background-color: #f0f9ff;
  color: #165dff;
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
  background-color: #165dff;
  color: #fff;
  border: 1px solid #165dff;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  cursor: pointer;
}

.btn-login:hover {
  background-color: #0e46cc;
  border-color: #0e46cc;
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
  color: #1d2129;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  cursor: pointer;
}

.btn-user-center:hover {
  background-color: #f0f9ff;
  border-color: #165dff;
  color: #165dff;
}

.user-center-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
  padding: 12px 0;
  min-width: 140px;
  z-index: 200;
  margin-top: 8px;
}

.dropdown-item {
  padding: 12px 20px;
  font-size: 14px;
  color: #1d2129;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dropdown-item:hover {
  background-color: #f0f9ff;
  color: #165dff;
}

.dropdown-item.logout {
  color: #f56c6c;
}

.dropdown-item.logout:hover {
  background-color: #fef0f0;
  color: #f56c6c;
}

/* 主体内容区 */
.main-content {
  display: flex;
  margin-top: 70px;
  flex: 1;
}

/* 左侧侧边栏 */
.sidebar {
  width: 200px;
  background-color: #f5f7fa;
  border-right: 1px solid #e5e7eb;
  padding: 20px 0;
  height: calc(100vh - 70px);
  overflow-y: auto;
}

.sidebar-header {
  padding: 0 20px;
  margin-bottom: 20px;
}

.sidebar-title {
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
  margin: 0;
}

.sidebar-menu {
  display: flex;
  flex-direction: column;
}

.sidebar-item {
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  font-size: 16px;
  color: #606266;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sidebar-item:hover {
  background-color: #e6f7ff;
  color: #409eff;
}

.sidebar-item-active {
  background-color: #409eff !important;
  color: #fff !important;
}

/* 右侧内容区 */
.content {
  flex: 1;
  padding: 40px 20px;
  background-color: #fff;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 70px);
}

/* 主标题 */
.main-title {
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  margin: 0 0 40px 0;
  color: #303133;
}

/* 信息项 */
.info-item {
  margin: 20px 0;
  padding-left: 0;
  text-align: center;
}

.info-label {
  font-size: 16px;
  color: #666;
  margin-right: 10px;
}

.info-value {
  font-size: 16px;
  color: #303133;
}

/* 统计信息容器 */
.stats-container {
  display: flex;
  gap: 60px;
  margin: 30px 0;
  padding-left: 0;
  justify-content: center;
}

.stat-item {
  display: flex;
  align-items: center;
}

.stat-label {
  font-size: 16px;
  color: #666;
  margin-right: 10px;
}

.stat-value {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

/* 状态颜色 */
.status-red {
  color: #f56c6c !important;
}

.status-green {
  color: #67c23a !important;
}

/* 进入/离开按钮容器 */
.entry-button-container {
  display: flex;
  gap: 40px;
  margin: 40px 0;
  justify-content: center;
}

/* 进入/离开按钮 */
.entry-button {
  padding: 10px 30px;
  border: 1px solid #000;
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.entry-button:hover:not(.disabled) {
  background-color: #f5f7fa;
}

/* 禁用状态 */
.entry-button.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  border-color: #dcdfe6;
  color: #c0c4cc;
}

.entry-button.disabled:hover {
  background-color: #fff;
}

/* 今日总时长显示 */
.today-duration {
  margin-top: 20px;
  font-size: 16px;
  color: #303133;
  text-align: center;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 8px;
  width: fit-content;
  margin-left: auto;
  margin-right: auto;
}

/* 加载状态 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 40px 0;
  padding: 20px;
  font-size: 16px;
  color: #666;
  background-color: #f5f7fa;
  border-radius: 8px;
  width: fit-content;
  margin-left: auto;
  margin-right: auto;
}

/* 底部备注 */
.remark {
  margin-top: 40px;
  padding-left: 20px;
  font-size: 14px;
  color: #f56c6c;
  text-align: left;
}

/* 弹窗样式 */
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
  z-index: 1000;
}

.modal-content {
  background-color: #fff;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 20px 20px rgba(0, 0, 0, 0.15);
  width: 400px;
  text-align: center;
}

.modal-text {
  font-size: 18px;
  margin-bottom: 20px;
  color: #303133;
}

.modal-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.modal-btn {
  padding: 10px 30px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-btn.confirm {
  background-color: #409eff;
  color: #fff;
  border-color: #409eff;
}

.modal-btn.confirm:hover {
  background-color: #66b1ff;
  border-color: #66b1ff;
}

.modal-btn.cancel {
  background-color: #fff;
  color: #606266;
}

.modal-btn.cancel:hover {
  background-color: #f5f7fa;
  border-color: #c6e2ff;
  color: #409eff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .navbar-container {
    padding: 0 16px;
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
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
    border-top: 1px solid #e5e7eb;
    padding: 16px;
    gap: 8px;
  }

  .sidebar {
    width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
    padding: 10px 0;
  }

  .main-content {
    flex-direction: column;
  }

  .stats-container {
    flex-direction: column;
    gap: 10px;
  }

  .entry-button-container {
    flex-direction: column;
    align-items: center;
  }

  .entry-button {
    width: 200px;
  }
}
</style>
