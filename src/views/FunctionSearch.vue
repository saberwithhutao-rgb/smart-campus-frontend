<template>
  <div class="function-search-page">
    <GlobalNavbar />

    <div class="search-container">
      <div class="search-hero">
        <h1 class="search-title">
          <span class="title-gradient">🔍 功能搜索</span>
        </h1>
        <p class="search-subtitle">搜索你想了解的功能，查看详细使用说明</p>

        <div class="search-input-wrapper">
          <input
            type="text"
            v-model="keyword"
            @keyup.enter="search"
            placeholder="输入功能名称，例如：登录、学习计划、文件上传..."
            class="search-input"
            autofocus
          />
          <button @click="search" class="search-button" :disabled="loading">
            <span v-if="loading" class="loading-icon"></span>
            <span v-else>🔍</span>
            {{ loading ? '搜索中...' : '搜索' }}
          </button>
        </div>
      </div>

      <!-- 热门功能（未搜索时显示） -->
      <div class="hot-section" v-if="!hasSearched && !loading">
        <div class="section-title">
          <span class="title-icon">🔥</span>
          热门功能
          <span class="title-hint">点击快速搜索</span>
        </div>
        <div class="hot-tags">
          <span v-for="hot in hotFunctions" :key="hot" @click="quickSearch(hot)" class="hot-tag">
            <span class="tag-icon">{{ getHotIcon(hot) }}</span>
            {{ hot }}
          </span>
        </div>
      </div>

      <!-- 搜索结果列表 -->
      <div class="result-section" v-if="hasSearched">
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <span>搜索中...</span>
        </div>

        <!-- 搜索结果统计 -->
        <div v-else-if="searchResults.length > 0" class="result-stats">
          <span class="stats-icon">📋</span>
          找到 <strong>{{ searchResults.length }}</strong> 个相关功能
        </div>

        <!-- 搜索结果列表 -->
        <div v-if="searchResults.length > 0" class="result-list">
          <div
            v-for="(result, index) in searchResults"
            :key="index"
            class="result-item"
            @click="openDetail(result)"
          >
            <div class="result-item-left">
              <div class="result-icon">📘</div>
            </div>
            <div class="result-item-right">
              <h3 class="result-item-title">{{ result.title }}</h3>
              <div class="result-item-summary">{{ result.summary }}</div>
              <div class="result-item-meta">
                <span class="meta-tag">使用指南</span>
                <span class="meta-path">{{ result.path }}</span>
              </div>
            </div>
            <div class="result-item-arrow">→</div>
          </div>
        </div>

        <!-- 无结果 -->
        <div v-else-if="!loading" class="empty-state">
          <div class="empty-icon">🔍</div>
          <div class="empty-title">未找到相关功能</div>
          <div class="empty-desc">
            没有找到与「<span class="empty-keyword">{{ keyword }}</span
            >」相关的功能说明
          </div>
          <div class="empty-suggestion">
            <div class="suggestion-text">试试搜索这些热门功能：</div>
            <div class="suggestion-tags">
              <span
                v-for="hot in hotFunctions"
                :key="hot"
                @click="quickSearch(hot)"
                class="suggestion-tag"
              >
                {{ hot }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GlobalNavbar from '@/components/GlobalNavbar.vue'
import { ElMessage } from 'element-plus'
import { marked } from 'marked'

const router = useRouter()
const route = useRoute()

marked.setOptions({
  breaks: true,
  gfm: true,
})

interface SearchResult {
  title: string
  path: string
  summary: string
  content: string
}

interface DocIndex {
  title: string
  path: string
  fileName: string
}

const keyword = ref('')
const loading = ref(false)
const hasSearched = ref(false)
const searchResults = ref<SearchResult[]>([])

const hotFunctions = ['登录', '注册', '学习计划', '复习建议', '文件上传', '学习任务', '统计']

// 获取热门功能图标
const getHotIcon = (hot: string) => {
  const iconMap: Record<string, string> = {
    登录: '🔐',
    注册: '📝',
    学习计划: '📅',
    复习建议: '🧠',
    文件上传: '📎',
    学习任务: '✅',
    统计: '📊',
  }
  return iconMap[hot] || '⭐'
}

// 文档索引
const docIndex = ref<DocIndex[]>([])

// 内容缓存
const contentCache = new Map<string, string>()

// 加载文档索引
const loadDocsIndex = async () => {
  try {
    const response = await fetch('/docs-index.json')
    if (!response.ok) throw new Error('加载索引失败')
    docIndex.value = await response.json()
    console.log(`加载了 ${docIndex.value.length} 个文档`)
  } catch (error) {
    console.error('加载文档索引失败:', error)
    ElMessage.error('加载文档索引失败')
  }
}

// 读取 Markdown 文件
const loadMarkdown = async (path: string): Promise<string> => {
  if (contentCache.has(path)) {
    return contentCache.get(path)!
  }
  try {
    const response = await fetch(path)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const content = await response.text()
    contentCache.set(path, content)
    return content
  } catch (error) {
    console.error('加载文档失败:', path, error)
    return ''
  }
}

// 从 Markdown 提取正文和摘要
const extractFromMarkdown = (markdown: string): { content: string; summary: string } => {
  // 移除 frontmatter
  let body = markdown.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '')
  // 移除标题
  body = body.replace(/^#\s+.*\n/, '')

  // 提取纯文本用于摘要
  const plainText = body
    .replace(/[#*`>\[\]()|]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
  const summary = plainText.length > 120 ? plainText.substring(0, 120) + '...' : plainText

  return { content: body, summary }
}

// 执行搜索
const search = async () => {
  const searchKeyword = keyword.value.trim()
  if (!searchKeyword) {
    ElMessage.warning('请输入要搜索的功能名称')
    return
  }

  loading.value = true
  hasSearched.value = true
  searchResults.value = []

  const lowerKeyword = searchKeyword.toLowerCase()
  const results: SearchResult[] = []

  for (const doc of docIndex.value) {
    try {
      const markdown = await loadMarkdown(doc.path)
      if (!markdown) continue

      const { content, summary } = extractFromMarkdown(markdown)
      const fullText = (doc.title + ' ' + content).toLowerCase()

      if (fullText.includes(lowerKeyword)) {
        results.push({
          title: doc.title,
          path: doc.path,
          summary,
          content,
        })
      }
    } catch (error) {
      console.error('搜索文档失败:', doc.path, error)
    }
  }

  // 按标题匹配度排序
  results.sort((a, b) => {
    const aTitleMatch = a.title.toLowerCase().includes(lowerKeyword) ? 1 : 0
    const bTitleMatch = b.title.toLowerCase().includes(lowerKeyword) ? 1 : 0
    if (aTitleMatch !== bTitleMatch) return bTitleMatch - aTitleMatch
    return a.title.length - b.title.length
  })

  searchResults.value = results
  loading.value = false
}

// 打开文档详情
const openDetail = (result: SearchResult) => {
  router.push({
    path: '/doc-detail',
    query: {
      path: result.path,
      title: result.title,
    },
  })
}

// 快速搜索
const quickSearch = (hot: string) => {
  keyword.value = hot
  search()
}

// 从 URL 参数初始化
const initFromUrl = () => {
  const q = route.query.q as string
  if (q) {
    keyword.value = q
    search()
  }
}

onMounted(async () => {
  await loadDocsIndex()
  initFromUrl()
})
</script>

<style scoped>
.function-search-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--color-bg) 0%, var(--color-bg-dark) 100%);
  padding-top: 70px;
}

