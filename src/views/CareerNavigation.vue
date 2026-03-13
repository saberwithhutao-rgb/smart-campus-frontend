<template>
  <div class="career-navigation">
    <GlobalNavbar />

    <!-- 主体内容区 -->
    <div class="main-content">
      <!-- 左侧垂直导航栏 -->
      <aside class="sidebar" :class="{ 'sidebar-hidden': isMobile && !showSidebar }">
        <div class="sidebar-menu">
          <!-- 竞赛管理 -->
          <div class="sidebar-section">
            <h3 class="section-title">竞赛相关</h3>
            <div class="sidebar-item" @click="handleNavigation('/career/competitions')">
              <span class="item-icon">🏆</span>
              <span class="item-text">竞赛管理</span>
            </div>
            <div class="sidebar-item active">
              <span class="item-icon">🎯</span>
              <span class="item-text">职业导航</span>
            </div>
          </div>

          <!-- 考研支持 -->
          <div class="sidebar-section">
            <h3 class="section-title">考研支持</h3>
            <div class="sidebar-item" @click="handleNavigation('/career/pee')">
              <span class="item-icon">📖</span>
              <span class="item-text">考研支持</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- 右侧主内容区 -->
      <main class="content-area" :class="{ 'content-area-expanded': isMobile && !showSidebar }">
        <!-- 移动端菜单按钮 -->
        <button v-if="isMobile" class="mobile-menu-toggle" @click="toggleSidebar">
          <span class="menu-icon">☰</span>
        </button>

        <!-- 页面标题 -->
        <h1 class="page-title">职业导航</h1>

        <!-- AI 咨询区域（置顶突出） -->
        <div class="ai-chat-section" ref="aiSectionRef">
          <div class="chat-header">
            <div class="chat-header-left">
              <span class="chat-header-icon">💬</span>
              <div>
                <h2 class="chat-title">AI 职业咨询</h2>
                <p class="chat-subtitle">专业职业建议与规划，随时为您解答</p>
              </div>
            </div>
            <div class="chat-header-actions">
              <button class="history-btn" @click="toggleHistoryPanel" :disabled="loading">
                <span class="btn-icon">🕘</span>
                <span class="btn-text">历史记录</span>
              </button>
              <button class="new-chat-btn" @click="startNewChat" :disabled="loading">
                <span class="btn-icon">✨</span>
                <span class="btn-text">新对话</span>
              </button>
            </div>
          </div>

          <div class="chat-body">
            <!-- 历史会话面板 -->
            <aside v-show="showHistoryPanel" class="chat-history-panel">
              <div class="history-header">
                <div class="history-title">历史会话</div>
                <button
                  class="history-refresh-btn"
                  @click="refreshSessionIds"
                  :disabled="sessionIdsLoading"
                >
                  {{ sessionIdsLoading ? '刷新中...' : '刷新' }}
                </button>
              </div>

              <div v-if="sessionIdsLoading" class="history-loading">加载中...</div>
              <div v-else-if="sessionIdsError" class="history-error">
                <div class="history-error-text">{{ sessionIdsError }}</div>
                <button class="history-retry-btn" @click="refreshSessionIds">重试</button>
              </div>
              <div v-else class="history-list">
                <div
                  v-for="sid in sessionIds"
                  :key="sid"
                  class="history-item"
                  :class="{ active: sid === chanId }"
                  @click="loadSessionHistory(sid)"
                >
                  <div class="history-item-title">{{ sid }}</div>
                </div>
                <div v-if="sessionIds.length === 0" class="history-empty">暂无历史会话</div>
              </div>
            </aside>

            <!-- 聊天主区域 -->
            <section class="chat-main">
              <div class="chat-messages" ref="chatMessagesRef">
                <!-- 空状态：无消息时显示欢迎与示例 -->
                <div v-if="chatMessages.length === 0" class="chat-empty-state">
                  <div class="empty-state-icon">🎯</div>
                  <p class="empty-state-title">开始您的职业咨询</p>
                  <p class="empty-state-desc">输入您的问题，或从下方选择一个话题开始</p>
                  <div class="empty-state-suggestions">
                    <button
                      v-for="(s, i) in suggestionQuestions"
                      :key="i"
                      class="suggestion-chip"
                      @click="setSuggestionAndFocus(s)"
                    >
                      {{ s }}
                    </button>
                  </div>
                </div>
                <template v-else>
                  <div
                    v-for="(msg, index) in chatMessages"
                    :key="index"
                    class="message-item"
                    :class="msg.role"
                  >
                    <div class="message-avatar">
                      <span v-if="msg.role === 'user'" class="user-avatar">👤</span>
                      <span v-else class="ai-avatar">🤖</span>
                    </div>
                    <div class="message-content">
                      <!-- 仅在没有内容时显示“思考中”；有内容则显示流式/最终回复 -->
                      <div
                        v-if="msg.role === 'ai' && msg.isThinking && !msg.content"
                        class="thinking-indicator"
                      >
                        <div class="thinking-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                        <span class="thinking-text">{{ msg.statusHint || waitingTip }}</span>
                      </div>
                      <div
                        v-if="msg.content"
                        class="message-text"
                        v-html="sanitizeHtml(formatMessage(msg.content))"
                      ></div>
                    </div>
                  </div>
                </template>
              </div>

              <!-- 等待 AI 时的全局提示条 -->
              <div v-if="loading" class="chat-waiting-hint">
                <span class="waiting-hint-dot"></span>
                <span class="waiting-hint-text">{{ waitingTip }}</span>
              </div>

              <div class="chat-input-area">
                <textarea
                  ref="chatInput"
                  class="chat-input"
                  v-model="inputMessage"
                  placeholder="输入职业相关问题，如：适合我的方向、如何准备面试..."
                  @keydown.enter.prevent="sendMessage"
                  rows="3"
                ></textarea>
                <button
                  class="send-btn"
                  @click="sendMessage"
                  :disabled="!inputMessage.trim() || loading || historyLoading"
                >
                  <span v-if="loading" class="loading-icon"></span>
                  <span>{{ loading ? '处理中...' : '发送' }}</span>
                </button>
              </div>
            </section>
          </div>
        </div>

        <!-- 热门职业方向 -->
        <h2 class="section-title" ref="directionSectionRef">热门职业方向</h2>
        <div class="career-direction-tabs">
          <button
            type="button"
            class="tab-btn"
            :class="{ active: selectedDirectionCategory === '' }"
            @click="selectDirectionCategory('')"
          >
            全部
          </button>
          <button
            v-for="cat in directionCategories"
            :key="cat"
            type="button"
            class="tab-btn"
            :class="{ active: selectedDirectionCategory === cat }"
            @click="selectDirectionCategory(cat)"
          >
            {{ cat }}
          </button>
        </div>
        <div v-if="directionsLoading" class="career-directions-loading">加载中...</div>
        <div v-else-if="directionsError" class="career-directions-error">
          {{ directionsError }}
          <button type="button" class="btn-secondary" @click="fetchCareerDirections">重试</button>
        </div>
        <div v-else class="career-directions">
          <div v-for="item in careerDirectionList" :key="item.id" class="career-card">
            <div class="career-icon">
              <span class="icon">{{ getDefaultCareerIcon(item.category) }}</span>
            </div>
            <h3 class="career-title">{{ item.title }}</h3>
            <p class="career-description">{{ item.description }}</p>
            <div class="skills">
              <span v-for="skill in item.skills" :key="skill" class="skill-tag">{{ skill }}</span>
            </div>
            <div v-if="formatSalary(item)" class="salary">
              <span class="salary-icon">💰</span>
              <span class="salary-text">平均薪资: {{ formatSalary(item) }}</span>
            </div>
            <button type="button" class="btn-secondary" @click="openCareerDetail(item.id)">
              了解详情
            </button>
          </div>
          <div v-if="careerDirectionList.length === 0" class="career-directions-empty">
            暂无该分类下的职业方向
          </div>
        </div>

        <!-- 职业方向详情弹窗 -->
        <div v-if="showCareerDetailModal" class="modal-overlay" @click.self="closeCareerDetail">
          <div class="modal-box modal-detail modal-career-detail">
            <div v-if="careerDetailLoading" class="detail-loading">加载中...</div>
            <template v-else-if="careerDetailData">
              <div class="modal-header">
                <h3 class="modal-title">{{ careerDetailData.title }}</h3>
                <button
                  type="button"
                  class="modal-close"
                  aria-label="关闭"
                  @click="closeCareerDetail"
                >
                  ×
                </button>
              </div>
              <div class="modal-body">
                <p v-if="careerDetailData.description" class="career-detail-desc">
                  {{ careerDetailData.description }}
                </p>
                <div v-if="careerDetailData.skills?.length" class="career-detail-skills">
                  <span v-for="s in careerDetailData.skills" :key="s" class="skill-tag">{{
                    s
                  }}</span>
                </div>
                <p v-if="formatSalary(careerDetailData)" class="career-detail-salary">
                  <span class="salary-icon">💰</span> 平均薪资: {{ formatSalary(careerDetailData) }}
                </p>
                <div v-if="careerDetailData.workContent" class="career-detail-block">
                  <h4 class="career-detail-label">工作内容</h4>
                  <p class="career-detail-text">{{ careerDetailData.workContent }}</p>
                </div>
                <div v-if="careerDetailData.growthPath" class="career-detail-block">
                  <h4 class="career-detail-label">发展路径</h4>
                  <p class="career-detail-text">{{ careerDetailData.growthPath }}</p>
                </div>
                <div v-if="careerDetailData.entryRequirements" class="career-detail-block">
                  <h4 class="career-detail-label">入行要求</h4>
                  <p class="career-detail-text">{{ careerDetailData.entryRequirements }}</p>
                </div>
                <div
                  v-if="careerDetailData.fullContent"
                  class="career-detail-content detail-content-html"
                  v-html="sanitizeHtml(careerDetailData.fullContent)"
                ></div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn-secondary" @click="closeCareerDetail">关闭</button>
              </div>
            </template>
            <div v-else class="detail-loading">{{ careerDetailError || '加载失败' }}</div>
          </div>
        </div>

        <!-- 职业资讯 -->
        <h2 class="section-title" ref="newsSectionRef">职业资讯</h2>
        <div class="career-news-tabs">
          <button
            type="button"
            class="tab-btn"
            :class="{ active: careerArticleTab === 'all' }"
            @click="switchCareerTab('all')"
          >
            全部资讯
          </button>
          <button
            v-if="userStore.userState?.userInfo"
            type="button"
            class="tab-btn"
            :class="{ active: careerArticleTab === 'my' }"
            @click="switchCareerTab('my')"
          >
            我发表的资讯
          </button>
        </div>
        <template v-if="careerArticleTab === 'all'">
          <div class="career-news-toolbar">
            <div class="news-filter">
              <label class="filter-label">分类筛选：</label>
              <select
                v-model="articleCategoryFilter"
                class="filter-select"
                @change="onCategoryChange"
              >
                <option value="">全部</option>
                <option v-for="cat in categoryOptions" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
            <button
              v-if="userStore.userState?.userInfo"
              type="button"
              class="btn-primary publish-btn"
              @click="openPublishModal"
            >
              发表资讯
            </button>
          </div>
          <div v-if="articleListLoading" class="career-news-loading">加载中...</div>
          <div v-else-if="articleListError" class="career-news-error">
            {{ articleListError }}
            <button type="button" class="btn-secondary" @click="fetchCareerArticles">重试</button>
          </div>
          <div v-else class="career-news">
            <div v-for="article in articleList" :key="article.id" class="news-card">
              <h3 class="news-title">{{ article.title }}</h3>
              <p class="news-summary">{{ article.summary }}</p>
              <div class="news-meta">
                <span class="news-date">{{ article.publishDate }}</span>
                <span class="news-source">{{ article.category }}</span>
              </div>
              <button type="button" class="btn-secondary" @click="openArticleDetail(article.id)">
                阅读全文
              </button>
            </div>
            <div v-if="articleList.length === 0" class="career-news-empty">
              暂无资讯，去发表一条吧~
            </div>
          </div>
        </template>
        <template v-else-if="careerArticleTab === 'my'">
          <div class="career-news-toolbar career-news-toolbar--my">
            <button type="button" class="btn-primary publish-btn" @click="openPublishModal">
              发表资讯
            </button>
          </div>
          <div v-if="myArticleListLoading" class="career-news-loading">加载中...</div>
          <div v-else-if="myArticleListError" class="career-news-error">
            {{ myArticleListError }}
            <button type="button" class="btn-secondary" @click="fetchMyCareerArticles">重试</button>
          </div>
          <div v-else class="career-news">
            <div v-for="article in myArticleList" :key="article.id" class="news-card news-card--my">
              <h3 class="news-title">{{ article.title }}</h3>
              <p class="news-summary">{{ article.summary }}</p>
              <div class="news-meta">
                <span class="news-date">{{ article.publishDate }}</span>
                <span class="news-source">{{ article.category }}</span>
              </div>
              <div class="news-card-actions" @click.stop>
                <button
                  type="button"
                  class="btn-secondary btn-sm"
                  @click="openArticleDetail(article.id)"
                >
                  阅读全文
                </button>
                <button
                  type="button"
                  class="btn-secondary btn-sm"
                  @click="openEditModalByArticle(article)"
                >
                  编辑
                </button>
                <button
                  type="button"
                  class="btn-danger btn-sm"
                  @click="confirmDeleteMyArticle(article.id)"
                >
                  删除
                </button>
              </div>
            </div>
            <div v-if="myArticleList.length === 0" class="career-news-empty">
              您还没有发表过资讯，点击上方「发表资讯」发布一条吧~
            </div>
          </div>
        </template>

        <!-- 资讯详情弹窗 -->
        <div v-if="detailArticle !== null" class="modal-overlay" @click.self="closeDetail">
          <div class="modal-box modal-detail">
            <div v-if="detailLoading" class="detail-loading">加载中...</div>
            <template v-else-if="detailArticleData">
              <div class="modal-header">
                <h3 class="modal-title">{{ detailArticleData.title }}</h3>
                <button type="button" class="modal-close" aria-label="关闭" @click="closeDetail">
                  ×
                </button>
              </div>
              <div class="modal-body">
                <div class="detail-meta">
                  <span>{{ detailArticleData.category }}</span>
                  <span>{{ detailArticleData.publishDate }}</span>
                </div>
                <div
                  class="detail-content"
                  v-html="sanitizeHtml(detailArticleData.fullContent)"
                ></div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn-secondary" @click="closeDetail">关闭</button>
                <template v-if="isCurrentUserAuthor(detailArticleData)">
                  <button
                    type="button"
                    class="btn-secondary"
                    @click="openEditModal(detailArticleData)"
                  >
                    编辑
                  </button>
                  <button type="button" class="btn-danger" @click="confirmDeleteArticle">
                    删除
                  </button>
                </template>
              </div>
            </template>
          </div>
        </div>

        <!-- 发表/编辑资讯弹窗 -->
        <div v-if="showPublishModal" class="modal-overlay" @click.self="closePublishModal">
          <div class="modal-box modal-form">
            <div class="modal-header">
              <h3 class="modal-title">{{ editArticleId ? '编辑资讯' : '发表资讯' }}</h3>
              <button
                type="button"
                class="modal-close"
                aria-label="关闭"
                @click="closePublishModal"
              >
                ×
              </button>
            </div>
            <form class="modal-body publish-form" @submit.prevent="submitPublishOrEdit">
              <div class="form-group">
                <label>标题 <span class="required">*</span></label>
                <input v-model="publishForm.title" type="text" required placeholder="请输入标题" />
              </div>
              <div class="form-group">
                <label>分类 <span class="required">*</span></label>
                <input
                  v-model="publishForm.category"
                  type="text"
                  required
                  placeholder="如：IT行业观察"
                />
              </div>
              <div class="form-group">
                <label>摘要（选填，不填将自动从正文截取）</label>
                <textarea v-model="publishForm.summary" rows="2" placeholder="可选"></textarea>
              </div>
              <div class="form-group">
                <label>正文 <span class="required">*</span></label>
                <textarea
                  v-model="publishForm.fullContent"
                  rows="6"
                  required
                  placeholder="请输入正文"
                ></textarea>
              </div>
              <div class="form-actions">
                <button type="button" class="btn-secondary" @click="closePublishModal">取消</button>
                <button type="submit" class="btn-primary" :disabled="publishSubmitting">
                  {{ publishSubmitting ? '提交中...' : editArticleId ? '保存' : '发表' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import DOMPurify from 'dompurify'
import GlobalNavbar from '@/components/GlobalNavbar.vue'
import { useUserStore } from '../stores/user'
import { api } from '../api'
import type {
  CareerArticle,
  CareerArticleDetail,
  CareerArticleCreateDto,
  CareerDirectionItem,
  CareerDirectionDetail,
} from '../types/career'

// 路由实例
const router = useRouter()

// 用户状态管理
const userStore = useUserStore()

// 检查屏幕尺寸 - 响应式设计
const isMobile = ref(false)
const showSidebar = ref(true)

// 页面内三个主要区域的 DOM 引用，用于滚动定位
const aiSectionRef = ref<HTMLElement | null>(null)
const directionSectionRef = ref<HTMLElement | null>(null)
const newsSectionRef = ref<HTMLElement | null>(null)

// AI 对话相关
const inputMessage = ref('')
type UiChatMessage = {
  role: 'user' | 'ai'
  content: string
  isThinking?: boolean
  statusHint?: string
}
const chatMessages = ref<UiChatMessage[]>([])
const loading = ref(false)
const chatMessagesRef = ref<HTMLElement | null>(null)
const chatInput = ref<HTMLTextAreaElement | null>(null)
const chanId = ref('')
const isStreaming = ref(false)

// 等待时的轮播提示文案
const waitingTips = [
  '正在连接 AI 服务，请稍候…',
  '正在分析您的问题…',
  '正在生成专业建议…',
  '请稍候，马上就好…',
]
const waitingTip = ref(waitingTips[0])
let waitingTipTimer: ReturnType<typeof setInterval> | null = null

// 历史记录相关
const showHistoryPanel = ref(false)
const sessionIds = ref<string[]>([])
const sessionIdsLoading = ref(false)
const sessionIdsError = ref('')
const historyLoading = ref(false)

// 空状态下的示例问题
const suggestionQuestions = [
  '我适合做技术还是产品？',
  '如何准备技术面试？',
  '职业发展路径有哪些选择？',
]

// ---------- 热门职业方向 ----------
const directionCategories = ref<string[]>([])
const careerDirectionList = ref<CareerDirectionItem[]>([])
const selectedDirectionCategory = ref('')
const directionsLoading = ref(false)
const directionsError = ref('')
const showCareerDetailModal = ref(false)
const careerDetailId = ref<number | null>(null)
const careerDetailData = ref<CareerDirectionDetail | null>(null)
const careerDetailLoading = ref(false)
const careerDetailError = ref('')

// ---------- 职业资讯 ----------
const articleList = ref<CareerArticle[]>([])
const articleListLoading = ref(false)
const articleListError = ref('')
const articleCategoryFilter = ref('')
const allCategories = ref<string[]>([])

/** 职业资讯标签：all=全部资讯，my=我发表的资讯 */
const careerArticleTab = ref<'all' | 'my'>('all')
const myArticleList = ref<CareerArticle[]>([])
const myArticleListLoading = ref(false)
const myArticleListError = ref('')

const categoryOptions = computed(() => [...allCategories.value])

const detailArticle = ref<number | null>(null)
const detailArticleData = ref<CareerArticleDetail | null>(null)
const detailLoading = ref(false)

const showPublishModal = ref(false)
const editArticleId = ref<number | null>(null)
const publishForm = ref<CareerArticleCreateDto>({
  title: '',
  fullContent: '',
  category: '',
  summary: '',
})
const publishSubmitting = ref(false)

/** 职业方向大类默认图标 */
const CATEGORY_ICONS: Record<string, string> = {
  '互联网/AI': '💻',
  '电子/通信/半导体': '📡',
  服务业: '🏪',
  管理类: '📋',
  房地产: '🏢',
  设计: '🎨',
  制造业: '🏭',
  教育行业: '📚',
  医学: '⚕️',
  药学: '💊',
  建筑: '🏗️',
  交通: '🚗',
  金融: '💰',
}

// ==================== 工具函数 ====================

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'b',
      'strong',
      'i',
      'em',
      'br',
      'p',
      'div',
      'span',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
    ],
    ALLOWED_ATTR: ['class'],
  })
}

