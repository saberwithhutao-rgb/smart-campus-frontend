<template>
  <div class="bubbles-container" v-if="isEnabled">
    <canvas ref="canvasRef" class="bubbles-canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

interface Bubble {
  x: number
  y: number
  radius: number
  scale: number
  speedY: number
  speedX: number
  opacity: number
  color: string
  life: number
}

const bubbles = ref<Bubble[]>([])
let animationFrame: number
let mouseX = 0
let mouseY = 0
let canvasWidth = 0
let canvasHeight = 0

// 从 localStorage 读取设置
const loadSettings = () => {
  try {
    const saved = localStorage.getItem('userSettings')
    if (saved) {
      const settings = JSON.parse(saved)
      return {
        enabled: settings.bubbleEffect ?? true,
        maxCount: settings.bubbleCount ?? 60,
        sizeScale: (settings.bubbleSize ?? 100) / 100,
      }
    }
  } catch (e) {
    console.error('读取设置失败:', e)
  }
  return { enabled: true, maxCount: 60, sizeScale: 1 }
}

const settings = ref(loadSettings())
const isEnabled = ref(settings.value.enabled)

// 淡蓝色系颜色池
const blueColors = [
  'rgba(173, 216, 230,', // 浅蓝
  'rgba(176, 224, 230,', // 粉蓝
  'rgba(175, 238, 238,', // 淡蓝绿
  'rgba(224, 255, 255,', // 浅青
  'rgba(240, 248, 255,', // 爱丽丝蓝
  'rgba(230, 242, 255,', // 极淡蓝
  'rgba(221, 240, 255,', // 淡天蓝
  'rgba(216, 245, 255,', // 淡青
]

// 初始化画布
const initCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 设置画布大小为窗口大小
  const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    canvasWidth = canvas.width
    canvasHeight = canvas.height
  }

  window.addEventListener('resize', resize)
  resize()

  // 监听鼠标移动
  const handleMouseMove = (e: MouseEvent) => {
    if (!isEnabled.value) return // 如果禁用，不生成气泡

    mouseX = e.clientX
    mouseY = e.clientY
    createBubble(mouseX, mouseY)
  }

  window.addEventListener('mousemove', handleMouseMove)

  // 动画循环
  const animate = () => {
    if (!canvasRef.value || !ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 只有在启用时才更新和绘制气泡
    if (isEnabled.value) {
      updateBubbles(ctx)
    }

    animationFrame = requestAnimationFrame(animate)
  }

  animate()

  onUnmounted(() => {
    window.removeEventListener('resize', resize)
    window.removeEventListener('mousemove', handleMouseMove)
    cancelAnimationFrame(animationFrame)
  })
}

// 创建气泡
const createBubble = (x: number, y: number) => {
  if (!isEnabled.value) return // 再次检查，确保禁用时不创建

  const color = blueColors[Math.floor(Math.random() * blueColors.length)]
  const baseRadius = (Math.random() * 8 + 8) * settings.value.sizeScale

  bubbles.value.push({
    x: x,
    y: y,
    radius: baseRadius,
    scale: 0.2,
    speedY: -(Math.random() * 0.6 + 0.3),
    speedX: (Math.random() - 0.5) * 0.2,
    opacity: 0.7,
    color: color,
    life: 0,
  })

  // 根据设置限制气泡数量
  if (bubbles.value.length > settings.value.maxCount) {
    bubbles.value.shift()
  }
}

