<!-- components/ReviewReminderBanner.vue -->
<template>
  <Transition name="slide-down">
    <div
      v-if="shouldShowBanner"
      class="review-reminder-banner"
      :class="{ 'has-overdue': overdueCount > 0 }"
    >
      <div class="banner-content">
        <span class="banner-icon">{{ overdueCount > 0 ? '⚠️' : '📚' }}</span>
        <span class="banner-text">
          <template v-if="overdueCount > 0">
            您有 <strong>{{ overdueCount }}</strong> 个复习任务已逾期
          </template>
          <template v-else-if="pendingCount > 0">
            今天有 <strong>{{ pendingCount }}</strong> 个任务待复习
          </template>
        </span>
        <button class="banner-link" @click="goToReviewPage">查看详情 →</button>
      </div>
      <button class="banner-close" @click="closeBanner" title="今日不再提醒">✕</button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useReviewReminder } from '@/composables/useReviewReminder'

const router = useRouter()
const reminder = useReviewReminder()

// 横幅关闭状态（今日内）
const bannerClosed = ref(false)

// 是否显示横幅
const shouldShowBanner = computed(() => {
  // 需要满足以下所有条件：
  // 1. 用户开启了复习提醒
  // 2. 有待复习或逾期任务
  // 3. 今日还未提醒过
  // 4. 横幅未被手动关闭
  return (
    reminder.isReminderEnabled.value &&
    (reminder.pendingCount.value > 0 || reminder.overdueCount.value > 0) &&
    !reminder.hasRemindedToday() &&
    !bannerClosed.value
  )
})

const pendingCount = computed(() => reminder.pendingCount.value)
const overdueCount = computed(() => reminder.overdueCount.value)

// 跳转到复习页面
const goToReviewPage = () => {
  router.push('/ai/study/review')
  closeBanner()
}

// 关闭横幅
const closeBanner = () => {
  bannerClosed.value = true
  reminder.markRemindedToday()
}

// 跨日重置横幅关闭状态
const resetBannerIfNewDay = () => {
  const today = reminder.getTodayString()
  const lastDate = localStorage.getItem('review_banner_last_closed_date')
  if (lastDate !== today) {
    bannerClosed.value = false
    localStorage.removeItem('review_banner_last_closed_date')
  }
}

// 监听横幅关闭，记录关闭日期
watch(bannerClosed, (closed) => {
  if (closed) {
    localStorage.setItem('review_banner_last_closed_date', reminder.getTodayString())
  }
})

onMounted(() => {
  resetBannerIfNewDay()
})
</script>

<style scoped>
.review-reminder-banner {
  position: fixed;
  top: 70px;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.review-reminder-banner.has-overdue {
  background: linear-gradient(135deg, #f56c6c 0%, #e13d3d 100%);
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.banner-icon {
  font-size: 20px;
}

.banner-text {
  font-size: 14px;
}

.banner-text strong {
  font-weight: 700;
  font-size: 16px;
}

.banner-link {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.banner-link:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateX(2px);
}

.banner-close {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.banner-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* 动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}
</style>
