<template>
  <div class="competition-detail">
    <GlobalNavbar />

    <!-- 主体内容区 -->
    <div class="main-content">
      <!-- 左侧垂直导航栏 -->
      <aside class="sidebar">
        <div class="sidebar-menu">
          <!-- 竞赛管理 -->
          <div class="sidebar-section">
            <h3 class="section-title">竞赛相关</h3>
            <div class="sidebar-item" @click="goToCompetitionManagement">
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
        <!-- 返回按钮 -->
        <div class="back-button" @click="goToCompetitionManagement">
          <span>← 返回竞赛列表</span>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>

        <!-- 错误提示 -->
        <div v-if="error" class="error-container">
          <p>{{ error }}</p>
          <button class="retry-btn" @click="fetchCompetitionDetail">重试</button>
        </div>

        <!-- 竞赛详情内容 -->
        <div v-if="!loading && !error && competition" class="detail-container">
          <!-- 竞赛基本信息 -->
          <div class="competition-header">
            <h1 class="competition-title">{{ competition.name }}</h1>
            <div class="competition-badges">
              <span class="badge type">{{ getTypeText(competition.type) }}</span>
              <span class="badge level">{{ getLevelText(competition.level) }}</span>
              <span class="badge" :class="competition.status">{{
                getStatusText(competition.status)
              }}</span>
            </div>
          </div>

          <!-- 竞赛描述 -->
          <div class="section">
            <h2 class="section-title">竞赛简介</h2>
            <p class="description">{{ competition.description }}</p>
          </div>

          <!-- 竞赛信息 -->
          <div class="section">
            <h2 class="section-title">竞赛信息</h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">竞赛时间</span>
                <span class="info-value">{{ competition.competitionTime }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">竞赛时长</span>
                <span class="info-value">{{ competition.duration }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">竞赛地点</span>
                <span class="info-value">{{ competition.location }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">报名截止</span>
                <span class="info-value">{{ competition.registrationDeadline }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">主办方</span>
                <span class="info-value">{{ competition.organizer }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">联系方式</span>
                <span class="info-value">{{ competition.contact }}</span>
              </div>
            </div>
          </div>

          <!-- 竞赛标签 -->
          <div class="section">
            <h2 class="section-title">竞赛标签</h2>
            <div class="tags-container">
              <span class="tag" v-for="tag in competition.tags" :key="tag">{{ tag }}</span>
            </div>
          </div>

          <!-- 参赛要求 -->
          <div class="section">
            <h2 class="section-title">参赛要求</h2>
            <p class="requirements">{{ competition.requirements }}</p>
          </div>

          <!-- 竞赛规则 -->
          <div class="section">
            <h2 class="section-title">竞赛规则</h2>
            <div v-if="rules.length > 0" class="rules-container">
              <div
                v-for="rule in rules"
                :key="rule.id"
                class="rule-item"
                :class="{ required: rule.required }"
              >
                <div class="rule-header">
                  <span class="rule-category">{{ getCategoryText(rule.category) }}</span>
                  <span v-if="rule.required" class="rule-required">必读</span>
                </div>
                <h3 class="rule-title">{{ rule.title }}</h3>
                <div class="rule-content">{{ rule.content }}</div>
              </div>
            </div>
            <div v-else class="no-rules">
              <p>暂无规则信息</p>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="action-buttons">
            <button
              class="btn-primary"
              :disabled="competition.status === 'completed'"
              @click="joinCompetition"
            >
              {{
                competition.status === 'completed'
                  ? '已结束'
                  : competition.status === 'active' || competition.status === 'ongoing'
                    ? '前往官网'
                    : '立即报名'
              }}
            </button>
            <button class="btn-secondary" @click="goToCompetitionManagement">返回列表</button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import GlobalNavbar from '@/components/GlobalNavbar.vue'
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '../api'
import type { Competition, CompetitionRule } from '../types/competition'

const router = useRouter()
const route = useRoute()

const isMobile = ref(false)

const competition = ref<Competition | null>(null)
const rules = ref<CompetitionRule[]>([])
const loading = ref(false)
const error = ref('')

const competitionId = ref<number>(Number(route.params.id))

const fetchCompetitionDetail = async () => {
  loading.value = true
  error.value = ''
  try {
    const [competitionsResponse, rulesResponse] = await Promise.all([
      api.getCompetitions(),
      api.getCompetitionDetail(competitionId.value),
    ])

    if (competitionsResponse.code === 1) {
      const foundCompetition = competitionsResponse.data.find((c) => c.id === competitionId.value)
      if (foundCompetition) {
        competition.value = foundCompetition
      } else {
        error.value = '未找到该竞赛信息'
      }
    } else {
      error.value = competitionsResponse.msg || '获取竞赛信息失败'
    }

    if (rulesResponse.code === 1) {
      rules.value = rulesResponse.data
    } else {
      error.value = rulesResponse.message || '获取竞赛规则失败'
    }
  } catch (err) {
    error.value = '网络错误，请稍后重试'
    console.error('获取竞赛详情失败:', err)
  } finally {
    loading.value = false
  }
}

const getCategoryText = (category: string) => {
  const categoryMap: Record<string, string> = {
    eligibility: '参赛资格',
    team: '团队规则',
    schedule: '赛程安排',
    scoring: '评分标准',
    award: '奖项设置',
    other: '其他',
  }
  return categoryMap[category] || category
}

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

const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 1024
}

const goToCompetitionManagement = () => {
  router.push('/career/competitions')
}

const goToCareerNavigation = () => {
  router.push('/career/position')
}

const goToExamSupport = () => {
  router.push('/career/pee')
}

const joinCompetition = () => {
  if (competition.value && competition.value.officialWebsite) {
    window.open(competition.value.officialWebsite, '_blank')
  } else {
    alert('该竞赛暂无官方网站')
  }
}

onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
  fetchCompetitionDetail()
})
</script>

<style scoped>
.competition-detail {
  min-height: 100vh;
  background-color: #f5f7fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  display: flex;
  flex-direction: column;
}

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
  color: var(--white);
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
  margin-top: 60px;
  position: relative;
}

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

.content-area {
  margin-left: 220px;
  flex: 1;
  padding: 24px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: white;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #606266;
  font-size: 14px;
  margin-bottom: 24px;
}

.back-button:hover {
  background-color: #f0f9ff;
  border-color: #409eff;
  color: #409eff;
}

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

.detail-container {
  max-width: 900px;
}

.competition-header {
  background-color: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
}

.competition-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
}

