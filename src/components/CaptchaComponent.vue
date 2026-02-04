<template>
  <div class="captcha-container">
    <img
      v-if="captchaImage"
      :src="captchaImage"
      @click="refreshCaptcha"
      class="captcha-image"
      alt="验证码"
      title="点击刷新验证码"
    />
    <canvas
      v-else
      ref="captchaCanvas"
      @click="refreshCaptcha"
      class="captcha-canvas"
      title="点击刷新验证码"
    ></canvas>
    <span class="refresh-hint">点击刷新</span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../api/index'

const props = defineProps<{
  modelValue?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:captchaId', value: string): void
}>()

const captcha = ref('')
const captchaId = ref('')
const captchaImage = ref('')
const captchaCanvas = ref<HTMLCanvasElement | null>(null)

const getCaptcha = async () => {
  try {
    console.log('开始获取验证码...')
    
    const response = await api.getCaptcha()

    console.log('验证码响应:', response)
    console.log('验证码响应类型:', typeof response)
    console.log('验证码响应对象:', JSON.stringify(response))

    // 检查后端返回的数据格式 - 确保正确取到 data.data 层级
    if (typeof response === 'object') {
      // 检查是否是标准的 ApiResponse 格式 { code, message, data }
      const data = response as any
      const captchaData = data.data || data
      
      console.log('captchaData.captchaId:', captchaData.captchaId)
      console.log('captchaData.imageBase64:', captchaData.imageBase64 ? '已获取 (长度: ' + captchaData.imageBase64.length + ')' : '未获取')
      console.log('data.message:', data.message)

      // 处理后端标准格式：{ captchaId: string, imageBase64: string, message: string }
      if (captchaData.captchaId && captchaData.imageBase64) {
        console.log('检测到标准格式验证码数据')

        // 确保 base64 有正确的 data URL 前缀
        let base64Image = captchaData.imageBase64
        if (!base64Image.startsWith('data:image')) {
          base64Image = `data:image/png;base64,${base64Image}`
          console.log('已添加 data URL 前缀:', base64Image.substring(0, 50))
        }

        console.log('设置验证码图片:', base64Image.substring(0, 50))
        captchaImage.value = base64Image
        captchaId.value = captchaData.captchaId

        console.log('验证码ID:', captchaId.value)
        console.log('captchaImage 值:', captchaImage.value ? '已设置' : '未设置')
        console.log('captchaImage 前缀检查:', captchaImage.value?.substring(0, 20))

        // 用户需要手动输入验证码
        emit('update:modelValue', '')
        emit('update:captchaId', captchaId.value)
        
        console.log('验证码设置成功')
      }
      // 兼容其他可能的图片格式
      else if (captchaData.image || captchaData.base64) {
        let base64Image = captchaData.image || captchaData.base64
        if (!base64Image.startsWith('data:image') && !base64Image.startsWith('http')) {
          base64Image = `data:image/png;base64,${base64Image}`
        }
        captchaImage.value = base64Image
        captchaId.value = captchaData.id || ''
        emit('update:modelValue', '')
        emit('update:captchaId', captchaId.value)
      }
      // 如果返回的是验证码文本
      else if (captchaData.id && captchaData.code) {
        captchaId.value = captchaData.id
        captcha.value = captchaData.code
        captchaImage.value = ''
        emit('update:modelValue', captchaData.code)
        emit('update:captchaId', captchaData.id)
        drawCaptcha()
      }
    } else if (typeof response === 'string') {
      // 如果是字符串，可能是验证码文本或图片URL
      if (response.startsWith('data:image') || response.startsWith('http')) {
        // 是图片URL或Base64
        captchaImage.value = response
        const randomId = Math.random().toString(36).substring(2, 15)
        captchaId.value = randomId
        emit('update:modelValue', '')
        emit('update:captchaId', randomId)
      } else {
        // 是验证码文本
        captchaId.value = Math.random().toString(36).substring(2, 15)
        captcha.value = response
        captchaImage.value = ''
        emit('update:modelValue', response)
        emit('update:captchaId', captchaId.value)
        drawCaptcha()
      }
    }
} catch (error: unknown) {
      console.error('获取验证码失败:', error)
      console.error('错误详情:', (error as Error).message || '未知错误')
      throw new Error('验证码获取失败，请重试')
    }
}

const drawCaptcha = () => {
  const canvas = captchaCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 设置画布大小
  canvas.width = 100
  canvas.height = 40

  // 填充背景色
  ctx.fillStyle = '#f0f0f0'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 绘制干扰线
  for (let i = 0; i < 5; i++) {
    ctx.beginPath()
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height)
    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height)
    ctx.strokeStyle = `rgba(0, 0, 0, ${Math.random() * 0.5})`
    ctx.stroke()
  }

  // 绘制干扰点
  for (let i = 0; i < 30; i++) {
    ctx.beginPath()
    ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.5})`
    ctx.fill()
  }

  // 绘制验证码文本
  ctx.font = '20px Arial'
  ctx.fillStyle = '#333'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // 随机旋转每个字符
  for (let i = 0; i < captcha.value.length; i++) {
    ctx.save()
    ctx.translate(20 + i * 18, canvas.height / 2)
    ctx.rotate((Math.random() - 0.5) * 0.5)
    ctx.fillText(captcha.value[i] || '', 0, 0)
    ctx.restore()
  }
}

const refreshCaptcha = () => {
  captchaImage.value = ''
  getCaptcha()
}

onMounted(() => {
  getCaptcha()
})
</script>

<style scoped>
.captcha-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.captcha-image {
  width: 120px;
  height: 50px;
  cursor: pointer;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f8f9fa;
  transition: all 0.3s ease;
  object-fit: contain;
  padding: 2px;
  box-sizing: border-box;
}

.captcha-image:hover {
  border-color: #409eff;
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.2);
  transform: scale(1.02);
}

.captcha-canvas {
  width: 120px;
  height: 50px;
  cursor: pointer;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f8f9fa;
  transition: all 0.3s ease;
}

.captcha-canvas:hover {
  border-color: #409eff;
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.2);
  transform: scale(1.02);
}

.refresh-hint {
  font-size: 12px;
  color: #909399;
  cursor: pointer;
  transition: color 0.3s ease;
}

.refresh-hint:hover {
  color: #409eff;
}
</style>