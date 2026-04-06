<template>
  <div class="function-search-page">
    <GlobalNavbar />

    <div class="search-container">
      <div class="search-hero">
        <h1 class="search-title">🔍 功能搜索</h1>
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
            {{ loading ? '搜索中...' : '搜索' }}
          </button>
        </div>
      </div>

      <!-- 热门功能（未搜索时显示） -->
      <div class="hot-section" v-if="!hasSearched && !loading">
        <div class="section-title">
          <span class="title-icon">🔥</span>
          热门功能
        </div>
        <div class="hot-tags">
          <span v-for="hot in hotFunctions" :key="hot" @click="quickSearch(hot)" class="hot-tag">
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
          找到 {{ searchResults.length }} 个相关功能
        </div>

        <!-- 搜索结果列表 -->
        <div v-if="searchResults.length > 0" class="result-list">
          <div
            v-for="(result, index) in searchResults"
            :key="index"
            class="result-item"
            @click="openDetail(result)"
          >
            <h3 class="result-item-title">{{ result.title }}</h3>
            <div class="result-item-summary">{{ result.summary }}</div>
            <div class="result-item-path">{{ result.path }}</div>
          </div>
        </div>

        <!-- 无结果 -->
        <div v-else-if="!loading" class="empty-state">
          <div class="empty-icon">🔍</div>
          <div class="empty-title">未找到相关功能</div>
          <div class="empty-desc">没有找到与「{{ keyword }}」相关的功能说明</div>
          <div class="empty-suggestion">
            <div>试试搜索：</div>
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

    <!-- 文档详情弹窗 -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetail">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">{{ currentDoc?.title }}</h2>
          <button class="modal-close" @click="closeDetail">×</button>
        </div>
        <div class="modal-body" v-html="currentDocContent"></div>
        <div class="modal-footer">
          <button class="modal-btn" @click="closeDetail">关闭</button>
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

const route = useRoute()

const keyword = ref('')
const loading = ref(false)
const hasSearched = ref(false)
const searchResults = ref<SearchResult[]>([])

// 详情弹窗
const showDetailModal = ref(false)
const currentDoc = ref<SearchResult | null>(null)
const currentDocContent = ref('')

const hotFunctions = ['登录', '注册', '学习计划', '复习建议', '文件上传', '学习任务', '统计']

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
  const summary = plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText

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

  // 按标题匹配度排序（标题包含关键词的排前面）
  results.sort((a, b) => {
    const aTitleMatch = a.title.toLowerCase().includes(lowerKeyword) ? 1 : 0
    const bTitleMatch = b.title.toLowerCase().includes(lowerKeyword) ? 1 : 0
    return bTitleMatch - aTitleMatch
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

// 关闭详情弹窗
const closeDetail = () => {
  showDetailModal.value = false
  currentDoc.value = null
  currentDocContent.value = ''
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
/* 添加弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--color-bg-card);
  border-radius: 16px;
  width: 90%;
  max-width: 800px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: var(--color-text-light);
  transition: color 0.2s;
}

.modal-close:hover {
  color: var(--color-danger);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  line-height: 1.8;
  color: var(--color-text-secondary);
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
}

.modal-btn {
  padding: 8px 24px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.modal-btn:hover {
  background: var(--color-primary-hover);
}

/* 搜索结果列表样式 */
.result-stats {
  padding: 12px 0;
  color: var(--color-text-light);
  font-size: 14px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 20px;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-item {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.result-item:hover {
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.result-item-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-primary);
  margin: 0 0 8px 0;
}

.result-item-summary {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: 8px;
}

.result-item-path {
  font-size: 12px;
  color: var(--color-text-light);
}

/* 原有样式保留，省略重复部分 */
</style>