.search-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 24px;
}

/* ==================== 搜索头部 ==================== */
.search-hero {
  text-align: center;
  margin-bottom: 48px;
}

.search-title {
  font-size: 42px;
  font-weight: 700;
  margin-bottom: 12px;
}

.title-gradient {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-active) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.search-subtitle {
  font-size: 16px;
  color: var(--color-text-secondary);
  letter-spacing: 0.3px;
}

.search-input-wrapper {
  display: flex;
  gap: 12px;
  margin-top: 32px;
}

.search-input {
  flex: 1;
  padding: 16px 24px;
  font-size: 16px;
  border: 2px solid var(--color-border);
  border-radius: 60px;
  outline: none;
  transition: all var(--transition-normal);
  background: var(--color-bg-card);
  color: var(--color-text);
  letter-spacing: 0.3px;
}

.search-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px var(--color-primary-light);
}

.search-input::placeholder {
  color: var(--color-text-placeholder);
  letter-spacing: 0.3px;
}

.search-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 32px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-active) 100%);
  color: white;
  border: none;
  border-radius: 60px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
  letter-spacing: 0.5px;
}

.search-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px var(--color-primary-light);
}

.search-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-icon {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ==================== 热门功能 ==================== */
.hot-section {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: 28px 32px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-primary-light);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 22px;
}

