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

    if (Array.isArray(competitionsResponse)) {
      const foundCompetition = competitionsResponse.find((c) => c.id === competitionId.value)
      if (foundCompetition) {
        competition.value = foundCompetition
      } else {
        error.value = '未找到该竞赛信息'
      }
    } else {
      error.value = '获取竞赛信息失败'
    }

    if (Array.isArray(rulesResponse)) {
      rules.value = rulesResponse
    } else {
      error.value = '获取竞赛规则失败'
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
  background-color: var(--color-bg);
  font-family: var(--font-family);
  display: flex;
  flex-direction: column;
}

.main-content {
  display: flex;
  flex: 1;
  margin-top: 60px;
  position: relative;
}

.sidebar {
  width: 220px;
  background-color: var(--color-bg-card);
  border-right: 1px solid var(--color-border);
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
  color: var(--color-text-secondary);
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
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  color: var(--color-text);
}

.sidebar-item:hover {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
}

.sidebar-item.active {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: 500;
}

.item-icon {
  font-size: 16px;
}

.content-area {
  margin-left: 220px;
  flex: 1;
  padding: 24px;
  background-color: var(--color-bg);
  min-height: calc(100vh - 60px);
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--color-text-secondary);
  font-size: 14px;
  margin-bottom: 24px;
}

.back-button:hover {
  background-color: var(--color-primary-light);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--color-text-secondary);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-border);
  border-top: 4px solid var(--color-primary);
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
  color: var(--color-danger);
  gap: 16px;
}

.retry-btn {
  padding: 8px 20px;
  background-color: var(--color-primary);
  color: var(--color-bg-card);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background-color: var(--color-primary-hover);
}

.detail-container {
  max-width: 900px;
}

.competition-header {
  background-color: var(--color-bg-card);
  padding: 24px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  margin-bottom: 24px;
}

.competition-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text);
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
  background-color: var(--color-primary-light);
  color: var(--color-primary);
}

.badge.type {
  background-color: var(--color-success-light);
  color: var(--color-success);
}

.badge.level {
  background-color: var(--color-warning-light);
  color: var(--color-warning);
}

.badge.active {
  background-color: var(--color-success-light);
  color: var(--color-success);
}

.badge.completed {
  background-color: var(--color-bg-dark);
  color: var(--color-text-light);
}

.section {
  background-color: var(--color-bg-card);
  padding: 24px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  margin-bottom: 24px;
}

.section .section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 16px 0;
  padding: 0;
  text-transform: none;
  letter-spacing: normal;
}

.description {
  font-size: 14px;
  color: var(--color-text-secondary);
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
  color: var(--color-text-light);
}

.info-value {
  font-size: 14px;
  color: var(--color-text-secondary);
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
  background-color: var(--color-primary-light);
  color: var(--color-primary);
}

.requirements {
  font-size: 14px;
  color: var(--color-text-secondary);
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
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px;
  transition: all 0.3s ease;
}

.rule-item.required {
  border-color: var(--color-warning);
  background-color: var(--color-warning-light, #fdf6ec);
}

.rule-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.rule-category {
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
  background-color: var(--color-primary-light);
  color: var(--color-primary);
}

.rule-required {
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
  background-color: var(--color-warning);
  color: var(--color-bg-card);
}

.rule-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 8px 0;
}

.rule-content {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.6;
  white-space: pre-line;
}

.no-rules {
  text-align: center;
  padding: 40px;
  color: var(--color-text-light);
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 24px;
  background-color: var(--color-bg-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.btn-primary {
  padding: 10px 32px;
  background-color: var(--color-primary);
  color: var(--color-bg-card);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: var(--color-text-light);
}

.btn-secondary {
  padding: 10px 32px;
  background-color: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background-color: var(--color-primary-light);
  border-color: var(--color-primary);
  color: var(--color-primary);
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
