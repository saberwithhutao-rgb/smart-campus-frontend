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
  scale: number // 当前缩放比例
  speedY: number // 上升速度
  speedX: number // 水平飘动速度
  opacity: number // 透明度
  color: string // 颜色
  life: number // 生命周期 0-1
}

const bubbles = ref<Bubble[]>([])
let animationFrame: number
let mouseX = 0
let mouseY = 0
let canvasWidth = 0
let canvasHeight = 0

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
  // 随机选择颜色
  const color = blueColors[Math.floor(Math.random() * blueColors.length)]

  // 基础半径 8-16px
  const baseRadius = Math.random() * 8 + 8

  bubbles.value.push({
    x: x,
    y: y,
    radius: baseRadius,
    scale: 0.2, // 初始缩放 0.2 倍
    speedY: -(Math.random() * 0.6 + 0.3), // 向上飘，速度稍慢
    speedX: (Math.random() - 0.5) * 0.2, // 轻微左右飘动
    opacity: 0.7, // 初始透明度
    color: color,
    life: 0, // 初始生命周期
  })

  // 限制气泡数量
  if (bubbles.value.length > 60) {
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

    // 更新缩放比例：0.2 -> 1.0 -> 1.5
    if (bubble.life < 0.5) {
      // 前50%生命周期：0.2 -> 1.0
      bubble.scale = 0.2 + bubble.life * 1.6
    } else {
      // 后50%生命周期：1.0 -> 1.5
      bubble.scale = 1.0 + (bubble.life - 0.5) * 1.0
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

    // 创建径向渐变，实现光泽感
    const gradient = ctx.createRadialGradient(
      bubble.x - currentRadius * 0.3,
      bubble.y - currentRadius * 0.3,
      currentRadius * 0.2,
      bubble.x,
      bubble.y,
      currentRadius * 1.2,
    )

    // 主颜色
    const mainColor = bubble.color.replace(')', ` ${bubble.opacity})`)

    // 高光颜色
    const lightColor = `rgba(255, 255, 255, ${bubble.opacity * 0.8})`

    // 暗部颜色
    const darkColor = bubble.color.replace(')', ` ${bubble.opacity * 0.6})`)

    gradient.addColorStop(0, lightColor)
    gradient.addColorStop(0.4, mainColor)
    gradient.addColorStop(0.8, darkColor)
    gradient.addColorStop(1, darkColor)

    ctx.fillStyle = gradient
    ctx.fill()

    // 添加描边，增加光泽感
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
  pointer-events: none;
  z-index: 9999;
}

.bubbles-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