function handleApiResponse<T>(response: any): { success: boolean; data?: T; message?: string } {
  const code = response?.code ?? response?.status
  if (code === 1 || code === 200) {
    return { success: true, data: response?.data }
  }
  return {
    success: false,
    message: response?.msg || response?.message || '操作失败',
  }
}

function startWaitingTipRotation() {
  let i = 0
  waitingTip.value = waitingTips[0]
  waitingTipTimer = setInterval(() => {
    i = (i + 1) % waitingTips.length
    waitingTip.value = waitingTips[i]
  }, 2200)
}

function stopWaitingTipRotation() {
  if (waitingTipTimer) {
    clearInterval(waitingTipTimer)
    waitingTipTimer = null
  }
  waitingTip.value = waitingTips[0]
}

function scrollToBottom() {
  nextTick(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
    }
  })
}

function formatMessage(content: string) {
  return content.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
}

function checkScreenSize() {
  isMobile.value = window.innerWidth <= 1024
  if (!isMobile.value) {
    showSidebar.value = true
  }
}

function toggleSidebar() {
  showSidebar.value = !showSidebar.value
}

function handleNavigation(path: string) {
  router.push(path)
  if (isMobile.value) {
    showSidebar.value = false
  }
}

function scrollToSection(section?: string | null) {
  const key = section || 'ai'
  let target: HTMLElement | null = null

  if (key === 'direction') {
    target = directionSectionRef.value
  } else if (key === 'news') {
    target = newsSectionRef.value
  } else {
    target = aiSectionRef.value
  }

  if (target) {
    const top = target.getBoundingClientRect().top + window.scrollY - 80
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

function getDefaultCareerIcon(category: string): string {
  return CATEGORY_ICONS[category] ?? '💼'
}

function formatSalary(item: { minSalary?: number | null; maxSalary?: number | null }): string {
  const min = item.minSalary
  const max = item.maxSalary
  if (min != null && max != null) return `${min / 1000}-${max / 1000}K`
  if (min != null) return `${min / 1000}K+`
  if (max != null) return `≤${max / 1000}K`
  return ''
}

/** 当前登录用户 ID */
const currentUserId = computed(() => {
  const state = userStore.userState as {
    value?: { userInfo?: { userId?: number } }
    userInfo?: { userId?: number }
  }
  const info = state?.value?.userInfo ?? state?.userInfo
  return info?.userId != null ? Number(info.userId) : null
})

function isCurrentUserAuthor(article: { authorId: number }) {
  if (currentUserId.value == null) return false
  return article.authorId === currentUserId.value
}

// ==================== AI 对话功能 ====================

function setSuggestionAndFocus(s: string) {
  inputMessage.value = s
  nextTick(() => chatInput.value?.focus())
}

const toggleHistoryPanel = () => {
  showHistoryPanel.value = !showHistoryPanel.value
  if (showHistoryPanel.value && sessionIds.value.length === 0 && !sessionIdsLoading.value) {
    refreshSessionIds()
  }
}

const refreshSessionIds = async () => {
  sessionIdsLoading.value = true
  sessionIdsError.value = ''
  try {
    const response = await api.getOpenAiSessionIdList('chat')
    const result = handleApiResponse<string[]>(response)
    if (result.success && result.data) {
      sessionIds.value = result.data
    } else {
      sessionIds.value = []
    }
  } catch (e) {
    sessionIdsError.value = e instanceof Error ? e.message : '加载历史会话失败'
    sessionIds.value = []
  } finally {
    sessionIdsLoading.value = false
  }
}

const normalizeHistoryToUiMessages = (items: any[]): UiChatMessage[] => {
  const messages: UiChatMessage[] = []

  for (const it of items) {
    if (!it) continue

    if (typeof it.role === 'string') {
      const rawRole = it.role.toLowerCase()
      const role: UiChatMessage['role'] =
        rawRole === 'user' ? 'user' : rawRole === 'assistant' || rawRole === 'ai' ? 'ai' : 'ai'
      const content = String(it.content ?? it.message ?? it.text ?? '')
      if (content.trim()) messages.push({ role, content })
      continue
    }

    if (typeof it.isUser === 'boolean') {
      const role: UiChatMessage['role'] = it.isUser ? 'user' : 'ai'
      const content = String(it.content ?? it.message ?? it.text ?? '')
      if (content.trim()) messages.push({ role, content })
      continue
    }

    if (it.question != null || it.answer != null) {
      const q = String(it.question ?? '').trim()
      const a = String(it.answer ?? '').trim()
      if (q) messages.push({ role: 'user', content: q })
      if (a) messages.push({ role: 'ai', content: a })
      continue
    }
  }

  return messages
}

const loadSessionHistory = async (sid: string) => {
  if (!sid || loading.value || historyLoading.value || isStreaming.value) return
  historyLoading.value = true
  try {
    const response = await api.getOpenAiSessionHistory('chat', sid)
    const result = handleApiResponse<any[]>(response)
    if (result.success && result.data) {
      chanId.value = sid
      chatMessages.value = normalizeHistoryToUiMessages(result.data)

      if (chatMessages.value.length === 0) {
        chatMessages.value.push({
          role: 'ai',
          content: '这个会话暂无历史消息。你可以继续提问，我会接着聊。',
        })
      }
    } else {
      throw new Error(result.message)
    }
  } catch (e) {
    console.error('加载会话历史失败:', e)
    chatMessages.value.push({
      role: 'ai',
      content: e instanceof Error ? `加载历史失败：${e.message}` : '加载历史失败，请稍后重试。',
    })
  } finally {
    historyLoading.value = false
    scrollToBottom()
  }
}

const startNewChat = () => {
  chatMessages.value = []
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000)
  chanId.value = `session_${timestamp}_${random}`

  chatMessages.value.push({
    role: 'ai',
    content:
      '我是职业导航智能顾问，我可帮你进行职业测评，职业路径规划，岗位推荐等，你有任何职业上的问题都能来问我',
  })
}

const simulateStreaming = async (text: string, msgIndex: number) => {
  const msg = chatMessages.value[msgIndex]
  if (!msg) return
  msg.isThinking = false
  msg.content = ''
  delete msg.statusHint
  const chars = text.split('')
  for (let i = 0; i < chars.length; i++) {
    if (chatMessages.value[msgIndex]) {
      chatMessages.value[msgIndex].content += chars[i]
    }
    scrollToBottom()
    await new Promise((resolve) => setTimeout(resolve, 30 + Math.random() * 20))
  }
}

const sendMessage = async () => {
  const message = inputMessage.value.trim()
  if (!message || loading.value || isStreaming.value) return

  const userMsg: UiChatMessage = { role: 'user', content: message }
  chatMessages.value.push(userMsg)
  inputMessage.value = ''
  loading.value = true
  isStreaming.value = true
  startWaitingTipRotation()

  const placeholderMsg: UiChatMessage = {
    role: 'ai',
    content: '',
    isThinking: true,
    statusHint: waitingTips[0],
  }
  chatMessages.value.push(placeholderMsg)
  const aiMsgIndex = chatMessages.value.length - 1
  scrollToBottom()

  try {
    const response = await api.sendAiMessage(message, chanId.value)

    // 处理响应 - 可能是包装后的对象，也可能是直接返回的字符串
    let aiResponse = ''

    if (response && typeof response === 'object') {
      // 如果是包装后的响应对象
      const result = handleApiResponse<string>(response)
      if (result.success && result.data) {
        aiResponse = result.data
      } else {
        aiResponse = result.message || '暂无回复，请换个方式提问试试。'
      }
    } else if (typeof response === 'string') {
      // 如果是直接返回的字符串
      aiResponse = response
    } else {
      aiResponse = '暂无回复，请换个方式提问试试。'
    }

    console.log('AI返回内容:', aiResponse)

    if (aiResponse && chatMessages.value[aiMsgIndex]) {
      chatMessages.value[aiMsgIndex].statusHint = '正在生成回复…'
      chatMessages.value[aiMsgIndex].content = ''

      // 安全地检查是否包含特殊字符
      const hasSpecialChars = aiResponse.includes && aiResponse.includes('<')
      console.log('包含特殊字符:', hasSpecialChars)

      await simulateStreaming(aiResponse, aiMsgIndex)
    } else if (chatMessages.value[aiMsgIndex]) {
      chatMessages.value[aiMsgIndex].content = '暂无回复，请换个方式提问试试。'
      chatMessages.value[aiMsgIndex].isThinking = false
      delete chatMessages.value[aiMsgIndex].statusHint
    }

    if (chanId.value && !sessionIds.value.includes(chanId.value)) {
      sessionIds.value = [chanId.value, ...sessionIds.value]
    }
  } catch (err) {
    console.error('AI对话失败:', err)
    if (chatMessages.value[aiMsgIndex]) {
      chatMessages.value[aiMsgIndex].role = 'ai'
      chatMessages.value[aiMsgIndex].content = '抱歉，我遇到了一些问题，请稍后重试。'
      chatMessages.value[aiMsgIndex].isThinking = false
      delete chatMessages.value[aiMsgIndex].statusHint
    } else {
      chatMessages.value.push({
        role: 'ai',
        content: '抱歉，我遇到了一些问题，请稍后重试。',
      })
    }
  } finally {
    stopWaitingTipRotation()
    loading.value = false
    isStreaming.value = false
    scrollToBottom()
  }
}

// ==================== 职业方向功能 ====================

async function fetchDirectionCategories() {
  try {
    const response = await api.getCareerDirectionCategories()
    const result = handleApiResponse<string[]>(response)
    directionCategories.value = result.success && result.data ? result.data : []
  } catch {
    directionCategories.value = []
  }
}

async function fetchCareerDirections() {
  directionsLoading.value = true
  directionsError.value = ''
  const category = selectedDirectionCategory.value.trim() || undefined
  try {
    const response = await api.getCareerDirections(category ? { category } : undefined)
    const result = handleApiResponse<CareerDirectionItem[]>(response)
    careerDirectionList.value = result.success && result.data ? result.data : []
    if (!result.success) {
      directionsError.value = result.message || '加载职业方向列表失败'
    }
  } catch (e) {
    directionsError.value = e instanceof Error ? e.message : '加载职业方向列表失败'
    careerDirectionList.value = []
  } finally {
    directionsLoading.value = false
  }
}

function selectDirectionCategory(cat: string) {
  selectedDirectionCategory.value = cat
  fetchCareerDirections()
}

async function openCareerDetail(id: number) {
  careerDetailId.value = id
  showCareerDetailModal.value = true
  careerDetailData.value = null
  careerDetailError.value = ''
  careerDetailLoading.value = true
  try {
    const response = await api.getCareerDirectionDetail(id)
    const result = handleApiResponse<CareerDirectionDetail>(response)
    if (result.success && result.data) {
      careerDetailData.value = result.data
    } else {
      careerDetailError.value = result.message || '职业方向不存在'
    }
  } catch (e) {
    careerDetailError.value = e instanceof Error ? e.message : '加载详情失败'
  } finally {
    careerDetailLoading.value = false
  }
}

function closeCareerDetail() {
  showCareerDetailModal.value = false
  careerDetailId.value = null
  careerDetailData.value = null
  careerDetailError.value = ''
}

// ==================== 职业资讯功能 ====================

async function fetchCareerArticles() {
  articleListLoading.value = true
  articleListError.value = ''
  const category = articleCategoryFilter.value.trim() || undefined
  try {
    const response = await api.getCareerArticles(category ? { category } : undefined)
    const result = handleApiResponse<CareerArticle[]>(response)

    if (result.success && result.data) {
      const list = result.data
      articleList.value = list

      if (!category) {
        const set = new Set(list.map((a) => a.category).filter(Boolean))
        allCategories.value = [...set].sort()
      } else {
        if (!allCategories.value.includes(category)) {
          allCategories.value = [...allCategories.value, category].sort()
        }
      }
    } else {
      articleList.value = []
      articleListError.value = result.message || '加载资讯列表失败'
    }
  } catch (e) {
    articleListError.value = e instanceof Error ? e.message : '加载资讯列表失败'
    articleList.value = []
  } finally {
    articleListLoading.value = false
  }
}

function onCategoryChange() {
  fetchCareerArticles()
}

function switchCareerTab(tab: 'all' | 'my') {
  careerArticleTab.value = tab
  if (tab === 'my') {
    fetchMyCareerArticles()
  }
}

async function fetchMyCareerArticles() {
  myArticleListLoading.value = true
  myArticleListError.value = ''
  try {
    const response = await api.getMyCareerArticles()
    const result = handleApiResponse<CareerArticle[]>(response)

    if (result.success && result.data) {
      myArticleList.value = result.data
    } else {
      myArticleList.value = []
      myArticleListError.value = result.message || '加载失败'
    }
  } catch (e) {
    myArticleListError.value = e instanceof Error ? e.message : '加载失败'
    myArticleList.value = []
  } finally {
    myArticleListLoading.value = false
  }
}

async function openEditModalByArticle(article: CareerArticle) {
  try {
    const response = await api.getCareerArticleById(article.id)
    const result = handleApiResponse<CareerArticleDetail>(response)
    if (result.success && result.data) {
      openEditModal(result.data)
    } else {
      alert(result.message || '获取资讯详情失败')
    }
  } catch {
    alert('获取资讯详情失败')
  }
}

function confirmDeleteMyArticle(id: number) {
  if (!confirm('确定要删除这条资讯吗？')) return

  api
    .deleteCareerArticle(id)
    .then((response) => {
      const result = handleApiResponse(response)
      if (result.success) {
        fetchMyCareerArticles()
        if (detailArticleData.value?.id === id) closeDetail()
      } else {
        alert(result.message || '删除失败')
      }
    })
    .catch((e) => {
      alert(e instanceof Error ? e.message : '删除失败')
    })
}

async function openArticleDetail(id: number) {
  detailArticle.value = id
  detailArticleData.value = null
  detailLoading.value = true

  try {
    const response = await api.getCareerArticleById(id)
    const result = handleApiResponse<CareerArticleDetail>(response)
    if (result.success && result.data) {
      detailArticleData.value = result.data
    }
  } catch {
    detailArticleData.value = null
  } finally {
    detailLoading.value = false
  }
}

function closeDetail() {
  detailArticle.value = null
  detailArticleData.value = null
}

function openPublishModal() {
  editArticleId.value = null
  publishForm.value = { title: '', fullContent: '', category: '', summary: '' }
  showPublishModal.value = true
}

function closePublishModal() {
  showPublishModal.value = false
  editArticleId.value = null
}

function openEditModal(article: CareerArticleDetail) {
  editArticleId.value = article.id
  publishForm.value = {
    title: article.title,
    fullContent: article.fullContent,
    category: article.category,
    summary: article.summary || '',
  }
  showPublishModal.value = true
}

async function submitPublishOrEdit() {
  const { title, fullContent, category, summary } = publishForm.value
  if (!title.trim() || !fullContent.trim() || !category.trim()) return

  publishSubmitting.value = true
  try {
    const id = editArticleId.value
    const payload: CareerArticleCreateDto = {
      title: title.trim(),
      fullContent: fullContent.trim(),
      category: category.trim(),
    }
    const summaryVal = summary?.trim()
    if (summaryVal) payload.summary = summaryVal

    let response
    if (id != null) {
      response = await api.updateCareerArticle(id, payload)
    } else {
      response = await api.createCareerArticle(payload)
    }

    const result = handleApiResponse(response)

    if (result.success) {
      closePublishModal()
      closeDetail()
      await fetchCareerArticles()
      if (careerArticleTab.value === 'my') await fetchMyCareerArticles()
    } else {
      alert(result.message || (id != null ? '更新失败' : '发表失败'))
    }
  } catch (e) {
    alert(e instanceof Error ? e.message : '操作失败')
  } finally {
    publishSubmitting.value = false
  }
}

function confirmDeleteArticle() {
  if (!detailArticleData.value) return
  if (!confirm('确定要删除这条资讯吗？')) return

  const id = detailArticleData.value.id
  api
    .deleteCareerArticle(id)
    .then((response) => {
      const result = handleApiResponse(response)
      if (result.success) {
        closeDetail()
        fetchCareerArticles()
        if (careerArticleTab.value === 'my') fetchMyCareerArticles()
      } else {
        alert(result.message || '删除失败')
      }
    })
    .catch((e) => {
      alert(e instanceof Error ? e.message : '删除失败')
    })
}

// ==================== 生命周期 ====================

onMounted(async () => {
  try {
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)

    await Promise.allSettled([
      refreshSessionIds().catch(console.error),
      fetchDirectionCategories().catch(console.error),
      fetchCareerDirections().catch(console.error),
      fetchCareerArticles().catch(console.error),
    ])

    startNewChat()

    const initialSection = router.currentRoute.value.query.section as string | undefined
    if (initialSection) {
      nextTick(() => {
        scrollToSection(initialSection)
      })
    }
  } catch (error) {
    console.error('初始化失败:', error)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
  if (waitingTipTimer) {
    clearInterval(waitingTipTimer)
  }
})

watch(
  () => router.currentRoute.value.query.section,
  (val) => {
    nextTick(() => {
      scrollToSection(val as string | undefined)
    })
  },
)
</script>

<style scoped>
/* ==================== 全局变量 ==================== */
:root {
  --primary-color: #165dff;
  --primary-color-dark: #0e46cc;
  --primary-color-light: #4c8aff;
  --accent-color: #f53f3f;
  --accent-color-dark: #e13d3d;
  --accent-color-light: #f76d6d;
  --bg-color: #f5f7fa;
  --bg-color-light: #fafafb;
  --bg-color-dark: #eef1f5;
  --text-color: #1d2129;
  --text-color-secondary: #4e5969;
  --text-color-light: #86909c;
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

/* ==================== 主容器 ==================== */
.career-navigation {
  min-height: 100vh;
  background-color: #f5f7fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  display: flex;
  flex-direction: column;
}

/* ==================== 主体内容区 ==================== */
.main-content {
  display: flex;
  flex: 1;
  margin-top: 60px;
  position: relative;
}

/* ==================== 左侧垂直导航栏 ==================== */
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
  transition: transform 0.3s ease;
  z-index: 99;
}

.sidebar-menu {
  padding: 0 16px;
}

.sidebar-section {
  margin-bottom: 24px;
}

.sidebar-section .section-title {
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

/* ==================== 右侧主内容区 ==================== */
.content-area {
  margin-left: 220px;
  flex: 1;
  padding: 24px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
  transition: margin-left 0.3s ease;
}

/* 移动端菜单按钮 */
.mobile-menu-toggle {
  display: none;
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  border: none;
  box-shadow: var(--shadow-lg);
  cursor: pointer;
  z-index: 100;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.mobile-menu-toggle:hover {
  background: var(--primary-color-dark);
}

/* ==================== 页面标题 ==================== */
.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 24px 0;
}

/* ==================== 按钮样式 ==================== */
.btn-primary {
  width: 100%;
  padding: 10px 20px;
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
  background-color: #a0cfff;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 8px 16px;
  background-color: transparent;
  color: #409eff;
  border: 1px solid #409eff;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #f0f9ff;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger {
  padding: 8px 16px;
  background: var(--accent-color);
  color: #fff;
  border: 1px solid var(--accent-color);
  border-radius: var(--border-radius-md);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-danger:hover:not(:disabled) {
  background: var(--accent-color-dark);
  border-color: var(--accent-color-dark);
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}

/* ==================== AI 咨询区域 ==================== */
.ai-chat-section {
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 0;
  margin-bottom: 32px;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.06),
    0 0 0 1px rgba(85, 104, 211, 0.04);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  background: linear-gradient(135deg, #5568d3 0%, #6b4ba2 100%);
  box-shadow: 0 2px 12px rgba(85, 104, 211, 0.25);
}

.chat-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.chat-header-icon {
  font-size: 28px;
  line-height: 1;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.chat-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: white;
  letter-spacing: 0.3px;
}

.chat-subtitle {
  margin: 4px 0 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.88);
  font-weight: 400;
}

.chat-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.history-btn,
.new-chat-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.history-btn:hover:not(:disabled),
.new-chat-btn:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.history-btn:disabled,
.new-chat-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 16px;
}

.btn-text {
  font-size: 14px;
}

.chat-body {
  display: flex;
  min-height: 380px;
}

/* 历史记录面板 */
.chat-history-panel {
  width: 260px;
  border-right: 1px solid #e0e6ed;
  background: #ffffff;
  display: flex;
  flex-direction: column;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 14px;
  border-bottom: 1px solid #eef2f7;
  background: #fbfcff;
}

.history-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.history-refresh-btn,
.history-retry-btn {
  padding: 6px 10px;
  font-size: 12px;
  border-radius: 6px;
  border: 1px solid #dcdfe6;
  background: #fff;
  color: #409eff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.history-refresh-btn:hover:not(:disabled),
.history-retry-btn:hover:not(:disabled) {
  background: #f0f9ff;
}

.history-refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.history-loading,
.history-empty {
  padding: 14px;
  font-size: 13px;
  color: #909399;
  text-align: center;
}

.history-error {
  padding: 14px;
  color: #f56c6c;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-error-text {
  font-size: 13px;
  line-height: 1.4;
  text-align: center;
}

.history-list {
  padding: 10px;
  overflow-y: auto;
  flex: 1;
}

.history-item {
  padding: 10px;
  border-radius: 10px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 4px;
}

.history-item:hover {
  background: #f5f7fa;
}

.history-item.active {
  background: #ecf5ff;
  border-color: #b3d8ff;
}

.history-item-title {
  font-size: 12px;
  color: #606266;
  word-break: break-all;
  line-height: 1.3;
}

/* 聊天主区域 */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  min-height: 320px;
  max-height: calc(100vh - 320px);
}

/* 空状态 */
.chat-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  padding: 32px;
  text-align: center;
}

