<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading, Delete } from '@element-plus/icons-vue'
import GlobalNavbar from '@/components/GlobalNavbar.vue'
import Select from '@/components/select.vue'
import * as forumApi from '@/api/forum'

// 响应式数据
const selectedCategoryId = ref<number | null>(null)
const selectedPostId = ref<number | null>(null)
const newComment = ref('')

// 发布输入框
const postTitle = ref('')
const postContent = ref('')
const publishCategoryId = ref<number | string>('')

// 分页数据
const currentPage = ref(0)
const pageSize = ref(10)
const totalPosts = ref(0)

// 加载状态
const loading = ref(false)
const loadingComments = ref(false)
const publishing = ref(false)
const commenting = ref(false)

// 分类列表
const categoryList = ref<forumApi.Category[]>([])
console.log('初始分类列表:', categoryList.value)

// 帖子数据
const postList = ref<forumApi.PageResponse<forumApi.Post> | null>(null)

// 当前用户ID（开发模式固定为1）
const currentUserId = ref(1)

// 话题栏滚动相关
const topicsBarRef = ref<HTMLElement | null>(null)
const showLeftArrow = ref(false)
const showRightArrow = ref(false)

// 初始化数据
onMounted(async () => {
  await loadCategories()
  await loadPosts()

  // 初始化滚动状态
  nextTick(() => {
    updateArrowVisibility()
  })
})

// 加载分类列表
const loadCategories = async () => {
  try {
    console.log('开始加载分类...')
    const res = await forumApi.getCategories()
    console.log('加载分类返回:', res)
    categoryList.value = res || []
    console.log('分类列表:', categoryList.value)
  } catch (error) {
    ElMessage.error('加载分类失败')
    console.error('加载分类失败:', error)
    categoryList.value = []
  }
}

// 加载帖子列表
const loadPosts = async (page: number = 0) => {
  loading.value = true
  try {
    let result
    if (selectedCategoryId.value) {
      result = await forumApi.getPostsByCategory(selectedCategoryId.value, page, pageSize.value)
    } else {
      result = await forumApi.getPosts(page, pageSize.value)
    }

    // 确保result存在，并且是预期的结构
    if (result) {
      // 适配后端数据结构
      postList.value = {
        content: result.content || [],
        pageable: result.pageable || {
          pageNumber: page,
          pageSize: pageSize.value,
          sort: { empty: true, sorted: false, unsorted: true },
          offset: page * pageSize.value,
          paged: true,
          unpaged: false
        },
        totalPages: result.totalPages || 0,
        totalElements: result.totalElements || 0,
        last: result.last !== undefined ? result.last : true,
        size: result.size || pageSize.value,
        number: result.number || page,
        sort: result.sort || { empty: true, sorted: false, unsorted: true },
        first: result.first !== undefined ? result.first : page === 0,
        numberOfElements: result.numberOfElements || 0,
        empty: result.empty !== undefined ? result.empty : true
      }
      totalPosts.value = result.totalElements || 0
      currentPage.value = page
    } else {
      // 确保至少有一个空的结构
      postList.value = {
        content: [],
        pageable: {
          pageNumber: page,
          pageSize: pageSize.value,
          sort: { empty: true, sorted: false, unsorted: true },
          offset: page * pageSize.value,
          paged: true,
  unpaged: false
        },
        totalPages: 0,
        totalElements: 0,
        last: true,
        size: pageSize.value,
        number: page,
        sort: { empty: true, sorted: false, unsorted: true },
        first: page === 0,
        numberOfElements: 0,
        empty: true
      }
      totalPosts.value = 0
   }
  } catch (error) {
    ElMessage.error('加载帖子失败')
    console.error('加载帖子失败:', error)
    // 出错时确保有默认值
    postList.value = {
      content: [],
      pageable: {
        pageNumber: page,
        pageSize: pageSize.value,
        sort: { empty: true, sorted: false, unsorted: true },
        offset: page * pageSize.value,
        paged: true,
        unpaged: false
      },
      totalPages: 0,
      totalElements: 0,
      last: true,
      size: pageSize.value,
      number: page,
      sort: { empty: true, sorted: false, unsorted: true },
      first: page === 0,
      numberOfElements: 0,
      empty: true
    }
  } finally {
    loading.value = false
  }
}

