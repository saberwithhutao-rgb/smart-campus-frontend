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
          <div class="card exam-card">
            <div class="card-header">
              <span class="card-icon">📅</span>
              <span class="card-title">考试倒计时</span>
            </div>
            <div class="card-content">
              <template v-if="latestExam">
                <p class="exam-name">{{ latestExam.name }}</p>
                <p class="exam-date">{{ latestExam.startDate }} 至 {{ latestExam.endDate }}</p>
                <div class="countdown-display">
                  <div class="countdown-item">
                    <span class="countdown-number">{{
                      getCountdownDisplay(latestExam.name).days
                    }}</span>
                    <span class="countdown-label">天</span>
                  </div>
                  <div class="countdown-item">
                    <span class="countdown-number">{{
                      getCountdownDisplay(latestExam.name).hours
                    }}</span>
                    <span class="countdown-label">时</span>
                  </div>
                  <div class="countdown-item">
                    <span class="countdown-number">{{
                      getCountdownDisplay(latestExam.name).minutes
                    }}</span>
                    <span class="countdown-label">分</span>
                  </div>
                  <div class="countdown-item">
                    <span class="countdown-number">{{
                      getCountdownDisplay(latestExam.name).seconds
                    }}</span>
                    <span class="countdown-label">秒</span>
                  </div>
                </div>
              </template>
              <template v-else>
                <p class="exam-name">暂无即将开始的考试</p>
              </template>
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
          <div class="card learning-progress-card">
            <div class="card-header">
              <span class="card-icon">📊</span>
              <span class="card-title">学习进度</span>
            </div>
            <div class="card-content">
              <div v-if="progressLoading" class="progress-loading">
                <span>加载中...</span>
              </div>
              <template v-else-if="progressError">
                <p class="progress-error">{{ progressError }}</p>
                <button
                  type="button"
                  class="retry-progress-btn"
                  @click="fetchLearningProgressSummary"
                >
                  重试
                </button>
              </template>
              <template v-else>
                <p class="current-progress">当前学习进度</p>
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    :style="{ width: (learningProgressSummary?.overallPercent ?? 0) + '%' }"
                  ></div>
                </div>
                <p class="overall-percent">{{ learningProgressSummary?.overallPercent ?? 0 }}%</p>
                <div class="subject-progress">
                  <div
                    v-for="item in learningProgressSummary?.items ?? []"
                    :key="item.id"
                    class="subject-row"
                  >
                    <template v-if="editingProgressId === item.id">
                      <input
                        v-model="editProgressName"
                        class="subject-edit-input"
                        placeholder="科目名称"
                        @keyup.enter="submitUpdateProgress(item.id)"
                      />
                      <div class="subject-edit-actions">
                        <input
                          v-model.number="editProgressPercent"
                          type="number"
                          min="0"
                          max="100"
                          class="subject-percent-input"
                        />
                        <span class="percent-suffix">%</span>
                        <button
                          type="button"
                          class="subject-btn save-btn"
                          @click="submitUpdateProgress(item.id)"
                        >
                          保存
                        </button>
                        <button
                          type="button"
                          class="subject-btn cancel-btn"
                          @click="editingProgressId = null"
                        >
                          取消
                        </button>
                      </div>
                    </template>
                    <template v-else>
                      <div class="subject">
                        <span class="subject-name">{{ item.name }}:</span>
                        <span class="subject-value">{{ item.progressPercent }}%</span>
                      </div>
                      <div class="subject-actions">
                        <button
                          type="button"
                          class="subject-btn edit-btn"
                          @click="startEditProgress(item)"
                        >
                          编辑
                        </button>
                        <button
                          type="button"
                          class="subject-btn delete-btn"
                          @click="deleteProgressItem(item.id)"
                        >
                          删除
                        </button>
                      </div>
                    </template>
                  </div>
                  <div v-if="showAddProgress" class="subject-row add-form">
                    <input
                      v-model="newProgressName"
                      class="subject-edit-input"
                      placeholder="科目或知识点名称"
                      @keyup.enter="submitAddProgress"
                    />
                    <div class="subject-edit-actions">
                      <input
                        v-model.number="newProgressPercent"
                        type="number"
                        min="0"
                        max="100"
                        class="subject-percent-input"
                        placeholder="0"
                      />
                      <span class="percent-suffix">%</span>
                      <button type="button" class="subject-btn save-btn" @click="submitAddProgress">
                        添加
                      </button>
                      <button
                        type="button"
                        class="subject-btn cancel-btn"
                        @click="
                          ((showAddProgress = false),
                          (newProgressName = ''),
                          (newProgressPercent = 0))
                        "
                      >
                        取消
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  v-if="!showAddProgress"
                  type="button"
                  class="add-progress-btn"
                  @click="showAddProgress = true"
                >
                  + 添加科目/知识点
                </button>
              </template>
            </div>
          </div>
        </div>

        <!-- 院校选择区域 -->
        <div class="school-selection">
          <h2 class="section-title">院校选择</h2>

          <!-- 按院校名称搜索 -->
          <div class="filter-section">
            <div class="filter-row filter-row-single">
              <div class="filter-item filter-item-search">
                <input
                  type="text"
                  class="filter-input search-input"
                  placeholder="按院校名称搜索..."
                  v-model="schoolNameKeyword"
                  @keyup.enter="handleSearch"
                />
                <button class="filter-btn" @click="handleSearch">搜索</button>
              </div>
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
import { ref, onMounted, onUnmounted, computed, watch, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'
import type { University, UniversityListDetail } from '../types/university'
import type { ExamCountdown, LearningProgressItem, LearningProgressSummary } from '../types/user'
import { ElMessage } from 'element-plus'

// 路由实例
const router = useRouter()

// 检查屏幕尺寸 - 响应式设计
const isMobile = ref(false)

// 院校数据
// 根据院校名称关键词过滤后的院校列表（用于展示）
const universities = computed(() => {
  const keyword = schoolNameKeyword.value.trim().toLowerCase()
  if (!keyword) return allUniversities.value
  return allUniversities.value.filter(
    (u: University) =>
      (u.name && u.name.toLowerCase().includes(keyword)) ||
      (u.shortName && u.shortName.toLowerCase().includes(keyword)),
  )
})
const loading = ref(false)
const error = ref('')

// 收藏的院校ID列表
const favoriteUniversityIds = ref<number[]>([])
const favoriteUniversities = ref<University[]>([])
const showFavorites = ref(false)

// 考试倒计时数据
const examCountdowns = ref<ExamCountdown[]>([])
const countdownTimers = reactive<
  Record<string, { days: number; hours: number; minutes: number; seconds: number }>
>({})
let countdownInterval: ReturnType<typeof setInterval> | null = null

// 学习进度数据
const learningProgressSummary = ref<LearningProgressSummary | null>(null)
const progressLoading = ref(false)
const progressError = ref('')
const showAddProgress = ref(false)
const newProgressName = ref('')
const newProgressPercent = ref(0)
const editingProgressId = ref<number | null>(null)
const editProgressName = ref('')
const editProgressPercent = ref(0)

// 院校名称搜索关键词
const schoolNameKeyword = ref('')

// 全部院校列表（接口返回的完整数据）
const allUniversities = ref<University[]>([])

// 计算属性 - 获取已收藏院校数量
const favoriteCount = computed(() => favoriteUniversityIds.value.length)

// 获取最近的未过期考试
const latestExam = computed(() => {
  const activeExams = examCountdowns.value.filter((exam) => !exam.expired)
  if (activeExams.length === 0) return null
  return activeExams.sort((a, b) => a.daysRemaining - b.daysRemaining)[0]
})

// 获取考试倒计时数据
const fetchExamCountdowns = async () => {
  try {
    const response = await api.getExamCountdowns()
    if (Array.isArray(response)) {
      examCountdowns.value = response
      console.log('考试数据:', examCountdowns.value)
      initCountdownTimers()
    }
  } catch (err) {
    console.error('获取考试倒计时失败:', err)
  }
}

// 初始化倒计时计时器
const initCountdownTimers = () => {
  examCountdowns.value.forEach((exam) => {
    updateCountdownTimer(exam)
  })
}

// 更新单个考试的倒计时
const updateCountdownTimer = (exam: ExamCountdown) => {
  const startDate = new Date(exam.startDate)
  const now = new Date()
  const diff = startDate.getTime() - now.getTime()

  if (diff <= 0) {
    countdownTimers[exam.name] = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    }
    return
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  countdownTimers[exam.name] = {
    days,
    hours,
    minutes,
    seconds,
  }
}

// 启动每秒更新倒计时
const startCountdownInterval = () => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }

  countdownInterval = setInterval(() => {
    examCountdowns.value.forEach((exam) => {
      if (!exam.expired) {
        updateCountdownTimer(exam)
      }
    })
  }, 1000)
}

