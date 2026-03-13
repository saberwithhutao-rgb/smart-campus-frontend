<template>
  <div class="competition-management">
    <GlobalNavbar />

    <!-- 主体内容区 -->
    <div class="main-content">
      <!-- 左侧垂直导航栏 -->
      <aside class="sidebar">
        <div class="sidebar-menu">
          <!-- 竞赛管理 -->
          <div class="sidebar-section">
            <h3 class="section-title">竞赛相关</h3>
            <div class="sidebar-item active">
              <span class="item-icon">🏆</span>
              <span class="item-text">竞赛管理</span>
            </div>
            <div class="sidebar-item" @click="goToCareerNavigation">
              <span class="item-icon">🎯</span>
              <span class="item-text">职业导航</span>
            </div>
          </div>

          <!-- 考研支持 -->
          <div class="sidebar-section">
            <h3 class="section-title">考研支持</h3>
            <div class="sidebar-item" @click="goToExamSupport">
              <span class="item-icon">📖</span>
              <span class="item-text">考研支持</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- 右侧主内容区 -->
      <main class="content-area">
        <!-- 页面标题 -->
        <h1 class="page-title">竞赛管理</h1>

        <!-- 筛选和搜索区 -->
        <div class="filter-section">
          <div class="filter-row">
            <!-- 竞赛类型筛选 -->
            <div class="filter-item">
              <span class="filter-label">竞赛类型:</span>
              <select
                class="filter-select"
                v-model="filterParams.type"
                @change="handleFilterChange"
              >
                <option value="">全部</option>
                <option value="programming">程序设计</option>
                <option value="math">数学建模</option>
                <option value="design">创意设计</option>
                <option value="other">其他</option>
              </select>
            </div>

            <!-- 状态筛选 -->
            <div class="filter-item">
              <span class="filter-label">状态:</span>
              <select
                class="filter-select"
                v-model="filterParams.status"
                @change="handleFilterChange"
              >
                <option value="">全部</option>
                <option value="ongoing">进行中</option>
                <option value="upcoming">即将开始</option>
                <option value="completed">已结束</option>
              </select>
            </div>

            <!-- 级别筛选 -->
            <div class="filter-item">
              <span class="filter-label">级别:</span>
              <select
                class="filter-select"
                v-model="filterParams.level"
                @change="handleFilterChange"
              >
                <option value="">全部</option>
                <option value="national">国家级</option>
                <option value="provincial">省级</option>
                <option value="school">校级</option>
              </select>
            </div>

            <!-- 搜索框 -->
            <div class="search-box">
              <input
                type="text"
                placeholder="搜索竞赛名称..."
                class="search-input"
                v-model="filterParams.name"
                @keyup.enter="handleSearch"
              />
              <button class="search-btn" @click="handleSearch">🔍</button>
            </div>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>

        <!-- 错误提示 -->
        <div v-if="error" class="error-container">
          <p>{{ error }}</p>
          <button class="retry-btn" @click="fetchCompetitions">重试</button>
        </div>

        <!-- 竞赛列表 -->
        <div v-if="!loading && !error" class="competition-list">
          <!-- 竞赛项 -->
          <div
            class="competition-item"
            v-for="competition in filteredCompetitions"
            :key="competition.id"
          >
            <div class="competition-header">
              <div class="competition-info">
                <div class="competition-name">
                  <span class="competition-title">{{ competition.name }}</span>
                </div>
                <p class="competition-description">{{ competition.description }}</p>
              </div>
              <div class="competition-actions">
                <button
                  class="btn-action primary"
                  :disabled="competition.status === 'completed'"
                  @click="joinCompetition(competition)"
                >
                  {{
                    competition.status === 'completed'
                      ? '已结束'
                      : competition.status === 'active' || competition.status === 'ongoing'
                        ? '前往官网'
                        : '立即报名'
                  }}
                </button>
                <button class="btn-action secondary" @click="viewCompetitionDetail(competition.id)">
                  {{ competition.status === 'completed' ? '查看结果' : '查看详情' }}
                </button>
              </div>
            </div>
            <div class="competition-meta">
              <div class="meta-item">
                <span class="meta-label">时间:</span>
                <span class="meta-value">{{ competition.competitionTime }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">时长:</span>
                <span class="meta-value">{{ competition.duration }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">地点:</span>
                <span class="meta-value">{{ competition.location }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">级别:</span>
                <span class="meta-value">{{ getLevelText(competition.level) }}</span>
              </div>
              <div class="meta-tags">
                <span class="tag" v-for="tag in competition.tags" :key="tag">{{ tag }}</span>
                <span class="tag" :class="competition.status">{{
                  getStatusText(competition.status)
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import GlobalNavbar from '@/components/GlobalNavbar.vue'
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'
import type { Competition, CompetitionListParams } from '../types/competition'

// 路由实例
const router = useRouter()

const isMobile = ref(false)

// 竞赛数据
const competitions = ref<Competition[]>([])
const loading = ref(false)
const error = ref('')

// 筛选参数
const filterParams = ref({
  name: '',
  type: '',
  status: '',
  level: '',
})

// 映射函数 - 将英文值映射为中文显示
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    ongoing: '进行中',
    upcoming: '即将开始',
    completed: '已结束',
    active: '进行中',
    进行中: '进行中',
    即将开始: '即将开始',
    已结束: '已结束',
  }
  return statusMap[status] || status
}

const getTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    programming: '程序设计',
    math: '数学建模',
    design: '创意设计',
    other: '其他',
    程序设计: '程序设计',
    数学建模: '数学建模',
    创意设计: '创意设计',
    学术竞赛: '学术竞赛',
  }
  return typeMap[type] || type
}

const getLevelText = (level: string) => {
  const levelMap: Record<string, string> = {
    national: '国家级',
    provincial: '省级',
    school: '校级',
    国家级: '国家级',
    省级: '省级',
    校级: '校级',
  }
  return levelMap[level] || level
}

// 映射函数 - 将中文值映射为英文参数
const getStatusValue = (status: string) => {
  const statusMap: Record<string, string> = {
    进行中: 'ongoing',
    即将开始: 'upcoming',
    已结束: 'completed',
    ongoing: 'ongoing',
    upcoming: 'upcoming',
    completed: 'completed',
  }
  return statusMap[status] || status
}

const getTypeValue = (type: string) => {
  const typeMap: Record<string, string> = {
    程序设计: 'programming',
    数学建模: 'math',
    创意设计: 'design',
    学术竞赛: 'other',
    programming: 'programming',
    math: 'math',
    design: 'design',
    other: 'other',
  }
  return typeMap[type] || type
}

const getLevelValue = (level: string) => {
  const levelMap: Record<string, string> = {
    国家级: 'national',
    省级: 'provincial',
    校级: 'school',
    national: 'national',
    provincial: 'provincial',
    school: 'school',
  }
  return levelMap[level] || level
}

// 计算属性 - 根据筛选参数过滤竞赛
const filteredCompetitions = computed(() => {
  return competitions.value.filter((comp) => {
    const matchName = !filterParams.value.name || comp.name.includes(filterParams.value.name)
    const matchType =
      !filterParams.value.type ||
      comp.type === getTypeText(filterParams.value.type) ||
      comp.type === filterParams.value.type
    const matchStatus =
      !filterParams.value.status ||
      comp.status === getStatusText(filterParams.value.status) ||
      comp.status === filterParams.value.status
    const matchLevel =
      !filterParams.value.level ||
      comp.level === getLevelText(filterParams.value.level) ||
      comp.level === filterParams.value.level
    return matchName && matchType && matchStatus && matchLevel
  })
})

// 获取竞赛列表
const fetchCompetitions = async () => {
  loading.value = true
  error.value = ''
  try {
    const params: CompetitionListParams = {}

    if (filterParams.value.name) {
      params.name = filterParams.value.name
    }
    if (filterParams.value.type) {
      params.type = getTypeValue(filterParams.value.type)
    }
    if (filterParams.value.status) {
      params.status = getStatusValue(filterParams.value.status)
    }
    if (filterParams.value.level) {
      params.level = getLevelValue(filterParams.value.level)
    }

    const response = await api.getCompetitions(Object.keys(params).length > 0 ? params : undefined)
    if (response.code === 1) {
      competitions.value = response.data
    } else {
      error.value = response.msg || '获取竞赛列表失败'
    }
  } catch (err) {
    error.value = '网络错误，请稍后重试'
    console.error('获取竞赛列表失败:', err)
  } finally {
    loading.value = false
  }
}

// 处理搜索
const handleSearch = () => {
  fetchCompetitions()
}

// 处理筛选变化
const handleFilterChange = () => {
  fetchCompetitions()
}

// 查看竞赛详情
const viewCompetitionDetail = (id: number) => {
  router.push(`/career/competitions/${id}`)
}

// 加入竞赛
const joinCompetition = (competition: Competition) => {
  if (competition.officialWebsite) {
    window.open(competition.officialWebsite, '_blank')
  } else {
    alert('该竞赛暂无官方网站')
  }
}

// 检查屏幕尺寸 - 响应式设计
const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 1024
}