// 切换分类
const selectCategory = (categoryId: number | null) => {
  selectedCategoryId.value = categoryId
  currentPage.value = 0
  loadPosts(0)
}

// 切换展开/收起评论
const toggleComments = async (postId: number | undefined) => {
  if (!postId) return

  if (selectedPostId.value === postId) {
    selectedPostId.value = null
  } else {
    selectedPostId.value = postId
    await loadPostComments(postId)
  }
}

// 加载帖子评论
const loadPostComments = async (postId: number) => {
  loadingComments.value = true
  try {
    const postDetail = await forumApi.getPostDetail(postId)
    if (postList.value) {
      const postIndex = postList.value.content.findIndex(p => p.id === postId)
      if (postIndex > -1 && postList.value.content[postIndex]) {
        postList.value.content[postIndex].comments = postDetail.comments || []
      }
    }
  } catch (error) {
    ElMessage.error('加载评论失败')
    console.error('加载评论失败:', error)
  } finally {
    loadingComments.value = false
  }
}

// 发布评论
const handlePostComment = async (postId: number | undefined) => {
  if (!postId || !newComment.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }

  commenting.value = true
  try {
    await forumApi.addComment({
      postId,
      content: newComment.value,
      userId: currentUserId.value
    })

    // 重新加载评论
    await loadPostComments(postId)
    newComment.value = ''
    ElMessage.success('评论成功')
  } catch (error: any) {
    if (error.message && error.message.includes('敏感词')) {
      ElMessage.error('内容包含敏感词汇，请修改后再发布')
    } else {
      ElMessage.error('评论失败，请稍后重试')
    }
  } finally {
    commenting.value = false
  }
}

// 发布帖子
const handlePublish = async () => {
  if (!postTitle.value.trim() || !postContent.value.trim()) {
    ElMessage.warning('标题和内容都不能为空')
    return
  }

  if (!publishCategoryId.value || publishCategoryId.value === '') {
    ElMessage.warning('请选择话题')
    return
  }

  publishing.value = true
  try {
    await forumApi.addPost({
      title: postTitle.value,
      content: postContent.value,
      categoryId: publishCategoryId.value ? Number(publishCategoryId.value) : 0,
      userId: currentUserId.value
    })

    // 重新加载帖子列表
    currentPage.value = 0
    await loadPosts(0)
    postTitle.value = ''
    postContent.value = ''
    publishCategoryId.value = ''
    ElMessage.success('发布成功！')
  } catch (error: any) {
    if (error.message && error.message.includes('敏感词')) {
      ElMessage.error('内容包含敏感词汇，请修改后再发布')
    } else {
      ElMessage.error('发布失败，请稍后重试')
    }
  } finally {
    publishing.value = false
  }
}

// 删除帖子
const handleDeletePost = async (postId: number | undefined) => {
  if (!postId) return

  ElMessageBox.confirm('确定要删除此帖子吗？删除后将无法恢复', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        await forumApi.deletePost(postId, currentUserId.value)

        // 从列表中移除帖子
        if (postList.value) {
        const index = postList.value.content.findIndex(p => p.id === postId)
          if (index > -1) {
            postList.value.content.splice(index, 1)
            postList.value.numberOfElements--
          }
        }

        // 如果当前帖子是展开评论的，关闭它
        if (selectedPostId.value === postId) {
          selectedPostId.value = null
        }

        ElMessage.success('删除成功')
      } catch (error) {
        ElMessage.error('删除失败，请稍后重试')
        console.error('删除帖子失败:', error)
      }
    })
    .catch(() => {
      // 取消删除
    })
}