// 停止倒计时
const stopCountdownInterval = () => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
}

// 获取倒计时显示
const getCountdownDisplay = (examName: string) => {
  return countdownTimers[examName] || { days: 0, hours: 0, minutes: 0, seconds: 0 }
}

// 获取院校列表
const fetchUniversities = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await api.getUniversities()
    if (Array.isArray(response)) {
      allUniversities.value = response
    } else {
      error.value = '获取院校列表失败'
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
    if (Array.isArray(response)) {
      favoriteUniversityIds.value = response
    }
  } catch (err) {
    console.error('获取收藏列表失败:', err)
  }
}

// ---------- 学习进度模块（与 /learning-progress API 交互） ----------
const fetchLearningProgressSummary = async () => {
  progressLoading.value = true
  progressError.value = ''
  try {
    const response = (await api.getLearningProgressSummary()) as unknown as LearningProgressSummary

    if (response && typeof response.overallPercent === 'number' && Array.isArray(response.items)) {
      learningProgressSummary.value = response
      progressError.value = ''
    } else {
      progressError.value = '获取学习进度失败'
      // 设置默认空数据
      learningProgressSummary.value = { overallPercent: 0, items: [] }
    }
  } catch (err) {
    const status = (err as Error & { status?: number }).status
    const is404 = status === 404 || (err instanceof Error && err.message === '请求资源不存在')
    // 404 表示学习进度服务未部署或未启动，显示空状态并保留"添加"按钮
    if (is404) {
      learningProgressSummary.value = { overallPercent: 0, items: [] }
      progressError.value = ''
    } else {
      progressError.value = err instanceof Error ? err.message : '网络错误，请稍后重试'
      learningProgressSummary.value = { overallPercent: 0, items: [] }
    }
    console.error('获取学习进度失败:', err)
  } finally {
    progressLoading.value = false
  }
}

