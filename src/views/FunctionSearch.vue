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

      <!-- 搜索结果 -->
      <div class="result-section" v-if="hasSearched">
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <span>搜索中...</span>
        </div>

        <div v-else-if="searchResult" class="result-card">
          <div class="result-header">
            <span class="result-icon">📘</span>
            <h2 class="result-title">{{ searchResult.title }}</h2>
          </div>
          <div class="result-content">{{ searchResult.content }}</div>
        </div>

        <div v-else class="empty-state">
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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import GlobalNavbar from '@/components/GlobalNavbar.vue'
import { ElMessage } from 'element-plus'
import { api } from '@/api/index'
import type { FunctionSearchResult } from '@/api/index'

const router = useRouter()
const route = useRoute()

const keyword = ref('')
const loading = ref(false)
const hasSearched = ref(false)
const searchResult = ref<FunctionSearchResult | null>(null)

const hotFunctions = ['登录', '注册', '学习计划', '复习建议', '文件上传', '学习任务', '统计']

// 从 URL 参数初始化搜索
const initFromUrl = () => {
  const q = route.query.q as string
  if (q) {
    keyword.value = q
    search()
  }
}

// 执行搜索
const search = async () => {
  if (!keyword.value.trim()) {
    ElMessage.warning('请输入要搜索的功能名称')
    return
  }

  loading.value = true
  hasSearched.value = true
  searchResult.value = null

  try {
    const response = (await api.searchFunction(keyword.value)) as unknown as FunctionSearchResult

    if (response) {
      searchResult.value = response
      router.replace({ query: { q: keyword.value } })
    } else {
      searchResult.value = null
    }
  } catch (error) {
    console.error('搜索失败', error)
    ElMessage.error('搜索失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 快速搜索
const quickSearch = (hot: string) => {
  keyword.value = hot
  search()
}

// 页面加载时执行
initFromUrl()
</script>

<style scoped>
.function-search-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--color-bg) 0%, var(--color-bg-dark) 100%);
  padding-top: 70px;
}

.search-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

.search-hero {
  text-align: center;
  margin-bottom: 48px;
}

.search-title {
  font-size: 36px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 12px;
}

.search-subtitle {
  font-size: 16px;
  color: var(--color-text-secondary);
}

.search-input-wrapper {
  display: flex;
  gap: 12px;
  margin-top: 32px;
}

.search-input {
  flex: 1;
  padding: 16px 20px;
  font-size: 16px;
  border: 2px solid var(--color-border);
  border-radius: 50px;
  outline: none;
  transition: all var(--transition-fast);
  background: var(--color-bg-card);
  color: var(--color-text);
}

.search-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.search-input::placeholder {
  color: var(--color-text-placeholder);
}

.search-button {
  padding: 0 32px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-active));
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.search-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px var(--color-primary-light);
}

.search-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 热门功能 */
.hot-section {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 16px;
}

.title-icon {
  margin-right: 8px;
}

.hot-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.hot-tag {
  padding: 8px 20px;
  background: var(--color-bg-light);
  border-radius: 40px;
  font-size: 14px;
  color: var(--color-text);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.hot-tag:hover {
  background: var(--color-primary);
  color: white;
  transform: translateY(-2px);
}

/* 搜索结果 */
.result-section {
  margin-top: 24px;
}

.result-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: 32px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border-light);
  animation: fadeIn var(--transition-normal) ease;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--color-border);
}

.result-icon {
  font-size: 28px;
}

.result-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.result-content {
  font-size: 15px;
  line-height: 1.8;
  color: var(--color-text-secondary);
  white-space: pre-wrap;
  word-break: break-word;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 8px;
}

.empty-desc {
  color: var(--color-text-light);
  margin-bottom: 24px;
}

.empty-suggestion {
  color: var(--color-text-light);
}

.suggestion-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 12px;
}

.suggestion-tag {
  padding: 6px 16px;
  background: var(--color-bg-light);
  border-radius: 30px;
  font-size: 13px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.suggestion-tag:hover {
  background: var(--color-primary);
  color: white;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 60px;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .search-title {
    font-size: 28px;
  }

  .search-input-wrapper {
    flex-direction: column;
  }

  .search-button {
    padding: 12px;
  }

  .result-card {
    padding: 20px;
  }

  .result-title {
    font-size: 20px;
  }
}
</style>