// 删除评论
const handleDeleteComment = async (commentId: number | undefined, postId: number | undefined) => {
  if (!commentId || !postId) return

  ElMessageBox.confirm('确定要删除此评论吗？删除后将无法恢复', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        await forumApi.deleteComment(commentId, currentUserId.value)

        // 从帖子的评论列表中移除
        if (postList.value) {
          const post = postList.value.content.find(p => p.id === postId)
          if (post && post.comments) {
            const commentIndex = post.comments.findIndex(c => c.id === commentId)
            if (commentIndex > -1) {
              post.comments.splice(commentIndex, 1)
            }
          }
        }

        ElMessage.success('删除成功')
      } catch (error) {
        ElMessage.error('删除失败，请稍后重试')
        console.error('删除评论失败:', error)
      }
    })
    .catch(() => {
      // 取消删除
    })
}

// 加载更多帖子
const loadMore = () => {
  if (!loading.value && currentPage.value < ((postList.value?.totalPages || 0) - 1)) {
    loadPosts(currentPage.value + 1)
  }
}

// 根据 categoryId 获取分类名称
const getCategoryName = (categoryId: number): string => {
  const category = categoryList.value.find(item => item.id === categoryId)
  return category ? category.name : '未知话题'
}

// 根据话题名称获取对应的样式类名
const getTopicClass = (topicName: string): string => {
  const topicClassMap: Record<string, string> = {
    '校园日常': 'topic-daily',
    '学习交流': 'topic-study',
    '美食推荐': 'topic-food',
    '校园活动': 'topic-activity',
    '求助问答': 'topic-help',
    '失物招领': 'topic-lost',
    '表白墙': 'topic-love',
    '二手交易': 'topic-secondhand'
  }
  return topicClassMap[topicName] || ''
}

// 滚动话题栏
const scrollTopics = (direction: 'left' | 'right') => {
  if (!topicsBarRef.value) return

  const scrollAmount = 150 // 滚动距离
  const currentScrollLeft = topicsBarRef.value.scrollLeft

  if (direction === 'left') {
    topicsBarRef.value.scrollTo({
      left: currentScrollLeft - scrollAmount,
      behavior: 'smooth'
    })
  } else {
    topicsBarRef.value.scrollTo({
      left: currentScrollLeft + scrollAmount,
      behavior: 'smooth'
    })
  }

  // 更新箭头可见性
  setTimeout(updateArrowVisibility, 300)
}

// 处理滚动事件
const handleScroll = () => {
  updateArrowVisibility()
}

// 更新箭头可见性
const updateArrowVisibility = () => {
  if (!topicsBarRef.value) return

  const { scrollLeft, scrollWidth, clientWidth } = topicsBarRef.value

  showLeftArrow.value = scrollLeft > 0
  showRightArrow.value = scrollLeft < scrollWidth - clientWidth - 10 // 10px 容差
}
</script>