const startEditProgress = (item: LearningProgressItem) => {
  editingProgressId.value = item.id
  editProgressName.value = item.name
  editProgressPercent.value = item.progressPercent
}

const submitUpdateProgress = async (id: number) => {
  const name = editProgressName.value?.trim()
  const percent = editProgressPercent.value
  if (percent < 0 || percent > 100) {
    alert('完成百分比必须在 0-100 之间')
    return
  }
  try {
    // 如果请求成功，直接继续
    await api.updateLearningProgress(id, {
      ...(name ? { name } : {}),
      progressPercent: percent,
    })
    // 成功：更新本地状态
    editingProgressId.value = null
    await fetchLearningProgressSummary()
  } catch (err) {
    // 拦截器已经弹出错误提示，这里只需要处理本地状态
    console.error('更新学习进度失败:', err)
  }
}

const submitAddProgress = async () => {
  const name = newProgressName.value?.trim()
  if (!name) {
    alert('科目/知识点名称不能为空')
    return
  }
  const percent = newProgressPercent.value
  if (percent < 0 || percent > 100) {
    alert('完成百分比必须在 0-100 之间')
    return
  }
  try {
    await api.addLearningProgress({ name, progressPercent: percent })
    showAddProgress.value = false
    newProgressName.value = ''
    newProgressPercent.value = 0
    await fetchLearningProgressSummary()
  } catch (err) {
    console.error('添加学习进度失败:', err)
  }
}

const deleteProgressItem = async (id: number) => {
  if (!confirm('确定要删除该学习进度吗？')) return
  try {
    await api.deleteLearningProgress(id)
    await fetchLearningProgressSummary()
  } catch (err) {
    console.error('删除学习进度失败:', err)
  }
}

// 获取收藏的院校详细列表
const fetchFavoriteUniversities = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await api.getFavoriteUniversities()
    if (Array.isArray(response)) {
      favoriteUniversities.value = allUniversities.value.filter((u: University) =>
        response.some((f: UniversityListDetail) => f.universityId === u.id),
      )
    } else {
      error.value = '获取收藏列表失败'
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
    await api.toggleFavoriteUniversity(university.id)

    const isFavorited = favoriteUniversityIds.value.includes(university.id)
    if (isFavorited) {
      favoriteUniversityIds.value = favoriteUniversityIds.value.filter((id) => id !== university.id)
      favoriteUniversities.value = favoriteUniversities.value.filter((u) => u.id !== university.id)
    } else {
      favoriteUniversityIds.value.push(university.id)
      favoriteUniversities.value.push(university)
    }
    ElMessage.success('操作成功')
  } catch (err) {
    ElMessage.error('操作失败，请稍后重试')
    console.error('切换收藏状态失败:', err)
  }
}