.empty-state-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.9;
}

.empty-state-title {
  font-size: 18px;
  font-weight: 600;
  color: #334155;
  margin: 0 0 8px 0;
}

.empty-state-desc {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.empty-state-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  max-width: 480px;
}

.suggestion-chip {
  padding: 10px 18px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #475569;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.suggestion-chip:hover {
  border-color: #5568d3;
  color: #5568d3;
  background: #f8fafc;
  box-shadow: 0 2px 8px rgba(85, 104, 211, 0.15);
}

/* 等待 AI 时的提示条 */
.chat-waiting-hint {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: linear-gradient(90deg, #eef2ff 0%, #e0e7ff 100%);
  border-top: 1px solid #c7d2fe;
  font-size: 13px;
  color: #4338ca;
  font-weight: 500;
}

.waiting-hint-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6366f1;
  animation: waiting-pulse 1.2s ease-in-out infinite;
}

@keyframes waiting-pulse {
  0%,
  100% {
    opacity: 0.4;
    transform: scale(0.9);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

.waiting-hint-text {
  flex: 1;
}

/* 消息项 */
.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: flex-start;
}

.message-item.user {
  justify-content: flex-end;
}

.message-item.ai {
  justify-content: flex-start;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.message-item.user .message-avatar {
  order: 2;
}

.message-item.ai .message-avatar {
  order: 1;
}

.user-avatar {
  background: linear-gradient(135deg, #6366f1 0%, #5568d3 100%);
  color: white;
  box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);
}

.ai-avatar {
  background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
  color: white;
  box-shadow: 0 2px 6px rgba(99, 102, 241, 0.2);
}

.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
}

.message-item.user .message-content {
  order: 1;
  align-items: flex-end;
}

.message-item.ai .message-content {
  order: 2;
  align-items: flex-start;
}

.message-text {
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.6;
  word-wrap: break-word;
  display: inline-block;
  max-width: 100%;
}

.message-item.user .message-text {
  background: linear-gradient(135deg, #6366f1 0%, #5568d3 100%);
  color: white;
  border-bottom-right-radius: 4px;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
}

.message-item.ai .message-text {
  background-color: white;
  color: #334155;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.thinking-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  border-radius: 14px;
  border: 1px solid #c7d2fe;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.08);
}

.thinking-dots {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.thinking-dots span {
  width: 8px;
  height: 8px;
  background-color: #6366f1;
  border-radius: 50%;
  animation: thinking-bounce 1.4s infinite ease-in-out both;
}

.thinking-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.thinking-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

.thinking-dots span:nth-child(3) {
  animation-delay: 0s;
}

@keyframes thinking-bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.thinking-text {
  font-size: 14px;
  color: #4338ca;
  font-weight: 500;
}

/* 输入区域 */
.chat-input-area {
  padding: 16px 20px;
  border-top: 1px solid #e2e8f0;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.chat-input {
  flex: 1;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  resize: none;
  font-family: inherit;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
  min-height: 52px;
}

.chat-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.chat-input::placeholder {
  color: #94a3b8;
}

.send-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #6366f1 0%, #5568d3 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
  min-width: 80px;
}

.send-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.send-btn:disabled {
  background-color: #c0c4cc;
  cursor: not-allowed;
  box-shadow: none;
}

.send-btn .loading-icon {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 6px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ==================== 职业方向区域 ==================== */
.content-area .section-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 32px 0 20px 0;
}

.content-area .section-title:first-of-type {
  margin-top: 0;
}

.career-direction-tabs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.career-direction-tabs .tab-btn {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #646b7a;
  background: #fff;
  border: 1px solid #e0e6ed;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.career-direction-tabs .tab-btn:hover {
  color: #409eff;
  border-color: #79bbff;
}

.career-direction-tabs .tab-btn.active {
  color: #fff;
  background: #409eff;
  border-color: #409eff;
}

.career-directions-loading,
.career-directions-error {
  padding: 24px;
  text-align: center;
  color: #646b7a;
}

.career-directions-error .btn-secondary {
  margin-top: 12px;
}

.career-directions-empty {
  grid-column: 1 / -1;
  padding: 40px 24px;
  text-align: center;
  color: #646b7a;
  font-size: 14px;
}

.career-directions {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 24px;
}

.career-card {
  background-color: white;
  border: 1px solid #e0e6ed;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.career-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.career-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background-color: #f0f9ff;
  border-radius: 50%;
  margin: 0 0 16px 0;
}

.career-icon .icon {
  font-size: 24px;
  color: #409eff;
}

.career-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.career-description {
  font-size: 14px;
  color: #646b7a;
  margin: 0 0 16px 0;
  line-height: 1.5;
  flex: 1;
}

.skills {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.skill-tag {
  padding: 2px 8px;
  background-color: #f0f9ff;
  color: #409eff;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.salary {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.salary-icon {
  font-size: 16px;
  color: #67c23a;
}

.salary-text {
  font-size: 14px;
  color: #67c23a;
  font-weight: 500;
}

/* ==================== 职业资讯区域 ==================== */
.career-news-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  margin-bottom: 16px;
}

.career-news-tabs .tab-btn {
  padding: 8px 20px;
  font-size: 14px;
  font-weight: 500;
  color: #646b7a;
  background: #fff;
  border: 1px solid #e0e6ed;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.career-news-tabs .tab-btn:hover {
  color: #409eff;
  border-color: #79bbff;
}

.career-news-tabs .tab-btn.active {
  color: #fff;
  background: #409eff;
  border-color: #409eff;
}

.career-news-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.career-news-toolbar--my {
  margin-top: 0;
}

.news-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 14px;
  color: #646b7a;
}

.filter-select {
  padding: 8px 32px 8px 12px;
  border: 1px solid #e0e6ed;
  border-radius: 6px;
  font-size: 14px;
  min-width: 160px;
  background-color: #fff;
  cursor: pointer;
  appearance: auto;
}

.publish-btn {
  flex-shrink: 0;
}

.career-news-loading,
.career-news-error {
  padding: 24px;
  text-align: center;
  color: #646b7a;
}

.career-news-error {
  color: var(--accent-color);
}

.career-news-empty {
  grid-column: 1 / -1;
  padding: 32px;
  text-align: center;
  color: #86909c;
  font-size: 14px;
}

.career-news {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  margin-top: 20px;
}

.news-card {
  background-color: white;
  border: 1px solid #e0e6ed;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.news-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.news-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.news-summary {
  font-size: 14px;
  color: #646b7a;
  margin: 0 0 16px 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.news-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  font-size: 12px;
  color: #86909c;
}

.news-date,
.news-source {
  display: flex;
  align-items: center;
}

.news-card--my .news-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

/* ==================== 弹窗样式 ==================== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-box {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
  max-width: 560px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-detail {
  max-width: 640px;
}

.modal-career-detail {
  max-width: 720px;
}

.modal-form {
  max-width: 560px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  line-height: 1;
  color: #4e5969;
  cursor: pointer;
  padding: 0 4px;
  transition: color 0.3s ease;
}

.modal-close:hover {
  color: #1d2129;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
}

/* 职业方向详情 */
.career-detail-desc {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #646b7a;
  line-height: 1.6;
}

.career-detail-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.career-detail-salary {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #67c23a;
  font-weight: 500;
}

.career-detail-block {
  margin-bottom: 16px;
}

.career-detail-label {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.career-detail-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
}

.detail-content-html {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
  font-size: 14px;
  line-height: 1.7;
  color: #333;
}

/* 资讯详情 */
.detail-loading {
  padding: 24px;
  text-align: center;
  color: #4e5969;
}

.detail-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #4e5969;
}

