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
      <div class="shape-container">
        <!-- 三角形 -->
        <div
          class="floating-shape shape-triangle"
          style="top: 10%; left: 5%; animation-duration: 18s; animation-delay: 0s"
        ></div>
        <div
          class="floating-shape shape-triangle"
          style="top: 70%; left: 85%; animation-duration: 22s; animation-delay: 2s"
        ></div>

        <!-- 正方形 -->
        <div
          class="floating-shape shape-square"
          style="top: 20%; left: 80%; animation-duration: 20s; animation-delay: 1s"
        ></div>
        <div
          class="floating-shape shape-square"
          style="top: 65%; left: 15%; animation-duration: 25s; animation-delay: 3s"
        ></div>

        <!-- 圆形 -->
        <div
          class="floating-shape shape-circle"
          style="top: 15%; left: 60%; animation-duration: 19s; animation-delay: 0.5s"
        ></div>
        <div
          class="floating-shape shape-circle"
          style="top: 80%; left: 40%; animation-duration: 23s; animation-delay: 4s"
        ></div>

        <!-- 长方形 -->
        <div
          class="floating-shape shape-rectangle"
          style="top: 30%; left: 25%; animation-duration: 21s; animation-delay: 1.5s"
        ></div>
        <div
          class="floating-shape shape-rectangle"
          style="top: 50%; left: 90%; animation-duration: 24s; animation-delay: 2.5s"
        ></div>

        <!-- 菱形 -->
        <div
          class="floating-shape shape-diamond"
          style="top: 45%; left: 10%; animation-duration: 17s; animation-delay: 3.5s"
        ></div>
        <div
          class="floating-shape shape-diamond"
          style="top: 85%; left: 70%; animation-duration: 26s; animation-delay: 0.8s"
        ></div>

        <!-- 六边形 -->
        <div
          class="floating-shape shape-hexagon"
          style="top: 55%; left: 50%; animation-duration: 28s; animation-delay: 2.2s"
        ></div>

        <!-- 星形 -->
        <div
          class="floating-shape shape-star"
          style="top: 75%; left: 55%; animation-duration: 30s; animation-delay: 1.2s"
        ></div>

        <!-- 十字形 -->
        <div
          class="floating-shape shape-cross"
          style="top: 35%; left: 45%; animation-duration: 16s; animation-delay: 4.5s"
        ></div>

        <!-- 心形 -->
        <div
          class="floating-shape shape-heart"
          style="top: 25%; left: 35%; animation-duration: 27s; animation-delay: 3s"
        ></div>
      </div>
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
  position: relative;
  overflow: hidden;

  /* 动态渐变背景 - 使用主题色变量 */
  background: linear-gradient(
    135deg,
    var(--color-primary) 0%,
    var(--color-primary-active) 25%,
    var(--color-primary-hover) 50%,
    var(--color-primary-light) 75%,
    var(--color-primary) 100%
  );
  background-size: 200% 200%;
  animation: gradientShift 8s ease infinite;
}

/* 基础形状样式 */
.floating-shape {
  position: absolute;
  opacity: 0.2;
  animation: floatAround 20s infinite ease-in-out;
  filter: blur(0.5px);
}

/* 三角形 */
.shape-triangle {
  width: 0;
  height: 0;
  border-left: 20px solid transparent;
  border-right: 20px solid transparent;
  border-bottom: 35px solid rgba(255, 255, 255, 0.6);
}

/* 正方形 */
.shape-square {
  width: 30px;
  height: 30px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
}

/* 圆形 */
.shape-circle {
  width: 30px;
  height: 30px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
}

/* 长方形 */
.shape-rectangle {
  width: 45px;
  height: 25px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 6px;
}

/* 菱形 */
.shape-diamond {
  width: 30px;
  height: 30px;
  background: rgba(255, 255, 255, 0.5);
  transform: rotate(45deg);
}

/* 六边形 */
.shape-hexagon {
  width: 30px;
  height: 17px;
  background: rgba(255, 255, 255, 0.5);
  position: relative;
}

.shape-hexagon::before,
.shape-hexagon::after {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  border-left: 15px solid transparent;
  border-right: 15px solid transparent;
}

.shape-hexagon::before {
  bottom: 100%;
  border-bottom: 10px solid rgba(255, 255, 255, 0.5);
}

