<script setup lang="ts">
import GlobalNavbar from '@/components/GlobalNavbar.vue'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// 路由实例
const router = useRouter()

const isMobile = ref(false) // 移动端标识

// 检查屏幕尺寸
const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 768
}

// 跳转到智能问答页面
const goToSmartQA = () => {
  router.push('/ai/chat')
}

// 跳转到学习管理页面
const goToStudyLife = () => {
  router.push('/campus/library-reservation')
}

// 跳转到竞赛管理页面
const goToCompetitionManagement = () => {
  router.push('/career/competitions')
}

// 监听窗口大小变化
onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
})
</script>

<template>
  <div class="smart-campus-home">
    <!-- 顶部导航栏 -->
    <GlobalNavbar />

    <!-- 主视觉区 -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">数字孪生 智慧校园</h1>
      </div>
    </section>

    <!-- 底部功能模块区 -->
    <section class="features-section">
      <div class="features-container">
        <!-- 学习模块 - 点击跳转到智能问答页面 -->
        <div class="feature-card learning-card hover-lift" @click="goToSmartQA">
          <div class="card-icon">📚</div>
          <h3 class="card-title">学习模块</h3>
          <p class="card-description">数智孪生助学</p>
          <p class="card-details">个性计划+AI高效备考</p>
        </div>

        <!-- 生活模块 -->
        <div class="feature-card life-card hover-lift" @click="goToStudyLife">
          <div class="card-icon">🏠</div>
          <h3 class="card-title">生活模块</h3>
          <p class="card-description">孪生校园智管</p>
          <p class="card-details">行为监测健康/图书馆服务</p>
        </div>

        <!-- 竞赛模块 -->
        <div class="feature-card competition-card hover-lift" @click="goToCompetitionManagement">
          <div class="card-icon">🏆</div>
          <h3 class="card-title">竞赛模块</h3>
          <p class="card-description">数字赋能竞赛</p>
          <p class="card-details">信息匹配+科研复试</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* 主容器 */
.smart-campus-home {
  min-height: 100vh;
  background-color: var(--color-bg);
  font-family: var(--font-family);
}

/* 主视觉区 */
.hero-section {
  padding: 140px 20px 80px;
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    var(--color-primary) 0%,
    var(--color-primary-light) 50%,
    var(--color-primary) 100%
  );
  color: var(--color-bg-card);
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.hero-content {
  max-width: 800px;
  text-align: center;
}

.hero-title {
  font-size: 80px;
  font-weight: 700;
  text-align: center;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  background: linear-gradient(135deg, var(--color-bg-card) 0%, var(--color-primary-light) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
  letter-spacing: 2px;
  animation: fadeInUp 0.8s ease;
}

/* 底部功能模块区 */
.features-section {
  padding: 80px 20px;
  background: linear-gradient(180deg, var(--color-bg) 0%, var(--color-bg-light) 100%);
  position: relative;
}

.features-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--color-primary-light) 50%,
    transparent 100%
  );
}

.features-container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}

.feature-card {
  background-color: var(--color-bg-card);
  border-radius: var(--radius-xl);
  padding: 40px 32px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--color-primary-light);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, var(--color-primary-light), transparent);
  transition: left 0.5s;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.feature-card:hover::before {
  left: 100%;
}

.card-icon {
  font-size: 48px;
  margin-bottom: 24px;
}

.card-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-danger);
  margin-bottom: 16px;
}

.card-description {
  font-size: 16px;
  color: var(--color-text);
  margin-bottom: 12px;
}

.card-details {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

/* 动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-section {
    padding: 120px 16px 60px;
  }

  .hero-title {
    font-size: 56px;
  }

  .features-section {
    padding: 60px 16px;
  }

  .features-container {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .feature-card {
    padding: 32px 24px;
  }

  .card-title {
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 48px;
  }

  .feature-card {
    padding: 24px 20px;
  }

  .card-icon {
    font-size: 40px;
  }
}
</style>
