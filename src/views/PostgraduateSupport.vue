<template>
  <div class="postgraduate-support">
    <GlobalNavbar />

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 左侧功能栏 -->
      <aside class="sidebar">
        <div class="sidebar-menu">
          <!-- 竞赛管理 -->
          <div class="sidebar-section">
            <h3 class="section-title">竞赛相关</h3>
            <div class="sidebar-item" @click="router.push('/career/competitions')">
              <span class="item-icon">🏆</span>
              <span class="item-text">竞赛管理</span>
            </div>
            <div class="sidebar-item" @click="router.push('/career/position')">
              <span class="item-icon">🎯</span>
              <span class="item-text">职业导航</span>
            </div>
          </div>

          <!-- 考研支持 -->
          <div class="sidebar-section">
            <h3 class="section-title">考研支持</h3>
            <div class="sidebar-item active">
              <span class="item-icon">📖</span>
              <span class="item-text">考研支持</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- 右侧主内容区 -->
      <main class="content-area">
        <!-- 页面标题 -->
        <h1 class="page-title">考研支持</h1>

        <!-- 顶部统计卡片 -->
        <div class="top-cards">
          <!-- 考试时间卡片 -->
          <div class="card">
            <div class="card-header">
              <span class="card-icon">📅</span>
              <span class="card-title">考试时间</span>
            </div>
            <div class="card-content">
              <p class="exam-name">2024年全国硕士研究生招生考试</p>
              <p class="exam-date">2023-12-23 至 2023-12-24</p>
              <p class="countdown">倒计时：<span class="countdown-days">35天</span></p>
            </div>
          </div>

          <!-- 院校选择卡片 -->
          <div class="card">
            <div class="card-header">
              <span class="card-icon">🏫</span>
              <span class="card-title">院校选择</span>
            </div>
            <div class="card-content">
              <p class="selected-schools">已收藏的院校</p>
              <p class="school-count">{{ favoriteCount }}所</p>
              <button class="view-favorites-btn" @click="showFavorites = true">查看收藏</button>
            </div>
          </div>

          <!-- 学习进度卡片 -->
          <div class="card">
            <div class="card-header">
              <span class="card-icon">📊</span>
              <span class="card-title">学习进度</span>
            </div>
            <div class="card-content">
              <p class="current-progress">当前学习进度</p>
              <div class="progress-bar">
                <div class="progress-fill" style="width: 65%"></div>
              </div>
              <div class="subject-progress">
                <div class="subject">
                  <span class="subject-name">政治:</span>
                  <span class="subject-value">65%</span>
                </div>
                <div class="subject">
                  <span class="subject-name">英语:</span>
                  <span class="subject-value">70%</span>
                </div>
                <div class="subject">
                  <span class="subject-name">数学:</span>
                  <span class="subject-value">65%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 院校选择区域 -->
        <div class="school-selection">
          <h2 class="section-title">院校选择</h2>

          <!-- 筛选条件 -->
          <div class="filter-section">
            <div class="filter-row">
              <div class="filter-item">
                <label>地区：</label>
                <select class="filter-select" v-model="filterParams.province">
                  <option value="">全部地区</option>
                  <option value="北京市">北京市</option>
                  <option value="上海市">上海市</option>
                  <option value="广东省">广东省</option>
                  <option value="深圳市">深圳市</option>
                </select>
              </div>
              <div class="filter-item">
                <label>学科：</label>
                <select class="filter-select" v-model="filterParams.institutionType">
                  <option value="">全部学科</option>
                  <option value="综合类">综合类</option>
                  <option value="理工类">理工类</option>
                  <option value="文史类">文史类</option>
                  <option value="医学类">医学类</option>
                </select>
              </div>
              <div class="filter-item">
                <label>学校类型：</label>
                <select class="filter-select" v-model="filterParams.is985">
                  <option value="">全部类型</option>
                  <option value="true">985工程</option>
                  <option value="false">非985</option>
                </select>
              </div>
            </div>
            <div class="filter-row">
              <div class="filter-item">
                <label>211工程：</label>
                <select class="filter-select" v-model="filterParams.is211">
                  <option value="">全部</option>
                  <option value="true">211工程</option>
                  <option value="false">非211</option>
                </select>
              </div>
              <div class="filter-item">
                <label>双一流：</label>
                <select class="filter-select" v-model="filterParams.isDoubleFirstClass">
                  <option value="">全部</option>
                  <option value="true">双一流</option>
                  <option value="false">非双一流</option>
                </select>
              </div>
              <div class="filter-item">
                <label>专业：</label>
                <input
                  type="text"
                  class="filter-input"
                  placeholder="输入专业名称..."
                  v-model="filterParams.keyword"
                  @keyup.enter="handleSearch"
                />
              </div>
            </div>
            <div class="filter-actions">
              <button class="filter-btn" @click="handleSearch">搜索院校</button>
              <button class="reset-btn" @click="handleReset">重置筛选</button>
            </div>
          </div>

          <!-- 院校列表 -->
          <div class="school-list">
            <!-- 加载状态 -->
            <div v-if="loading" class="loading-container">
              <div class="loading-spinner"></div>
              <p>加载中...</p>
            </div>

            <!-- 错误提示 -->
            <div v-if="error" class="error-container">
              <p>{{ error }}</p>
              <button class="retry-btn" @click="fetchUniversities">重试</button>
            </div>

            <!-- 院校项 -->
            <template v-if="!loading && !error">
              <div class="school-item" v-for="university in universities" :key="university.id">
                <div class="school-header">
                  <div class="school-info">
                    <div class="school-name">
                      <span class="school-icon">🏫</span>
                      <span class="school-title">{{ university.name }}</span>
                      <span class="school-short">({{ university.shortName }})</span>
                    </div>
                    <div class="school-tags">
                      <span v-if="university.is985" class="tag">985</span>
                      <span v-if="university.is211" class="tag">211</span>
                      <span v-if="university.isDoubleFirstClass" class="tag">双一流</span>
                      <span class="tag location"
                        >{{ university.province }} {{ university.city }}</span
                      >
                    </div>
                  </div>
                  <div class="school-actions">
                    <button
                      class="collect-btn"
                      :class="{ active: isFavorite(university.id) }"
                      @click="toggleFavorite(university)"
                    >
                      {{ isFavorite(university.id) ? '已收藏' : '收藏' }}
                    </button>
                    <button
                      v-if="university.officialWebsite"
                      class="website-btn"
                      @click="goToOfficialWebsite(university.officialWebsite)"
                    >
                      官网
                    </button>
                  </div>
                </div>
                <div class="school-details">
                  <div class="detail-item">
                    <span class="detail-label">院校代码：</span>
                    <span class="detail-value">{{ university.code }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">院校类型：</span>
                    <span class="detail-value">{{ university.institutionType }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">培养层次：</span>
                    <span class="detail-value">
                      <span v-if="university.hasDoctorate">博士点</span>
                      <span v-if="university.hasMaster">硕士点</span>
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">标签：</span>
                    <span class="detail-value tags">
                      <span class="tag" v-for="tag in parseTags(university.tags)" :key="tag">{{
                        tag
                      }}</span>
                    </span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- 收藏列表弹窗 -->
        <div v-if="showFavorites" class="favorites-modal" @click.self="closeFavorites">
          <div class="favorites-content" @click.stop>
            <div class="favorites-header">
              <h3 class="favorites-title">我的收藏院校</h3>
              <button class="close-btn" @click="closeFavorites">×</button>
            </div>
            <div class="favorites-body">
              <div v-if="loading" class="loading-container">
                <div class="loading-spinner"></div>
                <p>加载中...</p>
              </div>
              <div v-if="error" class="error-container">
                <p>{{ error }}</p>
                <button class="retry-btn" @click="fetchFavoriteUniversities">重试</button>
              </div>
              <div
                v-if="!loading && !error && favoriteUniversities.length === 0"
                class="empty-state"
              >
                <p>暂无收藏院校</p>
              </div>
              <div
                v-if="!loading && !error && favoriteUniversities.length > 0"
                class="favorites-list"
              >
                <div
                  class="favorite-item"
                  v-for="university in favoriteUniversities"
                  :key="university.id"
                >
                  <div class="favorite-info">
                    <div class="favorite-name">
                      <span class="school-icon">🏫</span>
                      <span class="name">{{ university.name }}</span>
                      <span class="short">({{ university.shortName }})</span>
                    </div>
                    <div class="favorite-tags">
                      <span v-if="university.is985" class="tag">985</span>
                      <span v-if="university.is211" class="tag">211</span>
                      <span v-if="university.isDoubleFirstClass" class="tag">双一流</span>
                      <span class="tag location"
                        >{{ university.province }} {{ university.city }}</span
                      >
                    </div>
                  </div>
                  <div class="favorite-actions">
                    <button
                      v-if="university.officialWebsite"
                      class="website-btn"
                      @click="goToOfficialWebsite(university.officialWebsite)"
                    >
                      官网
                    </button>
                    <button class="unfavorite-btn" @click="toggleFavorite(university)">
                      取消收藏
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 考研资源区域 -->
        <div class="resources-section">
          <h2 class="section-title">考研资源</h2>

          <!-- 资源标签页 -->
          <div class="resource-tabs">
            <button class="tab-btn active">公共课</button>
            <button class="tab-btn">专业课</button>
            <button class="tab-btn">真题</button>
            <button class="tab-btn">资料下载</button>
          </div>

          <!-- 资源列表 -->
          <div class="resource-list">
            <div class="empty-state">
              <p>资源功能开发中...</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import GlobalNavbar from '../components/GlobalNavbar.vue'
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { api } from '../api'
import type { University, UniversityListDetail } from '../types/university'

// 路由实例
const router = useRouter()

// 用户状态管理
const userStore = useUserStore()

// 检查屏幕尺寸 - 响应式设计
const isMobile = ref(false)
const showUserCenter = ref(false)

// 院校数据
const universities = ref<University[]>([])
const loading = ref(false)
const error = ref('')

// 收藏的院校ID列表
const favoriteUniversityIds = ref<number[]>([])
const favoriteUniversities = ref<University[]>([])
const showFavorites = ref(false)

// 筛选参数
const filterParams = ref({
  province: '',
  city: '',
  institutionType: '',
  is985: '',
  is211: '',
  isDoubleFirstClass: '',
  keyword: '',
})

// 计算属性 - 获取已收藏院校数量
const favoriteCount = computed(() => favoriteUniversityIds.value.length)

// 获取院校列表
const fetchUniversities = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await api.getUniversities()
    if (response.code === 1) {
      universities.value = response.data
    } else {
      error.value = response.msg || '获取院校列表失败'
    }
  } catch (err) {
    error.value = '网络错误，请稍后重试'
    console.error('获取院校列表失败:', err)
  } finally {
    loading.value = false
  }
}