<template>
  <div class="campus-forum">
    <GlobalNavbar />

    <div class="main-content">
      <div class="content-area">
        <!-- 话题标签栏（带滑动功能） -->
        <div class="topics-container">
          <!-- 左箭头 -->
          <button
            v-if="showLeftArrow"
            class="scroll-arrow left-arrow"
            @click="scrollTopics('left')"
          >
            ←
          </button>

          <!-- 标签滚动容器 -->
          <div class="topics-bar" ref="topicsBarRef" @scroll="handleScroll">
            <div
              class="topic-tag"
              :class="{ active: selectedCategoryId === null }"
              @click="selectCategory(null)"
            >
              #全部
            </div>
            <div
              v-for="category in categoryList"
              :key="category.id"
              class="topic-tag"
              :class="[getTopicClass(category.name), { active: selectedCategoryId === category.id }]"
              @click="selectCategory(category.id)"
            >
              #{{ category.name }}
            </div>
          </div>

          <!-- 右箭头 -->
          <button
            v-if="showRightArrow"
            class="scroll-arrow right-arrow"
            @click="scrollTopics('right')"
          >
            →
          </button>
        </div>

        <!-- 帖子列表 -->
        <div class="posts-container">
          <!-- 加载中状态 -->
          <div v-if="loading && !((postList?.content && postList.content.length))" class="loading-state">
            <el-icon class="loading-icon"><Loading /></el-icon>
            <span>加载中...</span>
          </div>

          <div
            v-for="post in (postList?.content || [])"
            :key="post.id"
            class="post-card"
          >
            <!-- 帖子头部 -->
            <div class="post-header">
              <div class="author-info">
                <div class="avatar">👤</div>
                <div class="author-text">
                  <div class="author-name">用户{{ post.userId || '未知' }}</div>
                  <div class="post-time">{{ post.createTime ? new Date(post.createTime).toLocaleString() : '未知时间' }}</div>
                </div>
              </div>
              <!-- 话题标签（右上角） -->
              <span :class="['topic-tag', getTopicClass(post.categoryName || getCategoryName(post.categoryId) || post.category?.name || '未知话题')]" v-if="post.categoryName">#{{ post.categoryName }}</span>
              <span :class="['topic-tag', getTopicClass(getCategoryName(post.categoryId) || '未知话题')]" v-else-if="post.categoryId">#{{ getCategoryName(post.categoryId) }}</span>
              <span :class="['topic-tag', getTopicClass(post.category?.name || '未知话题')]" v-else-if="post.category">#{{ post.category.name }}</span>
            </div>

            <!-- 帖子内容 -->
            <div class="post-content">
              <h3 class="post-title">{{ post.title || '' }}</h3>
              <p class="post-text">{{ post.content || '' }}</p>
            </div>

            <!-- 帖子操作 -->
            <div class="post-actions">
              <div
                class="action-btn"
                @click="toggleComments(post.id)"
              >
                <span class="icon">💬</span>
                <span class="count">{{ post.comments?.length || 0 }}</span>
              </div>
              <div
                v-if="post.userId === currentUserId"
                class="action-btn delete-btn"
                @click="handleDeletePost(post.id)"
              >
                <span class="icon"><el-icon><Delete /></el-icon></span>
                <span class="count">删除</span>
              </div>
            </div>

            <!-- 评论区域 -->
            <div v-if="selectedPostId === post.id" class="comments-section">
              <!-- 评论加载中 -->
              <div v-if="loadingComments" class="loading-comments">
                <el-icon class="loading-icon"><Loading /></el-icon>
                <span>加载评论中...</span>
              </div>

              <div v-else class="comments-list">
                <div
                  v-for="comment in post.comments || []"
                  :key="comment.id"
                  class="comment-item"
                >
                  <div class="comment-avatar">👤</div>
                  <div class="comment-content">
                    <div class="comment-header">
                      <span class="comment-author">用户{{ comment.userId || '未知' }}</span>
                      <span class="comment-time">{{ comment.createTime ? new Date(comment.createTime).toLocaleString() : '未知时间' }}</span>
                      <span
                        v-if="comment.userId === currentUserId"
                        class="comment-delete"
                        @click="handleDeleteComment(comment.id, post.id)"
                      >
                        <el-icon><Delete /></el-icon>
                      </span>
                    </div>
                    <div class="comment-text">{{ comment.content || '' }}</div>
                  </div>
                </div>
                <div v-if="!post.comments || post.comments.length === 0" class="no-comments">
                  暂无评论，快来抢沙发~
                </div>
              </div>

              <!-- 评论输入框 -->
              <div class="comment-input-area">
                <el-input
                  v-model="newComment"
                  placeholder="发表你的评论..."
                  @keyup.enter="handlePostComment(post.id)"
                >
                  <template #append>
                      <el-button @click="handlePostComment(post.id)" :loading="commenting">发送</el-button>
                    </template>
                </el-input>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="!loading && (postList?.content?.length === 0)" class="empty-state">
            <div class="empty-icon">💬</div>
            <p class="empty-text">暂无相关帖子</p>
          </div>

          <!-- 加载更多 -->
          <div v-if="!loading && currentPage < ((postList?.totalPages || 0) - 1)" class="load-more">
            <el-button @click="loadMore" :loading="loading">加载更多</el-button>
          </div>
        </div>

        <!-- 底部发布区域 -->
        <div class="publish-bar">
          <div class="publish-topic-select">
            <Select
              v-model="publishCategoryId"
              :category-list="categoryList"
              placeholder="选择话题"
              style="width: 140px"
            />
          </div>
          <div class="publish-input-wrapper">
            <!-- 新增标题输入框 -->
            <div class="input-item">
              <el-input
                v-model="postTitle"
                placeholder="请输入你的标题"
                maxlength="100"
                show-word-limit
              />
            </div>
            <!-- 原有内容输入框 -->
            <div class="input-item">
              <el-input
                v-model="postContent"
                type="textarea"
                :rows="2"
                placeholder="分享你的校园生活..."
                @keyup.enter.ctrl="handlePublish"
              />
            </div>
          </div>
          <div class="publish-action">
            <el-button
              type="primary"
              @click="handlePublish"
              :disabled="!postTitle.trim() || !postContent.trim() || !publishCategoryId || publishCategoryId === ''"
              :loading="publishing"
            >
              发布
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.campus-forum {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding-top: 70px;
  padding-bottom: 100px;
}

