<template>
  <div class="doc-detail-page">
    <GlobalNavbar />

    <div class="detail-container">
      <div class="back-button" @click="goBack">← 返回搜索结果</div>

      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <span>加载中...</span>
      </div>

      <div v-else-if="docContent" class="detail-card">
        <h1 class="doc-title">{{ docTitle }}</h1>
        <div class="doc-content" v-html="docContent"></div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">📄</div>
        <div class="empty-title">文档不存在</div>
        <button class="back-btn" @click="goBack">返回搜索</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import GlobalNavbar from '@/components/GlobalNavbar.vue'
import { marked } from 'marked'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const docTitle = ref('')
const docContent = ref('')

const goBack = () => {
  router.back()
}

onMounted(async () => {
  const path = route.query.path as string
  const title = route.query.title as string

  if (!path) {
    loading.value = false
    return
  }

  docTitle.value = title || '文档详情'

  try {
    const response = await fetch(path)
    if (!response.ok) throw new Error('加载失败')
    const markdown = await response.text()

    // 提取正文
    let body = markdown.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '')
    body = body.replace(/^#\s+.*\n/, '')

    docContent.value = await marked(body)
  } catch (error) {
    console.error('加载文档失败:', error)
    docContent.value = '<p>加载失败，请稍后重试</p>'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.doc-detail-page {
  min-height: 100vh;
  background: var(--color-bg);
  padding-top: 70px;
}

.detail-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 30px;
  cursor: pointer;
  font-size: 14px;
  color: var(--color-text);
  margin-bottom: 24px;
  transition: all 0.2s;
}

.back-button:hover {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.detail-card {
  background: var(--color-bg-card);
  border-radius: 16px;
  padding: 48px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.doc-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--color-primary);
}

.doc-content {
  font-size: 16px;
  line-height: 2;
  letter-spacing: 0.5px;
  color: var(--color-text-secondary);
}

.doc-content h1 {
  font-size: 26px;
  margin: 24px 0 16px;
  color: var(--color-text);
}

.doc-content h2 {
  font-size: 22px;
  margin: 20px 0 12px;
  color: var(--color-text);
}

.doc-content h3 {
  font-size: 18px;
  margin: 16px 0 10px;
  color: var(--color-text);
}

.doc-content p {
  margin-bottom: 16px;
  line-height: 2;
}

.doc-content ul,
.doc-content ol {
  margin: 12px 0;
  padding-left: 24px;
}

.doc-content li {
  margin: 8px 0;
  line-height: 1.9;
}

.doc-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

.doc-content th,
.doc-content td {
  border: 1px solid var(--color-border);
  padding: 10px 12px;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.back-btn {
  margin-top: 16px;
  padding: 8px 24px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .detail-card {
    padding: 24px;
  }
  .doc-title {
    font-size: 22px;
  }
}
</style>