.competition-badges {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background-color: #ecf5ff;
  color: #409eff;
}

.badge.type {
  background-color: #f0f9eb;
  color: #67c23a;
}

.badge.level {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.badge.active {
  background-color: #f0f9eb;
  color: #67c23a;
}

.badge.completed {
  background-color: #f5f7fa;
  color: #909399;
}

.section {
  background-color: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
}

.section .section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
  padding: 0;
  text-transform: none;
  letter-spacing: normal;
}

.description {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin: 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #909399;
}

.info-value {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.tags-container {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background-color: #ecf5ff;
  color: #409eff;
}

.requirements {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin: 0;
  white-space: pre-line;
}

.rules-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rule-item {
  border: 1px solid #e0e6ed;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;
}

.rule-item.required {
  border-color: #e6a23c;
  background-color: #fdf6ec;
}

.rule-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.rule-category {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background-color: #ecf5ff;
  color: #409eff;
}

.rule-required {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background-color: #e6a23c;
  color: white;
}

.rule-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.rule-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  white-space: pre-line;
}

.no-rules {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 24px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.btn-primary {
  padding: 10px 32px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  background-color: #66b1ff;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #c0c4cc;
}

.btn-secondary {
  padding: 10px 32px;
  background-color: transparent;
  color: #606266;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background-color: #f0f9ff;
  border-color: #409eff;
  color: #409eff;
}

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

  .info-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
}
</style>