// 判断是否已收藏
const isFavorite = (universityId: number) => {
  return favoriteUniversityIds.value.includes(universityId)
}

// 解析标签字符串 - 处理各种边界情况
const parseTags = (tags: string | undefined | null): string[] => {
  // 处理 null、undefined 或空字符串
  if (tags == null || tags === '') {
    return []
  }

  try {
    // 尝试直接解析
    let parsed
    try {
      parsed = JSON.parse(tags)
    } catch {
      // 如果解析失败，尝试处理转义字符
      const cleaned = tags.replace(/\\/g, '"')
      parsed = JSON.parse(cleaned)
    }

    // 确保返回的是数组
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.warn('解析标签失败:', tags, error)
    return []
  }
}

// 按院校名称搜索（列表由 computed 根据 schoolNameKeyword 自动过滤，此处仅用于按钮触发时保持一致性）
const handleSearch = () => {
  // 列表已通过 universities 计算属性实时过滤，无需额外逻辑
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
  fetchExamCountdowns()
  startCountdownInterval()
  fetchLearningProgressSummary()
})

// 组件卸载时清理定时器
onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
  stopCountdownInterval()
})

// 监听收藏列表显示状态
watch(showFavorites, (newVal) => {
  if (newVal) {
    fetchFavoriteUniversities()
  }
})
</script>

<style scoped>
/* 主容器 */
.postgraduate-support {
  min-height: 100vh;
  background-color: var(--color-bg);
  font-family: var(--font-family);
  display: flex;
  flex-direction: column;
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

.sidebar-section h3.section-title {
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

/* 右侧主内容区 */
.content-area {
  margin-left: 220px;
  flex: 1;
  padding: 24px;
  background-color: var(--color-bg);
  min-height: calc(100vh - 60px);
}

/* 页面标题 */
.page-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
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
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
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
  color: var(--color-text);
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 考试时间卡片 */
.exam-card .card-content {
  align-items: center;
}

.exam-name {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
}

.exam-date {
  font-size: 14px;
  color: var(--color-text);
  margin: 0;
}

.countdown-display {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
}

.countdown-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(135deg, var(--color-danger) 0%, #ff7d00 100%);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  min-width: 50px;
}

.countdown-number {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

.countdown-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 4px;
}

/* 院校选择卡片 */
.selected-schools {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
}

.school-count {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.view-favorites-btn {
  padding: 6px 12px;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 8px;
}

.view-favorites-btn:hover {
  background-color: var(--color-primary-hover);
}

/* 学习进度卡片 */
.current-progress {
  font-size: 14px;
  color: var(--color-text);
  margin: 0;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: var(--color-primary-light);
  border-radius: var(--radius-sm);
  overflow: hidden;
  margin: 8px 0;
}

.progress-fill {
  height: 100%;
  background-color: var(--color-primary);
  border-radius: var(--radius-sm);
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
  color: var(--color-text);
}

/* 学习进度 - 加载与错误 */
.progress-loading,
.progress-error {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0 0 8px 0;
}

.progress-error {
  color: var(--color-danger);
}

.retry-progress-btn {
  padding: 6px 12px;
  font-size: 13px;
  color: var(--color-primary);
  background: var(--color-primary-light);
  border: 1px solid #b3d8ff;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.retry-progress-btn:hover {
  background: #d9ecff;
}

.overall-percent {
  font-size: 14px;
  color: var(--color-primary);
  margin: 0 0 8px 0;
}

/* 学习进度 - 科目行与编辑 */
.subject-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid var(--color-border-light);
}

.subject-row:last-of-type {
  border-bottom: none;
}

.subject-edit-input {
  flex: 1;
  min-width: 0;
  padding: 6px 8px;
  font-size: 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-bg-card);
  color: var(--color-text);
}

.subject-edit-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.subject-percent-input {
  width: 56px;
  padding: 6px 6px;
  font-size: 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  text-align: right;
  background-color: var(--color-bg-card);
  color: var(--color-text);
}

.percent-suffix {
  font-size: 14px;
  color: var(--color-text-light);
}

.subject-btn {
  padding: 4px 10px;
  font-size: 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  border: 1px solid transparent;
}

.save-btn {
  color: #fff;
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.save-btn:hover {
  background: var(--color-primary-hover);
}

.cancel-btn {
  color: var(--color-text-secondary);
  background: var(--color-bg-card);
  border-color: var(--color-border);
}

.cancel-btn:hover {
  color: var(--color-primary);
  border-color: #c6e2ff;
  background: var(--color-primary-light);
}

.edit-btn {
  color: var(--color-primary);
  background: var(--color-primary-light);
  border-color: #b3d8ff;
}

.delete-btn {
  color: var(--color-danger);
  background: #fef0f0;
  border-color: #fbc4c4;
}

.edit-btn:hover,
.delete-btn:hover {
  opacity: 0.9;
}

.subject-actions {
  display: flex;
  gap: 6px;
}

.add-progress-btn {
  margin-top: 10px;
  padding: 8px 14px;
  font-size: 13px;
  color: var(--color-primary);
  background: var(--color-primary-light);
  border: 1px dashed #b3d8ff;
  border-radius: var(--radius-sm);
  cursor: pointer;
  width: 100%;
}

.add-progress-btn:hover {
  background: #d9ecff;
}

/* 院校选择区域 */
.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 20px 0;
}

/* 筛选区域 */
.filter-section {
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-sm);
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
  color: var(--color-text);
  font-weight: 500;
}

