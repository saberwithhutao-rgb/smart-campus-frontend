<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api/index'

const router = useRouter()

// 表单数据
const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  verifyCode: '',
  captcha: '',
})

// 图形验证码相关数据
const captchaData = reactive({
  captchaId: '',
  captchaText: '',
  captchaBase64: '',
})

// 密码是否可见
const isPasswordVisible = ref(false)

// 是否正在获取图形验证码
const isGettingCaptcha = ref(false)

// 是否正在发送邮箱验证码
const isSendingVerifyCode = ref(false)

// 错误提示信息
const errorMessage = ref('')

// 判断是否是错误消息
const isError = computed(() => {
  const msg = errorMessage.value
  return (
    msg &&
    (msg.includes('失败') || msg.includes('请') || msg.includes('不一致') || msg.includes('不能'))
  )
})

// 切换密码可见性
const togglePasswordVisibility = () => {
  isPasswordVisible.value = !isPasswordVisible.value
}

// ========== 修正：获取图形验证码 ==========
const getCaptcha = async () => {
  isGettingCaptcha.value = true
  try {
    console.log('开始获取图形验证码...')

    // 修正：加上括号调用函数
    const response = await api.getCaptcha()
    console.log('图形验证码响应:', response)

    if (response.code === 200) {
      // 修正：按照后端返回结构赋值
      captchaData.captchaId = response.captchaId
      captchaData.captchaText = response.data // 验证码文本在data字段
      captchaData.captchaBase64 = response.captchaBase64 // 图片base64
      form.captcha = '' // 清空输入框

      console.log('验证码获取成功:', {
        captchaId: captchaData.captchaId,
        captchaText: captchaData.captchaText,
        hasImage: !!captchaData.captchaBase64,
      })

      // 显示成功提示
      errorMessage.value = '验证码已更新'

      // 3秒后清除成功提示
      setTimeout(() => {
        if (errorMessage.value === '验证码已更新') {
          errorMessage.value = ''
        }
      }, 3000)
    } else {
      errorMessage.value = response.message || '获取验证码失败'
    }
  } catch (error: unknown) {
    console.error('获取验证码失败:', error)
    const getErrorMessage = (err: unknown): string => {
      if (err instanceof Error) return err.message
      if (typeof err === 'string') return err
      return '获取验证码失败'
    }
    errorMessage.value = getErrorMessage(error)
  } finally {
    isGettingCaptcha.value = false
  }
}

// ========== 修正：发送邮箱验证码 ==========
const sendVerifyCode = async () => {
  // 验证邮箱是否为空
  if (!form.email || !form.email.trim()) {
    errorMessage.value = '请输入邮箱地址'
    return
  }

  // 验证图形验证码是否为空
  if (!form.captcha || !form.captcha.trim()) {
    errorMessage.value = '请输入图形验证码'
    return
  }

  // 验证是否已获取图形验证码
  if (!captchaData.captchaId) {
    errorMessage.value = '请先获取图形验证码'
    return
  }

  isSendingVerifyCode.value = true
  try {
    const response = await api.sendVerifyCode(form.email, form.captcha, captchaData.captchaId)

    console.log('邮箱验证码响应:', response)

    // 检查响应状态
    if (response.code === 200) {
      errorMessage.value = response.message || '验证码已发送，请查收邮件'

      // 3秒后清除成功提示
      setTimeout(() => {
        if (errorMessage.value === '验证码已发送，请查收邮件') {
          errorMessage.value = ''
        }
      }, 3000)
    } else {
      errorMessage.value = response.message || '发送验证码失败'
    }
  } catch (error: unknown) {
    const getErrorMessage = (err: unknown): string => {
      if (err instanceof Error) return err.message
      if (typeof err === 'string') return err
      return '发送验证码失败'
    }
    errorMessage.value = getErrorMessage(error)
  } finally {
    isSendingVerifyCode.value = false
  }
}

