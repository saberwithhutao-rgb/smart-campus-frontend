import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '^/api/study/(plans|schedule|tasks)(/.*)?$': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '^/api/study-plan-details/plan/([0-9]+)$': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '^/api/study-plan-details/([0-9]+)$': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // ==================== AI接口 ====================
      '/api/ai/review/advice': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), // 去掉 /api，变成 /ai/review/advice
      },

      '/ai/chat/send': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '^/ai/chat/history/[a-zA-Z0-9_-]+$': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ai/plan-detail': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '^/ai/chat/(sessions|history|save|task|stream|status|stats|rate|session)': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },

      // ==================== 兜底规则放最后 ====================
      '/api/': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
