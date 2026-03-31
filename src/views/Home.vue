<script setup lang="ts">
import GlobalNavbar from '@/components/GlobalNavbar.vue'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isMobile = ref(false)

const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 768
}

const goToSmartQA = () => {
  router.push('/ai/chat')
}

const goToStudyLife = () => {
  router.push('/campus/library-reservation')
}

const goToCompetitionManagement = () => {
  router.push('/career/competitions')
}

onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
})
</script>

<template>
  <div class="smart-campus-home">
    <GlobalNavbar />

    <!-- 主视觉区 -->
    <section class="hero-section">
      <!-- 形状容器 - 必须在 hero-section 内部 -->
      <div class="shape-container">
        <!-- 三角形 - 加大加亮 -->
        <div class="floating-shape shape-triangle" style="top: 5%; left: 8%"></div>
        <div class="floating-shape shape-triangle" style="top: 75%; left: 82%"></div>

        <!-- 正方形 -->
        <div class="floating-shape shape-square" style="top: 15%; left: 75%"></div>
        <div class="floating-shape shape-square" style="top: 60%; left: 12%"></div>

        <!-- 圆形 -->
        <div class="floating-shape shape-circle" style="top: 10%; left: 55%"></div>
        <div class="floating-shape shape-circle" style="top: 85%; left: 35%"></div>

        <!-- 长方形 -->
        <div class="floating-shape shape-rectangle" style="top: 25%; left: 20%"></div>
        <div class="floating-shape shape-rectangle" style="top: 45%; left: 88%"></div>

        <!-- 菱形 -->
        <div class="floating-shape shape-diamond" style="top: 40%; left: 5%"></div>
        <div class="floating-shape shape-diamond" style="top: 80%; left: 65%"></div>

        <!-- 六边形 -->
        <div class="floating-shape shape-hexagon" style="top: 50%; left: 45%"></div>

        <!-- 星形 -->
        <div class="floating-shape shape-star" style="top: 70%; left: 50%"></div>

        <!-- 十字形 -->
        <div class="floating-shape shape-cross" style="top: 30%; left: 40%"></div>

        <!-- 心形 -->
        <div class="floating-shape shape-heart" style="top: 20%; left: 30%"></div>
      </div>

      <div class="hero-content">
        <h1 class="hero-title">数字孪生 智慧校园</h1>
      </div>
    </section>

    <!-- 底部功能模块区 -->
    <section class="features-section">
      <div class="features-container">
        <div class="feature-card" @click="goToSmartQA">
          <div class="card-icon">📚</div>
          <h3 class="card-title">学习模块</h3>
          <p class="card-description">数智孪生助学</p>
          <p class="card-details">个性计划+AI高效备考</p>
        </div>

        <div class="feature-card" @click="goToStudyLife">
          <div class="card-icon">🏠</div>
          <h3 class="card-title">生活模块</h3>
          <p class="card-description">孪生校园智管</p>
          <p class="card-details">行为监测健康/图书馆服务</p>
        </div>

        <div class="feature-card" @click="goToCompetitionManagement">
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
  background: linear-gradient(
    135deg,
    var(--color-primary) 0%,
    var(--color-primary-active) 30%,
    var(--color-primary-hover) 70%,
    var(--color-primary) 100%
  );
  background-size: 200% 200%;
  animation: gradientShift 8s ease infinite;
}

/* 光晕效果 - 增强版 */
.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.4) 0%, transparent 70%),
    radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.45) 0%, transparent 70%),
    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.3) 0%, transparent 80%),
    radial-gradient(circle at 10% 80%, rgba(255, 255, 255, 0.35) 0%, transparent 60%),
    radial-gradient(circle at 90% 20%, rgba(255, 255, 255, 0.4) 0%, transparent 70%);
  pointer-events: none;
  animation: pulseGlow 3s ease-in-out infinite alternate;
  z-index: 1;
}