// ========== 修正：注册函数 ==========
const handleRegister = async () => {
  // 清除之前的错误提示
  errorMessage.value = ''

  // 表单验证
  if (!form.username || !form.username.trim()) {
    errorMessage.value = '请输入用户名'
    return
  }

  if (!form.password || form.password.length < 6) {
    errorMessage.value = '密码长度不能少于6位'
    return
  }

  if (!form.confirmPassword || !form.confirmPassword.trim()) {
    errorMessage.value = '请确认密码'
    return
  }

  if (form.password !== form.confirmPassword) {
    errorMessage.value = '两次输入的密码不一致'
    return
  }

  if (!form.email || !form.email.trim()) {
    errorMessage.value = '请输入邮箱地址'
    return
  }

  if (!form.verifyCode || !form.verifyCode.trim()) {
    errorMessage.value = '请输入邮箱验证码'
    return
  }

  try {
    // 修正：使用api.register接口而不是直接api.post
    const response = await api.register({
      username: form.username,
      password: form.password,
      email: form.email,
      verifyCode: form.verifyCode,
      // 可选的其他字段
      studentId: '20240001',
      major: '计算机科学',
      college: '信息学院',
      grade: '2024',
      gender: 1,
    })

    // 检查响应状态
    if (response.code === 200) {
      // 注册成功
      alert('注册成功！请登录')
      router.push('/login')
    } else {
      // 注册失败
      errorMessage.value = response.message || '注册失败'
    }
  } catch (error: unknown) {
    const getErrorMessage = (err: unknown): string => {
      if (err instanceof Error) return err.message
      if (typeof err === 'string') return err
      return '注册失败'
    }
    errorMessage.value = getErrorMessage(error)
  }
}

// 跳转到登录页
const goToLogin = () => {
  router.push('/login')
}

// 组件挂载时自动获取图形验证码
onMounted(() => {
  getCaptcha()
})
</script>

<template>
  <div class="register-container">
    <div class="register-form">
      <h2>智慧校园平台 - 注册</h2>

      <!-- 错误/成功提示 -->
      <div v-if="errorMessage" :class="['message-alert', isError ? 'error' : 'success']">
        {{ errorMessage }}
      </div>

      <!-- 用户名 -->
      <div class="form-group">
        <label for="username">用户名</label>
        <input
          id="username"
          v-model="form.username"
          type="text"
          placeholder="请输入用户名"
          class="form-control"
        />
      </div>

      <!-- 密码 -->
      <div class="form-group">
        <label for="password">密码</label>
        <div class="password-input">
          <input
            id="password"
            v-model="form.password"
            :type="isPasswordVisible ? 'text' : 'password'"
            placeholder="请输入密码（至少6位）"
            class="form-control"
          />
          <button
            type="button"
            @click="togglePasswordVisibility"
            class="password-toggle"
            title="切换密码可见性"
          >
            {{ isPasswordVisible ? '👁️' : '👁️‍🗨️' }}
          </button>
        </div>
      </div>

      <!-- 确认密码 -->
      <div class="form-group">
        <label for="confirmPassword">确认密码</label>
        <div class="password-input">
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            :type="isPasswordVisible ? 'text' : 'password'"
            placeholder="请再次输入密码"
            class="form-control"
          />
          <button
            type="button"
            @click="togglePasswordVisibility"
            class="password-toggle"
            title="切换密码可见性"
          >
            {{ isPasswordVisible ? '👁️' : '👁️‍🗨️' }}
          </button>
        </div>
      </div>

      <!-- 邮箱 -->
      <div class="form-group">
        <label for="email">QQ邮箱</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          placeholder="请输入QQ邮箱"
          class="form-control"
        />
      </div>

      <!-- 图形验证码 -->
      <div class="form-group">
        <label for="captcha">图形验证码</label>
        <div class="captcha-input">
          <input
            id="captcha"
            v-model="form.captcha"
            type="text"
            placeholder="请输入图形验证码"
            class="form-control"
            :disabled="!captchaData.captchaText"
            maxlength="4"
            style="text-transform: uppercase"
          />
          <button @click="getCaptcha" class="send-captcha-btn" :disabled="isGettingCaptcha">
            {{ isGettingCaptcha ? '获取中...' : '刷新验证码' }}
          </button>
        </div>

        <!-- 验证码显示区域 -->
        <div v-if="captchaData.captchaText" class="captcha-display">
          <!-- 如果有图片则显示图片，否则显示文本 -->
          <div v-if="captchaData.captchaBase64" class="captcha-image-container">
            <img
              :src="captchaData.captchaBase64"
              alt="验证码"
              @click="getCaptcha"
              class="captcha-image"
              title="点击刷新验证码"
            />
            <div class="captcha-hint">点击图片刷新验证码</div>
          </div>
          <div v-else class="captcha-text-container">
            <div class="captcha-text-display">
              <span class="captcha-label">验证码：</span>
              <strong class="captcha-value">{{ captchaData.captchaText }}</strong>
            </div>
            <div class="captcha-hint">（请输入上方4位验证码，不区分大小写）</div>
          </div>
        </div>
      </div>

      <!-- 邮箱验证码 -->
      <div class="form-group">
        <label for="verifyCode">邮箱验证码</label>
        <div class="captcha-input">
          <input
            id="verifyCode"
            v-model="form.verifyCode"
            type="text"
            placeholder="请输入邮箱验证码"
            class="form-control"
          />
          <button
            @click="sendVerifyCode"
            class="send-captcha-btn"
            :disabled="isSendingVerifyCode || !form.captcha"
          >
            {{ isSendingVerifyCode ? '发送中...' : '发送验证码' }}
          </button>
        </div>
      </div>

      <!-- 注册按钮 -->
      <button @click="handleRegister" class="register-button">注册</button>

      <!-- 登录链接 -->
      <div class="login-link">已有账号？<a href="#" @click.prevent="goToLogin">立即登录</a></div>
    </div>
  </div>
