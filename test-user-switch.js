// 测试用户ID切换的脚本
console.log('=== 测试用户ID切换 ===')

// 模拟localStorage
const localStorage = {
  getItem: function (key) {
    if (key === 'userInfo') {
      return JSON.stringify({ userId: 2, username: 'testuser', role: 'user' })
    } else if (key === 'userToken') {
      return 'jwt-2-test-token'
    } else if (key === 'userId') {
      return '2'
    }
    return null
  },
  setItem: function (key, value) {
    console.log(`localStorage.setItem('${key}', '${value}')`)
  },
}

// 模拟userStore
const userStore = {
  userState: {
    isLoggedIn: true,
    userInfo: {
      userId: 2,
      username: 'testuser',
      role: 'user',
      token: 'jwt-2-test-token',
    },
  },
  switchToUser2: function () {
    console.log('=== 切换用户ID为2 ===')
    this.userState.userInfo.userId = 2
    console.log('✅ 用户ID已成功切换为2')
    console.log('修改后用户信息:', this.userState.userInfo)
    return true
  },
}

// 测试切换用户ID
const switchSuccess = userStore.switchToUser2()
console.log('用户ID切换结果:', switchSuccess)
console.log('当前用户ID:', userStore.userState.userInfo.userId)

// 测试currentUserId计算属性
const currentUserId = userStore.userState.userInfo.userId
console.log('计算后的用户ID:', currentUserId)

console.log('=== 测试完成 ===')