.main-content {
  padding: 20px;
}

.content-area {
  max-width: 700px;
  margin: 0 auto;
}

/* 话题标签栏容器 */
.topics-container {
  position: relative;
  margin-bottom: 20px;
  padding-left: 40px;
  padding-right: 40px;
}

/* 话题标签栏 */
.topics-bar {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 8px 4px;
  scrollbar-width: none;
  scroll-behavior: smooth;
}

.topics-bar::-webkit-scrollbar {
  display: none;
}

/* 滚动箭头 */
.scroll-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  font-size: 16px;
  color: #666;
  overflow: visible;
  padding: 0;
  box-sizing: border-box;
}

.scroll-arrow:hover {
  background: rgba(255, 255, 255, 1);
  opacity: 0.9;
  transform: translateY(-50%) scale(1.05);
}

.left-arrow {
  left: 0;
}

.right-arrow {
  right: 0;
}

/* 全部标签的默认样式 */
.topics-bar .topic-tag:not([class*="topic-"]) {
  background-color: #ffffff !important;
  color: #000000 !important;
  border: 1px solid #e5e5e5 !important;
  border-radius: 20px !important;
  box-shadow: none !important;
}

.topics-bar .topic-tag:not([class*="topic-"]):hover {
  background-color: #f5f5f5 !important;
  color: #000000 !important;
  border-color: #e5e5e5 !important;
  box-shadow: none !important;
}

.topics-bar .topic-tag:not([class*="topic-"]).active {
  background-color: #f5f5f5 !important;
  color: #000000 !important;
  border-color: #e5e5e5 !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

/* 帖子列表 */
.posts-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid #e8e8e8;
}

.post-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.author-text {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.post-time {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 2px;
}

/* 帖子卡片上的标签（纯展示） */
.post-card .topic-tag {
  font-size: 14px;
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 500;
  white-space: nowrap;
  cursor: default;
  margin-left: 10px;
}

/* 话题标签专属颜色（彩色底 + 白字） */
.post-card .topic-tag.topic-daily {
  background-color: #e53e3e;
  color: #ffffff;
}

.post-card .topic-tag.topic-study {
  background-color: #4299e1;
  color: #ffffff;
}

.post-card .topic-tag.topic-food {
  background-color: #ed8936;
  color: #ffffff;
}

.post-card .topic-tag.topic-activity {
  background-color: #38b2ac;
  color: #ffffff;
}

.post-card .topic-tag.topic-help {
  background-color: #9f7aea;
  color: #ffffff;
}

.post-card .topic-tag.topic-lost {
  background-color: #e53e3e;
  color: #ffffff;
}

.post-card .topic-tag.topic-love {
  background-color: #ec4899;
  color: #ffffff;
}

.post-card .topic-tag.topic-secondhand {
  background-color: #718096;
  color: #ffffff;
}

/* 顶部筛选栏的标签（可点击） */
.topics-bar .topic-tag {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e8e8e8;
}

/* 顶部筛选栏标签的专属颜色（彩色底 + 白字） */
.topics-bar .topic-tag.topic-daily {
  background-color: #e53e3e;
  color: #ffffff;
  border-color: #e53e3e;
}

.topics-bar .topic-tag.topic-study {
  background-color: #4299e1;
  color: #ffffff;
  border-color: #4299e1;
}

.topics-bar .topic-tag.topic-food {
  background-color: #ed8936;
  color: #ffffff;
  border-color: #ed8936;
}

.topics-bar .topic-tag.topic-activity {
  background-color: #38b2ac;
  color: #ffffff;
  border-color: #38b2ac;
}

.topics-bar .topic-tag.topic-help {
  background-color: #9f7aea;
  color: #ffffff;
  border-color: #9f7aea;
}

.topics-bar .topic-tag.topic-lost {
  background-color: #e53e3e;
  color: #ffffff;
  border-color: #e53e3e;
}

.topics-bar .topic-tag.topic-love {
  background-color: #ec4899;
  color: #ffffff;
  border-color: #ec4899;
}

.topics-bar .topic-tag.topic-secondhand {
  background-color: #718096;
  color: #ffffff;
  border-color: #718096;
}

/* 顶部筛选栏标签的交互效果 */
.topics-bar .topic-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  opacity: 0.9;
}