// 获取收藏的院校ID列表
const fetchFavoriteIds = async () => {
  try {
    const response = await api.getFavoriteUniversityIds()
    if (response.code === 1) {
      favoriteUniversityIds.value = response.data
    }
  } catch (err) {
    console.error('获取收藏列表失败:', err)
  }
}

// 获取收藏的院校详细列表
const fetchFavoriteUniversities = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await api.getFavoriteUniversities()
    if (response.code === 1) {
      favoriteUniversities.value = universities.value.filter((u) =>
        response.data.some((f: UniversityListDetail) => f.universityId === u.id),
      )
    } else {
      error.value = response.msg || '获取收藏列表失败'
    }
  } catch (err) {
    error.value = '网络错误，请稍后重试'
    console.error('获取收藏列表失败:', err)
  } finally {
    loading.value = false
  }
}

// 切换收藏状态
const toggleFavorite = async (university: University) => {
  try {
    const response = await api.toggleFavoriteUniversity(university.id)
    if (response.code === 1) {
      const isFavorited = favoriteUniversityIds.value.includes(university.id)
      if (isFavorited) {
        favoriteUniversityIds.value = favoriteUniversityIds.value.filter(
          (id) => id !== university.id,
        )
      } else {
        favoriteUniversityIds.value.push(university.id)
      }
    } else {
      alert(response.message || '操作失败')
    }
  } catch (err) {
    alert('操作失败，请稍后重试')
    console.error('切换收藏状态失败:', err)
  }
}

