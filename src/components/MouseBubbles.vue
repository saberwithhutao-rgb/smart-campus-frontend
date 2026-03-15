<template>
  <div class="bubbles-container">
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
  speedY: number
  speedX: number
  opacity: number
  color: string
}

const bubbles = ref<Bubble[]>([])
let animationFrame: number
let mouseX = 0
let mouseY = 0
let canvasWidth = 0
let canvasHeight = 0

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
    mouseX = e.clientX
    mouseY = e.clientY

    // 在鼠标位置生成气泡
    createBubble(mouseX, mouseY)
  }

  window.addEventListener('mousemove', handleMouseMove)

  // 动画循环
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 更新和绘制气泡
    updateBubbles(ctx)

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
  // 随机颜色（蓝色系）
  const colors = [
    'rgba(173, 216, 230,', // 浅蓝
    'rgba(135, 206, 235,', // 天蓝
    'rgba(0, 191, 255,', // 深蓝
    'rgba(100, 149, 237,', // 紫蓝
    'rgba(72, 209, 204,', // 蓝绿
  ]

  const color = colors[Math.floor(Math.random() * colors.length)]

  bubbles.value.push({
    x: x,
    y: y,
    radius: Math.random() * 6 + 2, // 4-16px
    speedY: -(Math.random() * 0.8 + 0.4), // 向上飘
    speedX: (Math.random() - 0.5) * 0.3, // 左右飘动
    opacity: Math.random() * 0.5 + 0.3, // 0.3-0.8
    color: color,
  })

  // 限制气泡数量
  if (bubbles.value.length > 50) {
    bubbles.value.shift()
  }
}

// 更新气泡
const updateBubbles = (ctx: CanvasRenderingContext2D) => {
  for (let i = bubbles.value.length - 1; i >= 0; i--) {
    const bubble = bubbles.value[i]
    if (!bubble) continue
    // 更新位置
    bubble.y += bubble.speedY
    bubble.x += bubble.speedX

    // 缓慢消失
    bubble.opacity -= 0.002

    // 如果气泡超出屏幕或完全透明，移除
    if (
      bubble.y < -20 ||
      bubble.y > canvasHeight + 20 ||
      bubble.x < -20 ||
      bubble.x > canvasWidth + 20 ||
      bubble.opacity <= 0
    ) {
      bubbles.value.splice(i, 1)
      continue
    }

    // 绘制气泡
    ctx.beginPath()
    ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2)

    // 填充
    ctx.fillStyle = `${bubble.color} ${bubble.opacity})`
    ctx.fill()

    // 描边（高光效果）
    ctx.strokeStyle = `rgba(255, 255, 255, ${bubble.opacity * 0.5})`
    ctx.lineWidth = 1
    ctx.stroke()

    // 添加高光点
    ctx.beginPath()
    ctx.arc(
      bubble.x - bubble.radius * 0.2,
      bubble.y - bubble.radius * 0.2,
      bubble.radius * 0.15,
      0,
      Math.PI * 2,
    )
    ctx.fillStyle = `rgba(255, 255, 255, ${bubble.opacity * 0.8})`
    ctx.fill()
  }
}

onMounted(() => {
  initCanvas()
})
</script>

<style scoped>
.bubbles-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* 让鼠标穿透，不影响点击 */
  z-index: 9999; /* 确保在最上层 */
}

.bubbles-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