</template>

<!-- 样式保持不变 -->
<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-form {
  background-color: white;
  padding: 45px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 420px;
  transition: transform 0.3s ease;
}

.register-form:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.2);
}

.register-form h2 {
  text-align: center;
  margin-bottom: 35px;
  color: #333;
  font-size: 28px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.message-alert {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 25px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.message-alert.error {
  background-color: #fef0f0;
  border: 1px solid #fde2e2;
  color: #f56c6c;
}

.message-alert.success {
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  color: #0284c7;
}

.form-group {
  margin-bottom: 25px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-control {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s ease;
  background-color: #fafafa;
}

.form-control:focus {
  outline: none;
  border-color: #667eea;
  background-color: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.password-input {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  padding: 0;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  transition: color 0.3s ease;
}

.password-toggle:hover {
  color: #667eea;
}

.captcha-input {
  display: flex;
  gap: 12px;
  align-items: center;
}

.captcha-input .form-control {
  flex: 1;
}

.register-button {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 10px;
}

.register-button:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4091 100%);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
  transform: translateY(-1px);
}

.register-button:active {
  transform: translateY(1px);
  box-shadow: 0 3px 10px rgba(102, 126, 234, 0.2);
}

.login-link {
  text-align: center;
  margin-top: 25px;
  color: #777;
  font-size: 14px;
}

.login-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
}

.login-link a:hover {
  color: #5a6fd8;
  text-decoration: underline;
}

.send-captcha-btn {
  padding: 14px 18px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  white-space: nowrap;
  min-width: 110px;
}

.send-captcha-btn:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4091 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transform: translateY(-1px);
}

.captcha-display {
  margin-top: 10px;
  text-align: center;
}

.captcha-image-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.captcha-image {
  width: 120px;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.captcha-image:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.captcha-text-container {
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.captcha-text-display {
  font-size: 16px;
  margin-bottom: 5px;
}

.captcha-label {
  color: #666;
}

.captcha-value {
  color: #1890ff;
  font-size: 18px;
  letter-spacing: 3px;
  background-color: #f0f0f0;
  padding: 2px 8px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

.captcha-hint {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}

/* 修改邮箱验证码按钮样式 */
.send-captcha-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.send-captcha-btn:not(:disabled) {
  background-color: #52c41a;
  color: white;
}

.send-captcha-btn:not(:disabled):hover {
  background-color: #40a51f;
}

/* 禁用按钮样式 */
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