.filter-select {
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--color-text);
  background-color: var(--color-bg-card);
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-select:hover {
  border-color: var(--color-primary);
}

.filter-input {
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--color-text);
  width: 200px;
  transition: all 0.3s ease;
  background-color: var(--color-bg-card);
}

.filter-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.filter-row-single {
  margin-bottom: 0;
}

.filter-item-search {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  max-width: 480px;
}

.filter-item-search .search-input {
  flex: 1;
  width: 100%;
  min-width: 200px;
}

.filter-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.filter-btn {
  padding: 8px 20px;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  background-color: var(--color-primary-hover);
}

.reset-btn {
  padding: 8px 20px;
  background-color: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.reset-btn:hover {
  background-color: var(--color-primary-light);
  border-color: var(--color-primary);
  color: var(--color-primary);
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

/* 错误状态 */
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
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background-color: var(--color-primary-hover);
}

.school-item {
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}

.school-item:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
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
  color: var(--color-text-light);
  margin-left: 8px;
}

.school-icon {
  font-size: 18px;
}

.school-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
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
  background-color: var(--color-primary-light);
  color: var(--color-primary);
}

.tag.location {
  background-color: var(--color-success-light);
  color: var(--color-success);
}

.school-actions {
  display: flex;
  gap: 8px;
}

.compare-btn,
.collect-btn {
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: transparent;
  color: var(--color-text-secondary);
}

.collect-btn.active {
  background-color: var(--color-danger);
  border-color: var(--color-danger);
  color: white;
}

.website-btn {
  padding: 6px 12px;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: transparent;
  color: var(--color-primary);
}

.website-btn:hover {
  background-color: var(--color-primary);
  color: white;
}

.compare-btn:hover,
.collect-btn:hover {
  background-color: var(--color-primary-light);
  border-color: var(--color-primary);
  color: var(--color-primary);
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
  color: var(--color-text-secondary);
}

.detail-label {
  font-weight: 500;
}

.detail-value {
  color: var(--color-text);
}

/* 考研资源区域 */
.resources-section {
  margin-top: 40px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--color-text-light);
}

.resource-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 12px;
}

.tab-btn {
  padding: 8px 20px;
  background-color: transparent;
  color: var(--color-text-secondary);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn.active {
  background-color: var(--color-primary);
  color: white;
}

.tab-btn:hover:not(.active) {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
}

.resource-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.resource-item {
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.resource-item:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
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
  color: var(--color-text);
  margin: 0;
}

.resource-description {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0 0 8px 0;
  line-height: 1.5;
}

.resource-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--color-text-light);
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
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: transparent;
  color: var(--color-text-secondary);
}

.download-btn:hover,
.collect-btn:hover,
.share-btn:hover {
  background-color: var(--color-primary-light);
  border-color: var(--color-primary);
  color: var(--color-primary);
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
  background-color: var(--color-bg-card);
  border-radius: var(--radius-md);
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
  border-bottom: 1px solid var(--color-border);
}

.favorites-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--color-text-light);
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
  color: var(--color-danger);
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
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
}

.favorite-item:hover {
  box-shadow: var(--shadow-sm);
  border-color: var(--color-primary);
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
  color: var(--color-text);
}

.favorite-name .short {
  font-size: 12px;
  color: var(--color-text-light);
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
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: transparent;
  color: var(--color-danger);
}

.unfavorite-btn:hover {
  background-color: var(--color-danger);
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
