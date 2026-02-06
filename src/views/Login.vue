<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api/index'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

// 表单数据
const form = reactive({
  username: '',
  password: '',
  captcha: '',
})

// 图形验证码相关数据
const captchaData = reactive({
  captchaText: '',
  captchaBase64: '',
})

// 密码是否可见
const isPasswordVisible = ref(false)

// 是否正在获取验证码
const isGettingCaptcha = ref(false)

// 是否正在登录
const isLoggingIn = ref(false)

// 错误提示信息
const errorMessage = ref('')

// 切换密码可见性
const togglePasswordVisibility = () => {
  isPasswordVisible.value = !isPasswordVisible.value
}

// 获取图形验证码
const getCaptcha = async () => {
  isGettingCaptcha.value = true
  try {
    const response = await api.getCaptcha()
    console.log('登录验证码响应:', response)

    if (response.code === 200) {
      captchaData.captchaText = response.data
      captchaData.captchaBase64 = response.captchaBase64 || ''
      form.captcha = '' // 清空输入框

      // 显示成功提示
      errorMessage.value = '验证码已更新'
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
    errorMessage.value = '获取验证码失败'
  } finally {
    isGettingCaptcha.value = false
  }
}
// 登录
const handleLogin = async () => {
  // 清除之前的错误提示
  errorMessage.value = ''

  // 表单验证
  if (!form.username || !form.username.trim()) {
    errorMessage.value = '请输入用户名'
    return
  }

  if (!form.password || !form.password.trim()) {
    errorMessage.value = '请输入密码'
    return
  }
  if (!form.captcha || !form.captcha.trim()) {
    errorMessage.value = '请输入验证码'
    return
  }

  isLoggingIn.value = true
  try {
    // 最佳实践：直接使用userStore.login
    const result = await userStore.login(form.username, form.password, form.captcha)

    if (result.success) {
      alert('登录成功！')
      router.push('/')
    } else {
      errorMessage.value = result.error || '登录失败'
      getCaptcha() // 刷新验证码
    }
  } catch (error: any) {
    console.error('登录出错:', error)
    errorMessage.value = error.message || '登录失败'
    getCaptcha()
  } finally {
    isLoggingIn.value = false
  }
}

// 跳转到注册页
const goToRegister = () => {
  router.push('/register')
}

// 组件挂载时获取验证码
onMounted(() => {
  getCaptcha()
})
</script>

<template>
  <div class="login-container">
    <div class="login-form">
      <h2>智慧校园平台 - 登录</h2>

      <!-- 错误提示 -->
      <div v-if="errorMessage" class="error-alert">
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
            placeholder="请输入密码"
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

      <!-- 图形验证码 -->
      <div class="form-group">
        <label for="captcha">图形验证码</label>
        <div class="captcha-input">
          <input
            id="captcha"
            v-model="form.captcha"
            type="text"
            placeholder="请输入验证码"
            class="form-control"
            maxlength="4"
            style="text-transform: uppercase"
          />
          <button @click="getCaptcha" class="send-captcha-btn" :disabled="isGettingCaptcha">
            {{ isGettingCaptcha ? '获取中...' : '刷新验证码' }}
          </button>
        </div>

        <!-- 验证码显示区域 -->
        <div v-if="captchaData.captchaText" class="captcha-display">
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

      <!-- 登录按钮 -->
      <button @click="handleLogin" class="login-button" :disabled="isLoggingIn">
        {{ isLoggingIn ? '登录中...' : '登录' }}
      </button>

      <!-- 注册链接 -->
      <div class="register-link">
        还没有账号？<a href="#" @click.prevent="goToRegister">立即注册</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-form {
  background-color: white;
  padding: 45px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 420px;
  transition: transform 0.3s ease;
}

.login-form:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.2);
}

.login-form h2 {
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

.error-alert {
  background-color: #fef0f0;
  border: 1px solid #fde2e2;
  color: #f56c6c;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 25px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
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

.login-button {
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

.login-button:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4091 100%);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
  transform: translateY(-1px);
}

.login-button:active {
  transform: translateY(1px);
  box-shadow: 0 3px 10px rgba(102, 126, 234, 0.2);
}

.register-link {
  text-align: center;
  margin-top: 25px;
  color: #777;
  font-size: 14px;
}

.register-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
}

.register-link a:hover {
  color: #5a6fd8;
  text-decoration: underline;
}

.captcha-input {
  display: flex;
  gap: 12px;
  align-items: center;
}

.captcha-input .form-control {
  flex: 1;
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

.send-captcha-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4091 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transform: translateY(-1px);
}

.send-captcha-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
</style>