/* 顶部筛选栏标签的选中状态 */
.topics-bar .topic-tag.active {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  opacity: 1;
}

.topics-bar .topic-tag.topic-daily.active {
  background-color: #c53030;
}

.topics-bar .topic-tag.topic-study.active {
  background-color: #3182ce;
}

.topics-bar .topic-tag.topic-food.active {
  background-color: #dd6b20;
}

.topics-bar .topic-tag.topic-activity.active {
  background-color: #319795;
}

.topics-bar .topic-tag.topic-help.active {
  background-color: #805ad5;
}

.topics-bar .topic-tag.topic-lost.active {
  background-color: #c53030;
}

.topics-bar .topic-tag.topic-love.active {
  background-color: #d53f8c;
}

.topics-bar .topic-tag.topic-secondhand.active {
  background-color: #4a5568;
}

.post-content {
  margin-bottom: 12px;
}

.post-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.post-text {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin: 0;
}

.post-actions {
  display: flex;
  gap: 24px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #8c8c8c;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  user-select: none;
}

.action-btn:hover {
  color: #1890ff;
}

.action-btn.active {
  color: #ff4d4f;
}

.action-btn.delete-btn:hover {
  color: #ff4d4f;
}

.action-btn .icon {
  font-size: 16px;
}

.action-btn .count {
  font-size: 13px;
}

/* 评论区域 */
.comments-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 2px solid #f0f0f0;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.comments-list {
  margin-bottom: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.comment-item {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 12px;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.comment-author {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
}

.comment-time {
  font-size: 12px;
  color: #8c8c8c;
}

.comment-text {
  font-size: 13px;
  color: #4a4a4a;
  line-height: 1.5;
  margin: 0;
}

.no-comments {
  text-align: center;
  padding: 20px;
  color: #8c8c8c;
  font-size: 14px;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #8c8c8c;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.loading-comments {
  text-align: center;
  padding: 20px;
  color: #8c8c8c;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.load-more {
  text-align: center;
  padding: 20px;
}

.comment-delete {
  color: #ff4d4f;
  cursor: pointer;
  font-size: 14px;
  transition: color 0.2s ease;
}

.comment-delete:hover {
  color: #ff7875;
}

.comment-input-area {
  margin-top: 12px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 14px;
  color: #8c8c8c;
  margin: 0;
}

/* 底部发布栏 */
.publish-bar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 700px;
  background: white;
  padding: 16px 20px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  border-radius: 16px 16px 0 0;
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.publish-topic-select {
  flex-shrink: 0;
}

.publish-input-wrapper {
  flex: 1;
}

.input-item {
  margin-bottom: 8px;
}

.publish-action {
  flex-shrink: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .content-area {
    padding: 12px;
  }

  .topics-bar {
    padding: 8px 12px;
    gap: 8px;
  }

  .topic-tag {
    padding: 6px 12px;
    font-size: 13px;
  }

  .publish-bar {
    padding: 12px;
    gap: 8px;
  }

  .publish-topic-select {
    width: 110px !important;
  }

  .post-actions {
    gap: 20px;
  }
}
</style>