/* 粒子效果 */
.hero-section::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    radial-gradient(4px 4px at 15% 25%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(3px 3px at 35% 45%, rgba(255, 255, 255, 0.55), transparent),
    radial-gradient(5px 5px at 55% 65%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(3px 3px at 75% 35%, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(4px 4px at 85% 85%, rgba(255, 255, 255, 0.55), transparent),
    radial-gradient(3px 3px at 95% 15%, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(5px 5px at 5% 55%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(4px 4px at 45% 85%, rgba(255, 255, 255, 0.55), transparent);
  background-size: 400px 400px;
  background-repeat: no-repeat;
  pointer-events: none;
  animation: floatParticles 30s linear infinite;
  z-index: 1;
}

/* 形状容器 */
.shape-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

/* 漂浮形状 - 加大加亮 */
.floating-shape {
  position: absolute;
  opacity: 0.5;
  animation: floatAround 20s infinite ease-in-out;
  filter: blur(1px);
}

/* 三角形 */
.shape-triangle {
  width: 0;
  height: 0;
  border-left: 45px solid transparent;
  border-right: 45px solid transparent;
  border-bottom: 78px solid rgba(255, 255, 255, 0.8);
}

/* 正方形 */
.shape-square {
  width: 70px;
  height: 70px;
  background: rgba(255, 255, 255, 0.75);
  border-radius: 12px;
}

/* 圆形 */
.shape-circle {
  width: 70px;
  height: 70px;
  background: rgba(255, 255, 255, 0.75);
  border-radius: 50%;
}

/* 长方形 */
.shape-rectangle {
  width: 95px;
  height: 55px;
  background: rgba(255, 255, 255, 0.75);
  border-radius: 12px;
}

/* 菱形 */
.shape-diamond {
  width: 70px;
  height: 70px;
  background: rgba(255, 255, 255, 0.75);
  transform: rotate(45deg);
}

/* 六边形 */
.shape-hexagon {
  width: 70px;
  height: 40px;
  background: rgba(255, 255, 255, 0.75);
  position: relative;
}

.shape-hexagon::before,
.shape-hexagon::after {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  border-left: 35px solid transparent;
  border-right: 35px solid transparent;
}

.shape-hexagon::before {
  bottom: 100%;
  border-bottom: 22px solid rgba(255, 255, 255, 0.75);
}

.shape-hexagon::after {
  top: 100%;
  border-top: 22px solid rgba(255, 255, 255, 0.75);
}

/* 星形 */
.shape-star {
  position: relative;
  width: 0;
  height: 0;
  border-left: 35px solid transparent;
  border-right: 35px solid transparent;
  border-bottom: 70px solid rgba(255, 255, 255, 0.75);
}

.shape-star::before {
  content: '';
  position: absolute;
  top: 22px;
  left: -35px;
  width: 0;
  height: 0;
  border-left: 35px solid transparent;
  border-right: 35px solid transparent;
  border-top: 70px solid rgba(255, 255, 255, 0.75);
}

/* 十字形 */
.shape-cross {
  position: relative;
  width: 22px;
  height: 70px;
  background: rgba(255, 255, 255, 0.75);
}

.shape-cross::before {
  content: '';
  position: absolute;
  width: 70px;
  height: 22px;
  background: rgba(255, 255, 255, 0.75);
  top: 24px;
  left: -24px;
}

/* 心形 */
.shape-heart {
  position: relative;
  width: 70px;
  height: 63px;
  background: rgba(255, 255, 255, 0.75);
  transform: rotate(-45deg);
  border-radius: 50% 50% 0 0;
}

.shape-heart::before,
.shape-heart::after {
  content: '';
  position: absolute;
  width: 70px;
  height: 63px;
  background: rgba(255, 255, 255, 0.75);
  border-radius: 50%;
}

.shape-heart::before {
  top: -35px;
  left: 0;
}

.shape-heart::after {
  top: 0;
  left: 35px;
}

/* 文字内容 */
.hero-content {
  position: relative;
  z-index: 2;
  max-width: 800px;
  text-align: center;
}

.hero-title {
  font-size: 80px;
  font-weight: 700;
  text-align: center;
  letter-spacing: 2px;
  animation: fadeInUp 0.8s ease;
  background: linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.9) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 底部模块 */
.features-section {
  padding: 80px 20px;
  background: linear-gradient(180deg, var(--color-bg) 0%, var(--color-bg-light) 100%);
  position: relative;
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
  border-radius: 24px;
  padding: 40px 32px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--color-primary-light);
  transition: all 0.4s ease;
  cursor: pointer;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
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
}

/* ==================== 动画 ==================== */
@keyframes floatAround {
  0% {
    transform: translateY(0px) translateX(0px) rotate(0deg);
    opacity: 0.4;
  }
  25% {
    transform: translateY(-80px) translateX(60px) rotate(120deg);
    opacity: 0.7;
  }
  50% {
    transform: translateY(50px) translateX(-50px) rotate(240deg);
    opacity: 0.6;
  }
  75% {
    transform: translateY(-40px) translateX(70px) rotate(360deg);
    opacity: 0.65;
  }
  100% {
    transform: translateY(0px) translateX(0px) rotate(480deg);
    opacity: 0.4;
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
    opacity: 0.5;
    transform: scale(1);
  }
  100% {
    opacity: 1;
    transform: scale(1.08);
  }
}

@keyframes floatParticles {
  0% {
    background-position:
      0% 0%,
      0% 0%,
      0% 0%,
      0% 0%,
      0% 0%,
      0% 0%,
      0% 0%,
      0% 0%;
  }
  100% {
    background-position:
      400px 400px,
      -350px 200px,
      300px -300px,
      -200px 400px,
      350px -200px,
      -400px 300px,
      200px 350px,
      -300px -150px;
  }
}

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

/* 响应式 */
@media (max-width: 768px) {
  .hero-section {
    padding: 100px 16px 60px;
  }
  .hero-title {
    font-size: 48px;
  }
  .features-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .feature-card {
    padding: 28px 20px;
  }
  .floating-shape {
    opacity: 0.25;
    transform: scale(0.7);
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 36px;
  }
}
</style>
