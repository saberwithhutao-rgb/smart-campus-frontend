<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import type { ExtendedUser } from '../types/user'

// 路由实例
const router = useRouter()

// 用户Store
const userStore = useUserStore()

// 搜索关键词
const searchKeyword = ref('')

// 编辑用户对话框
const editDialogVisible = ref(false)
const editingUser = ref<ExtendedUser | null>(null)

// 新增用户对话框
const addDialogVisible = ref(false)
const newUser = ref<{
  username: string
  password: string
  email: string
  role: 'student' | 'admin'
}>({
  username: '',
  password: '',
  email: '',
  role: 'student',
})

// 表单验证错误信息
const errors = ref({
  username: '',
  password: '',
  email: '',
})

// 根据关键词过滤用户列表
const filteredUsers = computed<ExtendedUser[]>(() => {
  return userStore.searchUsers(searchKeyword.value)
})

// 检查是否为管理员
if (!userStore.currentUser || userStore.currentUser.role !== 'admin') {
  router.push('/login')
}

// 关闭编辑对话框
const closeEditDialog = () => {
  editDialogVisible.value = false
  editingUser.value = null
}

// 打开编辑对话框
const openEditDialog = (user: ExtendedUser) => {
  editingUser.value = { ...user }
  editDialogVisible.value = true
}

// 关闭新增对话框
const closeAddDialog = () => {
  addDialogVisible.value = false
  newUser.value = {
    username: '',
    password: '',
    email: '',
    role: 'student',
  }
}

// 编辑用户
const handleEdit = () => {
  if (!editingUser.value) return

  // 验证表单
  let isValid = true
  errors.value.username = ''
  errors.value.email = ''

  if (!editingUser.value.username.trim()) {
    errors.value.username = '用户名不能为空'
    isValid = false
  }

  if (!editingUser.value.email.trim()) {
    errors.value.email = '邮箱不能为空'
    isValid = false
  }

  if (!isValid) return

  // 更新用户
  userStore.updateUser(editingUser.value.id, {
    username: editingUser.value.username,
    email: editingUser.value.email,
    role: editingUser.value.role,
  })

  closeEditDialog()
  alert('用户信息更新成功')
}

// 新增用户
const handleAdd = () => {
  // 验证表单
  let isValid = true
  errors.value.username = ''
  errors.value.password = ''
  errors.value.email = ''

  if (!newUser.value.username.trim()) {
    errors.value.username = '用户名不能为空'
    isValid = false
  }

  if (!newUser.value.password.trim()) {
    errors.value.password = '密码不能为空'
    isValid = false
  } else if (newUser.value.password.length < 6) {
    errors.value.password = '密码长度不能小于6位'
    isValid = false
  }

  if (!newUser.value.email.trim()) {
    errors.value.email = '邮箱不能为空'
    isValid = false
  }

  if (!isValid) return

  // 添加用户
  userStore.addUser({
    username: newUser.value.username,
    password: newUser.value.password,
    email: newUser.value.email,
    role: newUser.value.role,
    token: `${newUser.value.username}-token`,
    refreshToken: `${newUser.value.username}-refresh-token`,
    userId: Date.now(),
  })
  closeAddDialog()
  alert('用户添加成功')
}

// 删除用户
const handleDelete = (id: string) => {
  if (confirm('确定要删除该用户吗？')) {
    userStore.deleteUser(id)
    alert('用户删除成功')
  }
}