.shape-hexagon::after {
  top: 100%;
  border-top: 10px solid rgba(255, 255, 255, 0.5);
}

/* 星形 */
.shape-star {
  position: relative;
  width: 0;
  height: 0;
  border-left: 15px solid transparent;
  border-right: 15px solid transparent;
  border-bottom: 30px solid rgba(255, 255, 255, 0.5);
}

.shape-star::before {
  content: '';
  position: absolute;
  top: 10px;
  left: -15px;
  width: 0;
  height: 0;
  border-left: 15px solid transparent;
  border-right: 15px solid transparent;
  border-top: 30px solid rgba(255, 255, 255, 0.5);
}

/* 十字形 */
.shape-cross {
  position: relative;
  width: 10px;
  height: 30px;
  background: rgba(255, 255, 255, 0.5);
}

.shape-cross::before {
  content: '';
  position: absolute;
  width: 30px;
  height: 10px;
  background: rgba(255, 255, 255, 0.5);
  top: 10px;
  left: -10px;
}

/* 心形 */
.shape-heart {
  position: relative;
  width: 30px;
  height: 27px;
  background: rgba(255, 255, 255, 0.5);
  transform: rotate(-45deg);
  border-radius: 50% 50% 0 0;
}

.shape-heart::before,
.shape-heart::after {
  content: '';
  position: absolute;
  width: 30px;
  height: 27px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
}

.shape-heart::before {
  top: -15px;
  left: 0;
}

.shape-heart::after {
  top: 0;
  left: 15px;
}

/* 光晕效果 */
.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.2) 0%, transparent 50%),
    radial-gradient(circle at 40% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  pointer-events: none;
  animation: pulseGlow 4s ease-in-out infinite alternate;
  z-index: 1;
}

/* 漂浮形状容器 */
.shape-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 2;
}

.hero-section::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    radial-gradient(2px 2px at 20% 30%, rgba(255, 255, 255, 0.3), transparent),
    radial-gradient(3px 3px at 60% 70%, rgba(255, 255, 255, 0.2), transparent),
    radial-gradient(1px 1px at 80% 20%, rgba(255, 255, 255, 0.4), transparent),
    radial-gradient(2px 2px at 40% 90%, rgba(255, 255, 255, 0.25), transparent),
    radial-gradient(3px 3px at 90% 50%, rgba(255, 255, 255, 0.2), transparent);
  background-size: 200px 200px;
  background-repeat: no-repeat;
  pointer-events: none;
  animation: floatParticles 20s linear infinite;
}

.hero-content {
  max-width: 800px;
  text-align: center;
}

.hero-title {
  font-size: 80px;
  font-weight: 700;
  text-align: center;
  letter-spacing: 2px;
  animation: fadeInUp 0.8s ease;
  background: linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.85) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
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

/* 漂浮动画 */
@keyframes floatAround {
  0% {
    transform: translateY(0px) translateX(0px) rotate(0deg);
    opacity: 0.15;
  }
  25% {
    transform: translateY(-40px) translateX(30px) rotate(90deg);
    opacity: 0.25;
  }
  50% {
    transform: translateY(20px) translateX(-20px) rotate(180deg);
    opacity: 0.2;
  }
  75% {
    transform: translateY(-20px) translateX(40px) rotate(270deg);
    opacity: 0.25;
  }
  100% {
    transform: translateY(0px) translateX(0px) rotate(360deg);
    opacity: 0.15;
  }
}

@keyframes gradientShift {
  0% {
    background-position: 0% 0%;
  }
  50% {
    background-position: 100% 100%;
  }
  100% {
    background-position: 0% 0%;
  }
}

@keyframes pulseGlow {
  0% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}

/* 响应式：移动端减少形状数量 */
@media (max-width: 768px) {
  .floating-shape {
    opacity: 0.1;
    transform: scale(0.8);
  }
}

@keyframes gradientShift {
  0% {
    background-position: 0% 0%;
  }
  50% {
    background-position: 100% 100%;
  }
  100% {
    background-position: 0% 0%;
  }
}

@keyframes pulseGlow {
  0% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}

@keyframes floatParticles {
  0% {
    background-position:
      0% 0%,
      0% 0%,
      0% 0%,
      0% 0%,
      0% 0%;
  }
  100% {
    background-position:
      200px 200px,
      -200px 100px,
      100px -150px,
      -100px 200px,
      150px -100px;
  }
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