.title-hint {
  font-size: 12px;
  font-weight: 400;
  color: var(--color-text-light);
  margin-left: 8px;
}

.hot-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.hot-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: var(--color-bg-light);
  border-radius: 40px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  cursor: pointer;
  transition: all var(--transition-normal);
  letter-spacing: 0.3px;
}

.hot-tag:hover {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-active) 100%);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--color-primary-light);
}

.tag-icon {
  font-size: 14px;
}

/* ==================== 搜索结果 ==================== */
.result-section {
  margin-top: 24px;
}

.result-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  color: var(--color-text-light);
  font-size: 14px;
  border: 1px solid var(--color-border);
  margin-bottom: 20px;
}

.stats-icon {
  font-size: 16px;
}

.result-stats strong {
  color: var(--color-primary);
  font-size: 16px;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px 24px;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.result-item:hover {
  border-color: var(--color-primary);
  box-shadow: 0 8px 24px var(--color-primary-light);
  transform: translateY(-3px);
}

.result-item-left {
  flex-shrink: 0;
}

.result-icon {
  font-size: 32px;
}

.result-item-right {
  flex: 1;
}

.result-item-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 8px 0;
  letter-spacing: 0.5px;
}

.result-item-summary {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.7;
  letter-spacing: 0.3px;
  margin-bottom: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-item-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.meta-tag {
  display: inline-block;
  padding: 3px 10px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.meta-path {
  font-size: 11px;
  color: var(--color-text-light);
  font-family: monospace;
}

.result-item-arrow {
  font-size: 20px;
  color: var(--color-text-light);
  transition: all var(--transition-normal);
}

.result-item:hover .result-item-arrow {
  color: var(--color-primary);
  transform: translateX(4px);
}

/* ==================== 加载状态 ==================== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 60px;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.loading-spinner {
  width: 44px;
  height: 44px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* ==================== 空状态 ==================== */
.empty-state {
  text-align: center;
  padding: 60px 40px;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.6;
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.empty-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: 28px;
  letter-spacing: 0.3px;
}

.empty-keyword {
  color: var(--color-primary);
  font-weight: 500;
}

.suggestion-text {
  font-size: 13px;
  color: var(--color-text-light);
  margin-bottom: 12px;
}

.suggestion-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.suggestion-tag {
  padding: 8px 18px;
  background: var(--color-bg-light);
  border-radius: 30px;
  font-size: 13px;
  color: var(--color-text);
  cursor: pointer;
  transition: all var(--transition-fast);
  letter-spacing: 0.3px;
}

.suggestion-tag:hover {
  background: var(--color-primary);
  color: white;
}

/* ==================== 响应式 ==================== */
@media (max-width: 768px) {
  .search-container {
    padding: 24px 16px;
  }

  .search-title {
    font-size: 28px;
  }

  .search-subtitle {
    font-size: 14px;
  }

  .search-input-wrapper {
    flex-direction: column;
  }

  .search-button {
    padding: 14px;
    justify-content: center;
  }

  .hot-section {
    padding: 20px;
  }

  .result-item {
    padding: 16px;
    flex-wrap: wrap;
  }

  .result-item-left {
    display: none;
  }

  .result-item-arrow {
    display: none;
  }

  .result-item-title {
    font-size: 16px;
  }

  .result-item-summary {
    font-size: 13px;
  }

  .empty-state {
    padding: 40px 20px;
  }
}
</style>