// 退出登录
const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="user-manage-container">
    <div class="container-content">
      <div class="header">
        <h2>用户管理</h2>
        <button @click="handleLogout" class="logout-btn">退出登录</button>
      </div>

      <div class="toolbar">
        <div class="search-box">
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="按用户名搜索"
            class="search-input"
          />
        </div>
        <button @click="addDialogVisible = true" class="add-user-btn">新增用户</button>
      </div>

      <table class="user-table">
        <thead>
          <tr>
            <th>用户名</th>
            <th>邮箱</th>
            <th>角色</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id">
            <td>{{ user.username }}</td>
            <td>{{ user.email }}</td>
            <td>
              <span :class="['role-tag', user.role]">
                {{ user.role === 'admin' ? '管理员' : '普通用户' }}
              </span>
            </td>
            <td>{{ new Date(user.createdAt).toLocaleString() }}</td>
            <td class="actions">
              <button @click="openEditDialog(user)" class="edit-btn">编辑</button>
              <button @click="handleDelete(user.id)" class="delete-btn">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 编辑用户对话框 -->
    <div v-if="editDialogVisible" class="dialog-overlay">
      <div class="dialog">
        <div class="dialog-header">
          <h3>编辑用户</h3>
          <button @click="closeEditDialog" class="close-btn">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>用户名</label>
            <input v-model="editingUser!.username" type="text" class="form-control" />
            <p v-if="errors.username" class="error-message">{{ errors.username }}</p>
          </div>
          <div class="form-group">
            <label>邮箱</label>
            <input v-model="editingUser!.email" type="email" class="form-control" />
            <p v-if="errors.email" class="error-message">{{ errors.email }}</p>
          </div>
          <div class="form-group">
            <label>角色</label>
            <select v-model="editingUser!.role" class="form-control">
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
            </select>
          </div>
        </div>
        <div class="dialog-footer">
          <button @click="closeEditDialog" class="cancel-btn">取消</button>
          <button @click="handleEdit" class="confirm-btn">确定</button>
        </div>
      </div>
    </div>

    <!-- 新增用户对话框 -->
    <div v-if="addDialogVisible" class="dialog-overlay">
      <div class="dialog">
        <div class="dialog-header">
          <h3>新增用户</h3>
          <button @click="closeAddDialog" class="close-btn">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>用户名</label>
            <input v-model="newUser.username" type="text" class="form-control" />
            <p v-if="errors.username" class="error-message">{{ errors.username }}</p>
          </div>
          <div class="form-group">
            <label>密码</label>
            <input v-model="newUser.password" type="password" class="form-control" />
            <p v-if="errors.password" class="error-message">{{ errors.password }}</p>
          </div>
          <div class="form-group">
            <label>邮箱</label>
            <input v-model="newUser.email" type="email" class="form-control" />
            <p v-if="errors.email" class="error-message">{{ errors.email }}</p>
          </div>
          <div class="form-group">
            <label>角色</label>
            <select v-model="newUser.role" class="form-control">
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
            </select>
          </div>
        </div>
        <div class="dialog-footer">
          <button @click="closeAddDialog" class="cancel-btn">取消</button>
          <button @click="handleAdd" class="confirm-btn">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-manage-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.container-content {
  background-color: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.header h2 {
  color: #333;
  font-size: 32px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.logout-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #f56c6c 0%, #f04a4a 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 14px;
}

.logout-btn:hover {
  background: linear-gradient(135deg, #f78989 0%, #f56c6c 100%);
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.3);
  transform: translateY(-1px);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  gap: 16px;
}

.search-box {
  flex: 1;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
  background-color: #fafafa;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  background-color: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.add-user-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.add-user-btn:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4091 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transform: translateY(-1px);
}

.user-table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.user-table th,
.user-table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.user-table th {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e9f2 100%);
  font-weight: 600;
  color: #333;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.user-table tr:last-child td {
  border-bottom: none;
}

.user-table tr:hover {
  background-color: #f8f9ff;
  transition: background-color 0.3s ease;
}

.role-tag {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-block;
}

.role-tag.user {
  background: linear-gradient(135deg, #409eff 0%, #3a8ee6 100%);
}

.role-tag.admin {
  background: linear-gradient(135deg, #67c23a 0%, #5cb85c 100%);
}

.actions {
  display: flex;
  gap: 10px;
}

.edit-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #e6a23c 0%, #d8902b 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 13px;
  font-weight: 500;
}

.edit-btn:hover {
  background: linear-gradient(135deg, #ebb563 0%, #e6a23c 100%);
  box-shadow: 0 2px 8px rgba(230, 162, 60, 0.3);
  transform: translateY(-1px);
}

.delete-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #f56c6c 0%, #f04a4a 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 13px;
  font-weight: 500;
}

.delete-btn:hover {
  background: linear-gradient(135deg, #f78989 0%, #f56c6c 100%);
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.3);
  transform: translateY(-1px);
}

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.dialog {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 500px;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.dialog-header h3 {
  margin: 0;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #909399;
  cursor: pointer;
  padding: 0;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  border-radius: 50%;
}

.close-btn:hover {
  color: #606266;
  background-color: #f5f7fa;
}

.dialog-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 24px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
  font-size: 14px;
}

.form-control {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
  background-color: #fafafa;
}

.form-control:focus {
  outline: none;
  border-color: #667eea;
  background-color: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.error-message {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px 24px;
  border-top: 1px solid #f0f0f0;
}

.cancel-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #909399 0%, #73767a 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
}

.cancel-btn:hover {
  background: linear-gradient(135deg, #a6a9ad 0%, #909399 100%);
  box-shadow: 0 2px 8px rgba(144, 147, 153, 0.3);
  transform: translateY(-1px);
}

.confirm-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
}

.confirm-btn:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4091 100%);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-manage-container {
    padding: 15px;
  }

  .container-content {
    padding: 20px;
  }

  .header h2 {
    font-size: 24px;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: none;
  }

  .user-table {
    font-size: 13px;
  }

  .user-table th,
  .user-table td {
    padding: 12px 8px;
  }

  .actions {
    flex-direction: column;
    gap: 6px;
  }

  .edit-btn,
  .delete-btn {
    padding: 6px 12px;
    font-size: 12px;
  }
}
</style>