// 判断是否已收藏
const isFavorite = (universityId: number) => {
  return favoriteUniversityIds.value.includes(universityId)
}

// 解析标签字符串
const parseTags = (tags: string) => {
  try {
    const parsed = JSON.parse(tags.replace(/\\/g, '"'))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// 处理搜索
const handleSearch = () => {
  fetchUniversities()
}

// 处理重置
const handleReset = () => {
  filterParams.value = {
    province: '',
    city: '',
    institutionType: '',
    is985: '',
    is211: '',
    isDoubleFirstClass: '',
    keyword: '',
  }
  fetchUniversities()
}

// 跳转到官网
const goToOfficialWebsite = (url: string) => {
  if (url) {
    window.open(url, '_blank')
  }
}

// 关闭收藏列表
const closeFavorites = () => {
  showFavorites.value = false
}

const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 1024
}

// 生命周期钩子 - 初始化和窗口大小监听
onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
  fetchUniversities()
  fetchFavoriteIds()
})

// 监听收藏列表显示状态
watch(showFavorites, (newVal) => {
  if (newVal) {
    fetchFavoriteUniversities()
  }
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

/* 主容器 */
.postgraduate-support {
  min-height: 100vh;
  background-color: var(--bg-color);
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

.nav-item.has-submenu {
  position: relative;
}

.nav-item.has-submenu::after {
  content: '▼';
  margin-left: 6px;
  font-size: 12px;
}

/* 子菜单 */
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
  z-index: 101;
  display: none;
}

.nav-item.has-submenu:hover .submenu {
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

.dropdown-item.logout {
  color: var(--accent-color);
}

.dropdown-item.logout:hover {
  background-color: var(--accent-color);
  color: #fff;
}

/* 主体内容区 */
.main-content {
  display: flex;
  flex: 1;
  margin-top: 70px;
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

.sidebar-section h3.section-title {
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

/* 顶部统计卡片 */
.top-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 32px;
}

.card {
  background-color: white;
  border: 1px solid #e0e6ed;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.card-icon {
  font-size: 20px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 考试时间卡片 */
.exam-name {
  font-size: 14px;
  color: #646b7a;
  margin: 0;
}

.exam-date {
  font-size: 14px;
  color: #333;
  margin: 0;
}

.countdown {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.countdown-days {
  color: #f53f3f;
  font-size: 18px;
}

/* 院校选择卡片 */
.selected-schools {
  font-size: 14px;
  color: #646b7a;
  margin: 0;
}

.school-count {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.view-favorites-btn {
  padding: 6px 12px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 8px;
}

.view-favorites-btn:hover {
  background-color: #66b1ff;
}

/* 学习进度卡片 */
.current-progress {
  font-size: 14px;
  color: #333;
  margin: 0;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #ecf5ff;
  border-radius: 4px;
  overflow: hidden;
  margin: 8px 0;
}

.progress-fill {
  height: 100%;
  background-color: #409eff;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.subject-progress {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.subject {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #333;
}

/* 院校选择区域 */
.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 20px 0;
}

/* 筛选区域 */
.filter-section {
  background-color: white;
  border: 1px solid #e0e6ed;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.filter-row {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-item label {
  font-size: 14px;
  color: #333;
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

.filter-input {
  padding: 6px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  color: #333;
  width: 200px;
  transition: all 0.3s ease;
}

.filter-input:focus {
  outline: none;
  border-color: #409eff;
}

.filter-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.filter-btn {
  padding: 8px 20px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  background-color: #66b1ff;
}

.reset-btn {
  padding: 8px 20px;
  background-color: transparent;
  color: #646b7a;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.reset-btn:hover {
  background-color: #f0f9ff;
  border-color: #409eff;
  color: #409eff;
}

/* 院校列表 */
.school-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
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

.school-item {
  background-color: white;
  border: 1px solid #e0e6ed;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.school-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border-color: #409eff;
}

.school-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.school-info {
  flex: 1;
  min-width: 0;
}

.school-name {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.school-short {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.school-icon {
  font-size: 18px;
}

.school-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.school-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background-color: #ecf5ff;
  color: #409eff;
}

.tag.location {
  background-color: #f0f9eb;
  color: #67c23a;
}

.school-actions {
  display: flex;
  gap: 8px;
}

.compare-btn,
.collect-btn {
  padding: 6px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: transparent;
  color: #646b7a;
}

.collect-btn.active {
  background-color: #f53f3f;
  border-color: #f53f3f;
  color: white;
}

.website-btn {
  padding: 6px 12px;
  border: 1px solid #409eff;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: transparent;
  color: #409eff;
}

.website-btn:hover {
  background-color: #409eff;
  color: white;
}

.compare-btn:hover,
.collect-btn:hover {
  background-color: #f0f9ff;
  border-color: #409eff;
  color: #409eff;
}

.school-details {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.detail-item {
  display: flex;
  gap: 8px;
  font-size: 14px;
  color: #646b7a;
}

.detail-label {
  font-weight: 500;
}

.detail-value {
  color: #333;
}

/* 考研资源区域 */
.resources-section {
  margin-top: 40px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.resource-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  border-bottom: 1px solid #e0e6ed;
  padding-bottom: 12px;
}

.tab-btn {
  padding: 8px 20px;
  background-color: transparent;
  color: #646b7a;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn.active {
  background-color: #409eff;
  color: white;
}

.tab-btn:hover:not(.active) {
  background-color: #f0f9ff;
  color: #409eff;
}

.resource-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.resource-item {
  background-color: white;
  border: 1px solid #e0e6ed;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.resource-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border-color: #409eff;
}

.resource-info {
  flex: 1;
  min-width: 0;
  margin-right: 20px;
}

.resource-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.resource-icon {
  font-size: 18px;
}

.resource-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.resource-description {
  font-size: 14px;
  color: #646b7a;
  margin: 0 0 8px 0;
  line-height: 1.5;
}

.resource-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #86909c;
  flex-wrap: wrap;
}

.resource-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.download-btn,
.collect-btn,
.share-btn {
  padding: 8px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: transparent;
  color: #646b7a;
}

.download-btn:hover,
.collect-btn:hover,
.share-btn:hover {
  background-color: #f0f9ff;
  border-color: #409eff;
  color: #409eff;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .top-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 收藏列表弹窗 */
.favorites-modal {
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

.favorites-content {
  background-color: white;
  border-radius: 8px;
  max-width: 800px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.favorites-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e6ed;
}

.favorites-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #909399;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  color: #f53f3f;
}

.favorites-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.favorites-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.favorite-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #e0e6ed;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.favorite-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-color: #409eff;
}

.favorite-info {
  flex: 1;
}

.favorite-name {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.favorite-name .name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.favorite-name .short {
  font-size: 12px;
  color: #909399;
}

.favorite-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.favorite-actions {
  display: flex;
  gap: 8px;
}

.unfavorite-btn {
  padding: 6px 12px;
  border: 1px solid #f53f3f;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: transparent;
  color: #f53f3f;
}

.unfavorite-btn:hover {
  background-color: #f53f3f;
  color: white;
}

@media (max-width: 1024px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 99;
  }

  .content-area {
    margin-left: 0;
    padding: 16px;
  }

  .top-cards {
    grid-template-columns: 1fr;
  }
}

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
    background-color: #2c3e50;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    padding: 16px;
    gap: 8px;
  }

  .navbar-container {
    padding: 0 16px;
  }

  .nav-actions {
    gap: 8px;
  }

  .btn-login,
  .btn-user-center {
    padding: 6px 12px;
    font-size: 13px;
  }

  .school-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .school-actions {
    align-self: flex-end;
  }

  .resource-item {
    flex-direction: column;
    gap: 16px;
  }

  .resource-actions {
    flex-direction: row;
    justify-content: flex-end;
  }
}
</style>