// 跳转到职业导航页面
const goToCareerNavigation = () => {
  router.push('/career/position')
}

// 跳转到考研支持页面
const goToExamSupport = () => {
  router.push('/career/pee')
}

// 生命周期钩子 - 初始化和窗口大小监听
onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
  fetchCompetitions()
})
</script>

<style scoped>
/* 主容器 */
.competition-management {
  min-height: 100vh;
  background-color: #f5f7fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  display: flex;
  flex-direction: column;
}

/* 顶部导航栏 */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: var(--white);
  box-shadow: var(--shadow-sm);
  z-index: 100;
  border-bottom: 1px solid var(--border-color-light);
}

.navbar-container {
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 70px;
}

/* Logo区域 */
.logo {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.logo-placeholder {
  padding: 8px 16px;
  background-color: var(--primary-color);
  color: var(--white);
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

.nav-item.has-submenu::after {
  content: '▼';
  margin-left: 6px;
  font-size: 12px;
  transition: var(--transition);
}

/* 子菜单悬浮层 */
.submenu {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: var(--white);
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

/* 移动端子菜单 */
.mobile-submenu {
  background-color: var(--bg-color-light);
  border-radius: var(--border-radius-md);
  margin-top: 8px;
  padding: 8px 0;
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
  color: var(--white);
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
  color: var(--white);
  border: 1px solid var(--primary-color);
  border-radius: var(--border-radius-md);
  font-size: 14px;
  font-weight: 500;
  transition: var(--transition);
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
  background-color: var(--white);
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
  color: var(--white);
}

.dropdown-item.logout {
  color: var(--accent-color);
}

.dropdown-item.logout:hover {
  background-color: var(--accent-color);
  color: var(--white);
}

/* 响应式设计 */
@media (max-width: 768px) {
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
    background-color: var(--white);
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

/* 主体内容区 */
.main-content {
  display: flex;
  flex: 1;
  margin-top: 60px;
  position: relative;
}

/* 左侧垂直导航栏 */
.sidebar {
  width: 220px;
  background-color: white;
  border-right: 1px solid #e0e6ed;
  padding: 20px 0;
  height: calc(100vh - 60px);
  overflow-y: auto;
  position: fixed;
  left: 0;
  top: 60px;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
}

.sidebar-menu {
  padding: 0 16px;
}

.sidebar-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #646b7a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
  padding: 0 8px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  color: #333;
}

.sidebar-item:hover {
  background-color: #f0f9ff;
  color: #409eff;
}

.sidebar-item.active {
  background-color: #f0f9ff;
  color: #409eff;
  font-weight: 500;
}

.item-icon {
  font-size: 16px;
}

/* 右侧主内容区 */
.content-area {
  margin-left: 220px;
  flex: 1;
  padding: 24px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

/* 页面标题 */
.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 24px 0;
}

/* 筛选和搜索区 */
.filter-section {
  background-color: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 14px;
  color: #646b7a;
  font-weight: 500;
}

.filter-select {
  padding: 6px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  color: #333;
  background-color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-select:hover {
  border-color: #409eff;
}

/* 搜索框 */
.search-box {
  display: flex;
  gap: 0;
  margin-left: auto;
}

.search-input {
  padding: 6px 12px;
  border: 1px solid #dcdfe6;
  border-right: none;
  border-radius: 4px 0 0 4px;
  font-size: 14px;
  color: #333;
  width: 200px;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #409eff;
}

.search-btn {
  padding: 6px 12px;
  background-color: #409eff;
  color: white;
  border: 1px solid #409eff;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.search-btn:hover {
  background-color: #66b1ff;
  border-color: #66b1ff;
}

/* 竞赛列表 */
.competition-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.competition-item {
  background-color: white;
  border: 1px solid #e0e6ed;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.competition-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #409eff;
}

.competition-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.competition-info {
  flex: 1;
  min-width: 0;
}

.competition-name {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.competition-icon {
  font-size: 18px;
  font-weight: bold;
  color: #409eff;
}

.competition-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.competition-description {
  font-size: 14px;
  color: #646b7a;
  margin: 0;
  line-height: 1.5;
}

.competition-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-action {
  padding: 6px 16px;
  border: 1px solid transparent;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 100px;
}

.btn-action.primary {
  background-color: #409eff;
  color: white;
  border-color: #409eff;
}

.btn-action.primary:hover:not(:disabled) {
  background-color: #66b1ff;
  border-color: #66b1ff;
}

.btn-action.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #c0c4cc;
  border-color: #c0c4cc;
  color: white;
}

.btn-action.secondary {
  background-color: transparent;
  color: #646b7a;
  border-color: #dcdfe6;
}

.btn-action.secondary:hover {
  background-color: #f0f9ff;
  border-color: #409eff;
  color: #409eff;
}

/* 竞赛元信息 */
.competition-meta {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #646b7a;
  padding-top: 12px;
  border-top: 1px solid #f0f2f5;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-label {
  font-size: 12px;
  color: #909399;
}

.meta-value {
  color: #646b7a;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #646b7a;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 错误状态 */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #f56c6c;
  gap: 16px;
}

.retry-btn {
  padding: 8px 20px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background-color: #66b1ff;
}

.meta-tags {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.tag {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background-color: #ecf5ff;
  color: #409eff;
}

.tag.ongoing {
  background-color: #f0f9eb;
  color: #67c23a;
}

.tag.upcoming {
  background-color: #ecf5ff;
  color: #409eff;
}

.tag.completed {
  background-color: #f5f7fa;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .sidebar {
    width: 200px;
  }

  .content-area {
    margin-left: 200px;
  }
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 99;
  }

  .content-area {
    margin-left: 0;
    padding: 16px;
  }

  .filter-row {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .search-box {
    margin-left: 0;
  }

  .competition-header {
    flex-direction: column;
    gap: 16px;
  }

  .competition-actions {
    flex-direction: row;
  }

  .competition-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .meta-tags {
    margin-left: 0;
  }
}
</style>
