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
    console.log('考试倒计时响应:', response)
    if (response && response.code === 1 && Array.isArray(response.data)) {
      examCountdowns.value = response.data
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
    if (response.code === 1) {
      allUniversities.value = response.data
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

// ---------- 学习进度模块（与 /learning-progress API 交互） ----------
const fetchLearningProgressSummary = async () => {
  progressLoading.value = true
  progressError.value = ''
  try {
    const response = await api.getLearningProgressSummary()

    // 现在 response 是 ApiResponse<LearningProgressSummary> 类型
    const rawCode = response.code
    const numericCode = typeof rawCode === 'string' ? Number.parseInt(rawCode, 10) : rawCode

    // 兼容多种后端风格：
    // - code 为 1 / '1'（常见业务成功码）
    // - code 为 200 / '200'（有些后端把 HTTP 200 也作为业务码返回）
    // - 未返回 code 但 data 结构正确
    const hasValidData =
      response.data &&
      typeof response.data.overallPercent === 'number' &&
      Array.isArray(response.data.items)

    const successByCode = numericCode === 1 || numericCode === 200 || numericCode === 0

    if (successByCode || (numericCode == null && hasValidData)) {
      learningProgressSummary.value = response.data || { overallPercent: 0, items: [] }
      progressError.value = ''
    } else {
      const msg = response.message
      progressError.value = msg || '获取学习进度失败'
    }
  } catch (err) {
    const status = (err as Error & { status?: number }).status
    const is404 = status === 404 || (err instanceof Error && err.message === '请求资源不存在')
    // 404 表示学习进度服务未部署或未启动，显示空状态并保留“添加”按钮
    if (is404) {
      learningProgressSummary.value = { overallPercent: 0, items: [] }
      progressError.value = ''
    } else {
      progressError.value = err instanceof Error ? err.message : '网络错误，请稍后重试'
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
    const response = await api.updateLearningProgress(id, {
      ...(name ? { name } : {}),
      progressPercent: percent,
    })
    const rawCode = (response as { code?: number | string }).code ?? (response as any).code
    const numericCode = typeof rawCode === 'string' ? Number.parseInt(rawCode, 10) : rawCode
    if (numericCode === 1 || numericCode === 200 || numericCode === 0) {
      editingProgressId.value = null
      await fetchLearningProgressSummary()
    } else {
      const msg = (response as { msg?: string }).msg ?? (response as { message?: string }).message
      alert(msg || '更新失败')
    }
  } catch (err) {
    alert(err instanceof Error ? err.message : '更新失败，请稍后重试')
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
    const response = await api.addLearningProgress({ name, progressPercent: percent })
    const rawCode = (response as { code?: number | string }).code ?? (response as any).code
    const numericCode = typeof rawCode === 'string' ? Number.parseInt(rawCode, 10) : rawCode
    if (numericCode === 1 || numericCode === 200 || numericCode === 0) {
      showAddProgress.value = false
      newProgressName.value = ''
      newProgressPercent.value = 0
      await fetchLearningProgressSummary()
    } else {
      const msg = (response as { msg?: string }).msg ?? (response as { message?: string }).message
      alert(msg || '添加失败')
    }
  } catch (err) {
    alert(err instanceof Error ? err.message : '添加失败，请稍后重试')
    console.error('添加学习进度失败:', err)
  }
}

const deleteProgressItem = async (id: number) => {
  if (!confirm('确定要删除该学习进度吗？')) return
  try {
    const response = await api.deleteLearningProgress(id)
    const rawCode = (response as { code?: number | string }).code ?? (response as any).code
    const numericCode = typeof rawCode === 'string' ? Number.parseInt(rawCode, 10) : rawCode
    if (numericCode === 1 || numericCode === 200 || numericCode === 0) {
      await fetchLearningProgressSummary()
    } else {
      const msg = (response as { msg?: string }).msg ?? (response as { message?: string }).message
      alert(msg || '删除失败')
    }
  } catch (err) {
    alert(err instanceof Error ? err.message : '删除失败，请稍后重试')
    console.error('删除学习进度失败:', err)
  }
}

// 获取收藏的院校详细列表
const fetchFavoriteUniversities = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await api.getFavoriteUniversities()
    if (response.code === 1) {
      favoriteUniversities.value = allUniversities.value.filter((u: University) =>
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
.exam-card .card-content {
  align-items: center;
}

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
  background: linear-gradient(135deg, #f53f3f 0%, #ff7d00 100%);
  border-radius: 8px;
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

/* 学习进度 - 加载与错误 */
.progress-loading,
.progress-error {
  font-size: 14px;
  color: #666;
  margin: 0 0 8px 0;
}

.progress-error {
  color: #f56c6c;
}

.retry-progress-btn {
  padding: 6px 12px;
  font-size: 13px;
  color: #409eff;
  background: #ecf5ff;
  border: 1px solid #b3d8ff;
  border-radius: 4px;
  cursor: pointer;
}

.retry-progress-btn:hover {
  background: #d9ecff;
}

.overall-percent {
  font-size: 14px;
  color: #409eff;
  margin: 0 0 8px 0;
}

/* 学习进度 - 科目行与编辑 */
.subject-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid #f0f0f0;
}

.subject-row:last-of-type {
  border-bottom: none;
}

.subject-edit-input {
  flex: 1;
  min-width: 0;
  padding: 6px 8px;
  font-size: 14px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
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
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  text-align: right;
}

.percent-suffix {
  font-size: 14px;
  color: #666;
}

.subject-btn {
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid transparent;
}

.save-btn {
  color: #fff;
  background: #409eff;
  border-color: #409eff;
}

.save-btn:hover {
  background: #66b1ff;
}

.cancel-btn {
  color: #606266;
  background: #fff;
  border-color: #dcdfe6;
}

.cancel-btn:hover {
  color: #409eff;
  border-color: #c6e2ff;
  background: #ecf5ff;
}

.edit-btn {
  color: #409eff;
  background: #ecf5ff;
  border-color: #b3d8ff;
}

.delete-btn {
  color: #f56c6c;
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
  color: #409eff;
  background: #ecf5ff;
  border: 1px dashed #b3d8ff;
  border-radius: 4px;
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