.detail-content {
  font-size: 15px;
  line-height: 1.7;
  color: #1d2129;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 发表表单 */
.publish-form .form-group {
  margin-bottom: 16px;
}

.publish-form .form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  color: #1d2129;
}

.publish-form .form-group .required {
  color: #f53f3f;
}

.publish-form .form-group input,
.publish-form .form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
  font-family: inherit;
}

.publish-form .form-group input:focus,
.publish-form .form-group textarea:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.publish-form .form-group textarea {
  resize: vertical;
  min-height: 60px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
}

/* ==================== 响应式设计 ==================== */
@media (max-width: 1400px) {
  .career-directions {
    grid-template-columns: repeat(4, 1fr);
  }

  .career-news {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 1200px) {
  .career-directions {
    grid-template-columns: repeat(3, 1fr);
  }

  .career-news {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 992px) {
  .sidebar {
    width: 200px;
  }

  .content-area {
    margin-left: 200px;
  }

  .career-directions {
    grid-template-columns: repeat(3, 1fr);
  }

  .career-news {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(0);
    width: 250px;
    z-index: 100;
  }

  .sidebar.sidebar-hidden {
    transform: translateX(-100%);
  }

  .content-area {
    margin-left: 0;
    padding: 16px;
    width: 100%;
  }

  .mobile-menu-toggle {
    display: flex;
  }

  .chat-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 16px 20px;
  }

  .chat-header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .chat-title {
    font-size: 18px;
  }

  .chat-subtitle {
    font-size: 12px;
  }

  .history-btn,
  .new-chat-btn {
    padding: 6px 12px;
    font-size: 13px;
  }

  .btn-text {
    display: inline;
  }

  .chat-body {
    flex-direction: column;
  }

  .chat-history-panel {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e0e6ed;
    max-height: 250px;
  }

  .chat-messages {
    max-height: 350px;
    padding: 16px;
  }

  .message-avatar {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }

  .message-content {
    max-width: 85%;
  }

  .message-text {
    padding: 10px 14px;
    font-size: 14px;
  }

  .chat-input-area {
    padding: 12px;
  }

  .chat-input {
    padding: 10px 12px;
    font-size: 14px;
  }

  .send-btn {
    padding: 10px 16px;
    font-size: 14px;
    min-width: 70px;
  }

  .career-directions {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .career-news {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .career-card,
  .news-card {
    padding: 16px;
  }

  .career-icon {
    width: 50px;
    height: 50px;
  }

  .career-icon .icon {
    font-size: 20px;
  }

  .modal-box {
    max-width: 90%;
    max-height: 80vh;
  }

  .modal-header {
    padding: 12px 16px;
  }

  .modal-body {
    padding: 16px;
  }

  .modal-footer {
    padding: 12px 16px;
  }

  .publish-form .form-group input,
  .publish-form .form-group textarea {
    font-size: 16px;
  }
}

@media (max-width: 576px) {
  .career-direction-tabs {
    gap: 6px;
  }

  .career-direction-tabs .tab-btn {
    padding: 6px 12px;
    font-size: 13px;
  }

  .career-directions {
    grid-template-columns: 1fr;
  }

  .career-news {
    grid-template-columns: 1fr;
  }

  .career-news-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .news-filter {
    width: 100%;
  }

  .filter-select {
    width: 100%;
  }

  .publish-btn {
    width: 100%;
  }

  .chat-history-panel {
    max-height: 200px;
  }

  .history-item-title {
    font-size: 11px;
  }

  .message-content {
    max-width: 90%;
  }

  .empty-state-suggestions {
    flex-direction: column;
    width: 100%;
  }

  .suggestion-chip {
    width: 100%;
  }
}

/* 打印样式 */
@media print {
  .sidebar,
  .chat-header-actions,
  .chat-input-area,
  .btn-secondary,
  .btn-primary,
  .btn-danger,
  .mobile-menu-toggle {
    display: none !important;
  }

  .content-area {
    margin-left: 0 !important;
  }

  .career-card,
  .news-card {
    break-inside: avoid;
    box-shadow: none;
    border: 1px solid #ddd;
  }
}
</style>
