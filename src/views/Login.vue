<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api/index'
import { useUserStore } from '../stores/user'
import { autoLogin } from '../utils/autoLogin'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

// 表单数据
const form = reactive({
  username: '',
  password: '',
  captcha: '',
  rememberMe: true,
})

// 图形验证码相关数据
const captchaData = reactive({
  captchaText: '',
  captchaBase64: '',
  captchaId: '',
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
    const res = await api.getCaptcha()
    console.log('登录验证码响应:', res)

    // 先判断是否有图片
    if (res.captchaBase64) {
      captchaData.captchaBase64 = res.captchaBase64
      captchaData.captchaText = res.data
      captchaData.captchaId = res.captchaId
    } else if (res.data) {
      captchaData.captchaText = res.data
    }

    form.captcha = ''

    ElMessage.success('验证码已更新')
  } catch (error) {
    console.error('获取验证码失败:', error)
    ElMessage.error('获取验证码失败')
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
    // 调用登录，传入rememberMe状态
    const result = await userStore.login(
      form.username,
      form.password,
      form.captcha,
      captchaData.captchaId,
      form.rememberMe,
    )

    if (result.success) {
      alert('登录成功！')
      console.log('保存的用户名:', localStorage.getItem('saved_username'))
      console.log('是否有保存的密码:', !!localStorage.getItem('saved_password'))
      router.push('/')
    } else {
      errorMessage.value = result.error || '登录失败'
      getCaptcha()
    }
  } catch (error: unknown) {
    console.error('登录出错:', error)
    errorMessage.value = '登录失败'
    getCaptcha()
  } finally {
    isLoggingIn.value = false
  }
}

// 跳转到注册页
const goToRegister = () => {
  router.push('/register')
}

const goToForgotPassword = () => {
  router.push('/forgot-password')
}

// 组件挂载时获取验证码，并检查是否有保存的用户名
onMounted(() => {
  getCaptcha()
  const savedUsername = autoLogin.getSavedUsername()
  if (savedUsername) {
    form.username = savedUsername
    form.rememberMe = true
  }
})
</script>

<template>
  <div class="login-container">
    <div class="login-form-wrapper">
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

        <!-- 记住我选项 -->
        <div class="form-group remember-me">
          <label class="checkbox-label">
            <input type="checkbox" v-model="form.rememberMe" />
            <span>记住我（下次自动登录）</span>
          </label>
        </div>

        <!-- 登录按钮 -->
        <button @click="handleLogin" class="login-button" :disabled="isLoggingIn">
          {{ isLoggingIn ? '登录中...' : '登录' }}
        </button>

        <!-- 注册链接 -->
        <div class="register-link">
          还没有账号？<a href="#" @click.prevent="goToRegister">立即注册</a>
        </div>

        <div class="forgot-link">
          <a href="#" @click.prevent="goToForgotPassword">忘记密码？</a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  position: relative;
  min-height: 100vh;
  width: 100%;
  background-image: url('../img/bg_login.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: var(--color-bg-dark);
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0;
}

/* 表单外层包装器 - 控制位置 */
.login-form-wrapper {
  width: 30%;
  max-width: 480px;
  min-width: 320px;
  margin-right: 5%;
  max-height: 90vh;
  overflow-y: auto;
}

/* 保留原有的表单样式，只改定位相关 */
.login-form {
  background-color: var(--color-bg-card);
  padding: 45px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  width: 100%;
  transition: transform 0.3s ease;
}

.login-form:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.2);
}

.login-form h2 {
  text-align: center;
  margin-bottom: 35px;
  color: var(--color-text);
  font-size: 28px;
  font-weight: 600;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.error-alert {
  background-color: var(--color-danger-light);
  border: 1px solid var(--color-danger-light);
  color: var(--color-danger);
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
  color: var(--color-text-secondary);
  font-weight: 500;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-control {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s ease;
  background-color: var(--color-bg-light);
  color: var(--color-text);
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  background-color: var(--color-bg-card);
  box-shadow: 0 0 0 3px var(--color-primary-light);
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
  color: var(--color-text-light);
  transition: color 0.3s ease;
}

.password-toggle:hover {
  color: var(--color-primary);
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
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  color: var(--color-bg-card);
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
  background: linear-gradient(135deg, var(--color-primary-hover) 0%, var(--color-primary) 100%);
  box-shadow: 0 4px 12px var(--color-primary-light);
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
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.captcha-image:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-sm);
}

.captcha-text-container {
  padding: 10px;
  background-color: var(--color-bg-light);
  border-radius: 4px;
  border: 1px solid var(--color-border);
}

.captcha-text-display {
  font-size: 16px;
  margin-bottom: 5px;
}

.captcha-label {
  color: var(--color-text-secondary);
}

.captcha-value {
  color: var(--color-primary);
  font-size: 18px;
  letter-spacing: 3px;
  background-color: var(--color-border);
  padding: 2px 8px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

.captcha-hint {
  font-size: 12px;
  color: var(--color-text-light);
  margin-top: 4px;
}

.remember-me {
  margin-bottom: 20px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.checkbox-label input[type='checkbox'] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.login-button {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  color: var(--color-bg-card);
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
  background: linear-gradient(135deg, var(--color-primary-hover) 0%, var(--color-primary) 100%);
  box-shadow: 0 6px 20px var(--color-primary-light);
  transform: translateY(-1px);
}

.login-button:active {
  transform: translateY(1px);
  box-shadow: 0 3px 10px var(--color-primary-light);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.register-link {
  text-align: center;
  margin-top: 25px;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.register-link a {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
}

.register-link a:hover {
  color: var(--color-primary-hover);
  text-decoration: underline;
}

.forgot-link {
  text-align: center;
  margin-top: 15px;
}

.forgot-link a {
  color: var(--color-text-light);
  text-decoration: none;
  font-size: 13px;
}

.forgot-link a:hover {
  color: var(--color-primary);
}

/* ========== 响应式适配 - 只改布局，不改颜色 ========== */

/* 大屏幕 (1440px+) */
@media (min-width: 1440px) {
  .login-form-wrapper {
    width: 28%;
    max-width: 520px;
    margin-right: 6%;
  }

  .login-form {
    padding: 45px 40px;
  }
}

/* 桌面 (1024px - 1440px) */
@media (min-width: 1024px) and (max-width: 1439px) {
  .login-form-wrapper {
    width: 32%;
    max-width: 450px;
    margin-right: 5%;
  }

  .login-form {
    padding: 38px 32px;
  }
}

/* 小桌面/大平板 (768px - 1024px) - 表单居中 */
@media (min-width: 768px) and (max-width: 1023px) {
  .login-container {
    justify-content: center;
  }

  .login-form-wrapper {
    width: 60%;
    max-width: 450px;
    margin-right: 0;
  }

  .login-form {
    background-color: var(--color-bg-card);
  }
}

/* 移动端 (小于768px) */
@media (max-width: 767px) {
  .login-container {
    justify-content: center;
    background-position: 30% center;
  }

  .login-form-wrapper {
    width: 90%;
    min-width: auto;
    margin-right: 0;
    max-height: 85vh;
  }

  .login-form {
    padding: 30px 24px;
  }

  .login-form h2 {
    font-size: 24px;
    margin-bottom: 28px;
  }

  .captcha-input {
    flex-direction: column;
    gap: 8px;
  }

  .send-captcha-btn {
    width: 100%;
    padding: 10px;
  }

  .captcha-image {
    width: 100%;
    height: auto;
    min-height: 45px;
  }
}
</style>