// 更新气泡
const updateBubbles = (ctx: CanvasRenderingContext2D) => {
  for (let i = bubbles.value.length - 1; i >= 0; i--) {
    const bubble = bubbles.value[i]
    if (!bubble) continue

    // 更新生命周期
    bubble.life += 0.005

    // 更新缩放比例：0.2 -> 0.35 -> 0.5
    if (bubble.life < 0.5) {
      bubble.scale = 0.2 + bubble.life * 0.3
    } else {
      bubble.scale = 0.35 + (bubble.life - 0.5) * 0.3
    }

    // 更新位置
    bubble.y += bubble.speedY
    bubble.x += bubble.speedX

    // 逐渐变透明
    if (bubble.life > 0.7) {
      bubble.opacity = 0.7 * (1 - (bubble.life - 0.7) / 0.3)
    }

    // 如果气泡超出屏幕或生命周期结束，移除
    if (
      bubble.y < -50 ||
      bubble.y > canvasHeight + 50 ||
      bubble.x < -50 ||
      bubble.x > canvasWidth + 50 ||
      bubble.life >= 1
    ) {
      bubbles.value.splice(i, 1)
      continue
    }

    // 计算当前显示半径
    const currentRadius = bubble.radius * bubble.scale

    // 绘制气泡
    ctx.save()

    // 绘制主气泡
    ctx.beginPath()
    ctx.arc(bubble.x, bubble.y, currentRadius, 0, Math.PI * 2)

    // 创建径向渐变
    const gradient = ctx.createRadialGradient(
      bubble.x - currentRadius * 0.3,
      bubble.y - currentRadius * 0.3,
      currentRadius * 0.2,
      bubble.x,
      bubble.y,
      currentRadius * 1.2,
    )

    const mainColor = `${bubble.color} ${bubble.opacity})`
    const lightColor = `rgba(255, 255, 255, ${bubble.opacity * 0.8})`
    const darkColor = `${bubble.color} ${bubble.opacity * 0.6})`

    gradient.addColorStop(0, lightColor)
    gradient.addColorStop(0.4, mainColor)
    gradient.addColorStop(0.8, darkColor)
    gradient.addColorStop(1, darkColor)

    ctx.fillStyle = gradient
    ctx.fill()

    // 添加描边
    ctx.strokeStyle = `rgba(255, 255, 255, ${bubble.opacity * 0.5})`
    ctx.lineWidth = 1.5
    ctx.stroke()

    // 添加顶部高光
    ctx.beginPath()
    ctx.arc(
      bubble.x - currentRadius * 0.15,
      bubble.y - currentRadius * 0.15,
      currentRadius * 0.2,
      0,
      Math.PI * 2,
    )
    ctx.fillStyle = `rgba(255, 255, 255, ${bubble.opacity * 0.3})`
    ctx.fill()

    ctx.restore()
  }
}

// 监听设置变化
const handleSettingsChange = (event: CustomEvent) => {
  const newSettings = event.detail
  settings.value = {
    enabled: newSettings.bubbleEffect ?? true,
    maxCount: newSettings.bubbleCount ?? 60,
    sizeScale: (newSettings.bubbleSize ?? 100) / 100,
  }

  // 如果从禁用变为启用，不清除现有气泡
  // 如果从启用变为禁用，清除所有气泡
  if (isEnabled.value && !settings.value.enabled) {
    // 禁用时清除所有气泡
    bubbles.value = []
  }

  isEnabled.value = settings.value.enabled
}

// 单独监听特效开关
const handleBubbleEffectChange = (event: CustomEvent) => {
  const enabled = event.detail
  isEnabled.value = enabled
  settings.value.enabled = enabled

  if (!enabled) {
    // 关闭时清除所有气泡
    bubbles.value = []
  }
}

// 监听数量变化
const handleBubbleCountChange = (event: CustomEvent) => {
  const count = event.detail
  settings.value.maxCount = count

  // 如果当前气泡数量超过新限制，移除多余的气泡
  while (bubbles.value.length > count) {
    bubbles.value.shift()
  }
}

// 监听大小变化
const handleBubbleSizeChange = (event: CustomEvent) => {
  const size = event.detail
  settings.value.sizeScale = size / 100

  // 不需要立即调整现有气泡，新气泡会使用新大小
}

onMounted(() => {
  initCanvas()

  // 监听设置变更事件
  window.addEventListener('settings-changed', handleSettingsChange as EventListener)
  window.addEventListener('bubble-effect-change', handleBubbleEffectChange as EventListener)
  window.addEventListener('bubble-count-change', handleBubbleCountChange as EventListener)
  window.addEventListener('bubble-size-change', handleBubbleSizeChange as EventListener)
})

onUnmounted(() => {
  window.removeEventListener('settings-changed', handleSettingsChange as EventListener)
  window.removeEventListener('bubble-effect-change', handleBubbleEffectChange as EventListener)
  window.removeEventListener('bubble-count-change', handleBubbleCountChange as EventListener)
  window.removeEventListener('bubble-size-change', handleBubbleSizeChange as EventListener)
})
</script>

<style scoped>
.bubbles-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
}

.bubbles-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
