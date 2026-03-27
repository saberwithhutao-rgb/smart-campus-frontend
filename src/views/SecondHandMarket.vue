<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading, Delete } from '@element-plus/icons-vue'
import GlobalNavbar from '@/components/GlobalNavbar.vue'
import Select from '@/components/select.vue'
import * as forumApi from '@/api/forum'
import type {
  Post,
  Comment,
  Category,
  CreatePostParams,
  CreateCommentParams,
  PageResponse,
} from '@/types/forum'
import request from '@/utils/request'
import type { Violation } from '@/types/audit'

// 响应式数据
const selectedCategoryId = ref<number | null>(null)
const selectedPostId = ref<number | null>(null)
const newComment = ref('')
// 评论图片相关
const commentImages = ref<Record<number, string[]>>({})
const commentFullImages = ref<Record<number, string[]>>({})
const commentUploadLoading = ref<Record<number, boolean>>({})
// 评论文件输入ref
const commentFileInputs = ref<Record<number, HTMLInputElement | null>>({})

// 存储已提示过的违规ID，避免重复提示（使用localStorage持久化）
const processedViolationIds = ref<Set<number>>(
  new Set(JSON.parse(localStorage.getItem('processedViolationIds') || '[]')),
)

// 保存已处理的违规ID到localStorage
const saveProcessedIds = () => {
  localStorage.setItem(
    'processedViolationIds',
    JSON.stringify(Array.from(processedViolationIds.value)),
  )
}

// 发布输入框
const postTitle = ref('')
const postContent = ref('')
const publishCategoryId = ref<number | string>('')

// 图片上传相关
const imageUrls = ref<string[]>([])
const fullImageUrls = ref<string[]>([])
const uploadLoading = ref(false)

// 新增 Image Viewer 相关变量
const showImageViewer = ref(false)
const currentImageList = ref<string[]>([])
const currentImageIndex = ref(0)

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
const categoryList = ref<Category[]>([])
console.log('初始分类列表:', categoryList.value)

// 帖子数据
const postList = ref<PageResponse<Post> | null>(null)

// 话题栏滚动相关
const topicsBarRef = ref<HTMLElement | null>(null)
const showLeftArrow = ref(false)
const showRightArrow = ref(false)

// 获取完整图片URL
const getFullImageUrl = (path: string) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  // 如果 baseURL 是 /api，图片路径可能需要特殊处理
  // 根据后端实际情况调整
  return path
}

// 关闭图片查看器
const closeImageViewer = () => {
  showImageViewer.value = false
  currentImageList.value = []
  currentImageIndex.value = 0
}

// 预览单张图片（兼容旧调用）
const previewImage = (imageUrl: string) => {
  currentImageList.value = [getFullImageUrl(imageUrl)]
  currentImageIndex.value = 0
  showImageViewer.value = true
}

// 预览多张图片
const previewImages = (images: { imageUrl: string }[], index: number) => {
  if (!images || images.length === 0) return
  currentImageList.value = images.map((img) => getFullImageUrl(img.imageUrl))
  currentImageIndex.value = index
  showImageViewer.value = true
}

// 检查违规信息
const checkViolations = async () => {
  try {
    console.log('开始检查违规')

    const violations = await request({
      url: '/audit/violations',
      method: 'GET',
    })

    if (Array.isArray(violations)) {
      // 收集未处理的违规项
      const unprocessedViolations = violations.filter((violation: Violation) => {
        return !processedViolationIds.value.has(violation.id)
      })

      console.log('未处理的违规项:', unprocessedViolations)

      if (unprocessedViolations.length > 0) {
        // 汇总提示
        ElMessage.warning(
          `您有 ${unprocessedViolations.length} 条帖子/评论经AI审核，因内容包含违规信息已自动下架，请规范发布内容`,
        )

        // 将未处理的违规ID加入已处理集合
        unprocessedViolations.forEach((violation: Violation) => {
          processedViolationIds.value.add(violation.id)
        })

        saveProcessedIds()

        // 重新加载帖子列表
        await loadPosts(currentPage.value)
      }
    }
  } catch (error: unknown) {
    console.warn('检查违规信息时发生错误:', error instanceof Error ? error.message : error)
  }
}

/**
 * 通用图片上传函数
 * @param files - 文件列表
 * @param onSuccess - 上传成功回调
 * @param onError - 上传失败回调
 */
const uploadImages = async (
  files: FileList,
  onSuccess?: (urls: string[], fullUrls: string[]) => void,
  onError?: (error: unknown) => void,
): Promise<{ urls: string[]; fullUrls: string[] } | null> => {
  if (!files || files.length === 0) return null

  const formData = new FormData()
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (file) {
      formData.append('images', file)
    }
  }

  try {
    // request 返回的已经是 data 字段，直接就是图片路径数组
    const imageData = await request({
      url: '/upload/images',
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    const urls = Array.isArray(imageData) ? imageData : []

    if (urls.length > 0) {
      const fullUrls = urls.map((url: string) => getFullImageUrl(url))
      onSuccess?.(urls, fullUrls)
      ElMessage.success(`成功上传 ${urls.length} 张图片`)
      return { urls, fullUrls }
    } else {
      ElMessage.warning('上传失败，未返回图片路径')
      onError?.(new Error('上传失败，未返回图片路径'))
      return null
    }
  } catch (error) {
    console.error('上传失败:', error)
    ElMessage.error('图片上传失败，请重试')
    onError?.(error)
    return null
  }
}

// 初始化数据
onMounted(async () => {
  await loadCategories()
  await loadPosts()

  // 初始化滚动状态
  nextTick(() => {
    updateArrowVisibility()
  })

  // 只在页面加载时检查一次违规信息，不再定时轮询
  checkViolations()
})

// 清理函数
onUnmounted(() => {
  // 不需要清理定时任务，因为已经移除了
})

// 加载分类列表
const loadCategories = async () => {
  try {
    console.log('开始加载分类...')
    const res = await forumApi.getCategories()
    console.log('加载分类返回:', res)
    categoryList.value = res
    console.log('分类列表:', categoryList.value)

    if (categoryList.value.length > 0 && !publishCategoryId.value) {
      publishCategoryId.value = categoryList.value[0]!.id
    }
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

    // result 的类型是 PageResponse<Post>
    if (result) {
      // 过滤掉违规帖子（audit_status = 2）
      const filteredContent = (result.content || []).filter(
        (post: Post) => post && post.auditStatus !== 2,
      )

      // 适配后端数据结构
      postList.value = {
        content: filteredContent,
        pageable: result.pageable || {
          pageNumber: page,
          pageSize: pageSize.value,
          sort: { empty: true, sorted: false, unsorted: true },
          offset: page * pageSize.value,
          paged: true,
          unpaged: false,
        },
        totalPages: result.totalPages || 0,
        totalElements: result.totalElements || 0,
        last: result.last !== undefined ? result.last : true,
        size: result.size || pageSize.value,
        number: result.number || page,
        sort: result.sort || { empty: true, sorted: false, unsorted: true },
        first: result.first !== undefined ? result.first : page === 0,
        numberOfElements: filteredContent.length,
        empty: filteredContent.length === 0,
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
          unpaged: false,
        },
        totalPages: 0,
        totalElements: 0,
        last: true,
        size: pageSize.value,
        number: page,
        sort: { empty: true, sorted: false, unsorted: true },
        first: page === 0,
        numberOfElements: 0,
        empty: true,
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
        unpaged: false,
      },
      totalPages: 0,
      totalElements: 0,
      last: true,
      size: pageSize.value,
      number: page,
      sort: { empty: true, sorted: false, unsorted: true },
      first: page === 0,
      numberOfElements: 0,
      empty: true,
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
      const postIndex = postList.value.content.findIndex((p: Post) => p.id === postId)
      if (postIndex > -1 && postList.value.content[postIndex]) {
        // 过滤掉违规评论（audit_status = 2）
        postList.value.content[postIndex].comments = (postDetail.comments || []).filter(
          (comment: Comment) => comment && comment.auditStatus !== 2,
        )
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
  if (!postId) {
    ElMessage.warning('请选择评论的帖子')
    return
  }

  if (
    !newComment.value.trim() &&
    (!commentImages.value ||
      !commentImages.value[postId] ||
      commentImages.value[postId].length === 0)
  ) {
    ElMessage.warning('请输入评论内容或上传图片')
    return
  }

  const commentData: CreateCommentParams = {
    postId,
    content: newComment.value,
    imageUrls: commentImages.value?.[postId] || [],
  }

  commenting.value = true
  try {
    const res = await forumApi.addComment(commentData)
    console.log('评论接口响应', res)

    await loadPostComments(postId)
    newComment.value = ''
    if (commentImages.value) {
      commentImages.value[postId] = []
    }
    if (commentFullImages.value) {
      commentFullImages.value[postId] = []
    }
    ElMessage.success('评论成功')
  } catch (error: unknown) {
    console.error('评论失败:', error)
    if (error instanceof Error && error.message && error.message.includes('敏感词')) {
      ElMessage.error('内容包含敏感词汇，请修改后再发布')
    } else {
      ElMessage.error('评论失败，请稍后重试')
    }
  } finally {
    commenting.value = false
  }
}

// 处理图片上传（发布帖子）
const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return

  uploadLoading.value = true

  try {
    const result = await uploadImages(
      files,
      (urls, fullUrls) => {
        imageUrls.value = [...imageUrls.value, ...urls]
        fullImageUrls.value = [...fullImageUrls.value, ...fullUrls]
      },
      () => {
        // 上传失败时的额外处理（可选）
      },
    )

    if (!result) {
      // 上传失败，清空文件输入
      target.value = ''
    }
  } finally {
    uploadLoading.value = false
    target.value = ''
  }
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  // 可以设置为默认占位图，而不是隐藏
  target.src = '/placeholder-image.png'
  target.style.opacity = '0.6'
}

// 删除图片
const handleImageDelete = (index: number) => {
  imageUrls.value.splice(index, 1)
  fullImageUrls.value.splice(index, 1)
}

// 处理评论图片上传
const handleCommentImageUpload = async (event: Event, postId: number) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return

  // 确保 ref 对象已初始化
  if (!commentUploadLoading.value) {
    commentUploadLoading.value = {}
  }
  if (!commentImages.value[postId]) {
    commentImages.value[postId] = []
  }
  if (!commentFullImages.value[postId]) {
    commentFullImages.value[postId] = []
  }

  commentUploadLoading.value[postId] = true

  try {
    const result = await uploadImages(
      files,
      (urls, fullUrls) => {
        commentImages.value[postId] = [...commentImages.value[postId]!, ...urls]
        commentFullImages.value[postId] = [...commentFullImages.value[postId]!, ...fullUrls]
      },
      () => {
        // 上传失败时的额外处理（可选）
      },
    )

    if (!result) {
      target.value = ''
    }
  } finally {
    commentUploadLoading.value[postId] = false
    target.value = ''
  }
}
// 删除评论图片
const handleCommentImageDelete = (postId: number, index: number) => {
  if (commentImages.value && commentImages.value[postId]) {
    commentImages.value[postId].splice(index, 1)
  }
  if (commentFullImages.value && commentFullImages.value[postId]) {
    commentFullImages.value[postId].splice(index, 1)
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
    const postData: CreatePostParams = {
      title: postTitle.value,
      content: postContent.value,
      categoryId: publishCategoryId.value ? Number(publishCategoryId.value) : 0,
      imageUrls: imageUrls.value,
    }
    await forumApi.addPost(postData)

    // 重新加载帖子列表
    currentPage.value = 0
    await loadPosts(0)
    postTitle.value = ''
    postContent.value = ''
    publishCategoryId.value = ''
    imageUrls.value = []
    fullImageUrls.value = []
    ElMessage.success('发布成功！')
  } catch (error: unknown) {
    if (error instanceof Error && error.message && error.message.includes('敏感词')) {
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
    type: 'warning',
  })
    .then(async () => {
      try {
        await forumApi.deletePost(postId)

        // 从列表中移除帖子
        if (postList.value) {
          const index = postList.value.content.findIndex((p) => p.id === postId)
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
    type: 'warning',
  })
    .then(async () => {
      try {
        // ✅ 修复：不需要传 userId（后端从 token 获取）
        await forumApi.deleteComment(commentId)

        // 从帖子的评论列表中移除
        if (postList.value) {
          const post = postList.value.content.find((p) => p.id === postId)
          if (post && post.comments) {
            const commentIndex = post.comments.findIndex((c) => c.id === commentId)
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
  if (!loading.value && currentPage.value < (postList.value?.totalPages || 0) - 1) {
    loadPosts(currentPage.value + 1)
  }
}

// 根据 categoryId 获取分类名称
const getCategoryName = (categoryId: number): string => {
  const category = categoryList.value.find((item: Category) => item.id === categoryId)
  return category ? category.name : '未知话题'
}

// 根据话题名称获取对应的样式类名
const getTopicClass = (topicName: string): string => {
  const topicClassMap: Record<string, string> = {
    校园日常: 'topic-daily',
    学习交流: 'topic-study',
    美食推荐: 'topic-food',
    校园活动: 'topic-activity',
    求助问答: 'topic-help',
    失物招领: 'topic-lost',
    表白墙: 'topic-love',
    二手交易: 'topic-secondhand',
  }
  return topicClassMap[topicName] || ''
}

// 滚动话题栏
const scrollTopics = (direction: 'left' | 'right') => {
  if (!topicsBarRef.value) return

  const scrollAmount = 150
  const currentScrollLeft = topicsBarRef.value.scrollLeft

  if (direction === 'left') {
    topicsBarRef.value.scrollTo({
      left: currentScrollLeft - scrollAmount,
      behavior: 'smooth',
    })
  } else {
    topicsBarRef.value.scrollTo({
      left: currentScrollLeft + scrollAmount,
      behavior: 'smooth',
    })
  }

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
  showRightArrow.value = scrollLeft < scrollWidth - clientWidth - 10
}
</script>

<template>
  <div class="campus-forum">
    <GlobalNavbar />

    <div class="main-content">
      <div class="content-area">
        <!-- 话题标签栏（带滑动功能） -->
        <div class="topics-container">
          <button
            v-if="showLeftArrow"
            class="scroll-arrow left-arrow"
            @click="scrollTopics('left')"
          >
            ←
          </button>

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
              :class="[
                getTopicClass(category.name),
                { active: selectedCategoryId === category.id },
              ]"
              @click="selectCategory(category.id)"
            >
              #{{ category.name }}
            </div>
          </div>

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
          <div
            v-if="loading && !(postList?.content && postList.content.length)"
            class="loading-state"
          >
            <el-icon class="loading-icon"><Loading /></el-icon>
            <span>加载中...</span>
          </div>

          <div v-for="post in postList?.content || []" :key="post.id" class="post-card">
            <!-- 帖子头部 -->
            <div class="post-header">
              <div class="author-info">
                <div class="avatar">👤</div>
                <div class="author-text">
                  <div class="author-name">{{ post.userName || '未知用户' }}</div>
                  <div class="post-time">
                    {{ post.createTime ? new Date(post.createTime).toLocaleString() : '未知时间' }}
                  </div>
                </div>
              </div>
              <span
                :class="[
                  'topic-tag',
                  getTopicClass(
                    post.categoryName ||
                      getCategoryName(post.categoryId) ||
                      post.category?.name ||
                      '未知话题',
                  ),
                ]"
                v-if="post.categoryName"
                >#{{ post.categoryName }}</span
              >
              <span
                :class="[
                  'topic-tag',
                  getTopicClass(getCategoryName(post.categoryId) || '未知话题'),
                ]"
                v-else-if="post.categoryId"
                >#{{ getCategoryName(post.categoryId) }}</span
              >
              <span
                :class="['topic-tag', getTopicClass(post.category?.name || '未知话题')]"
                v-else-if="post.category"
                >#{{ post.category.name }}</span
              >
            </div>

            <!-- 帖子内容 -->
            <div class="post-content">
              <h3 class="post-title">{{ post.title || '' }}</h3>
              <p class="post-text">{{ post.content || '' }}</p>
              <!-- 帖子图片区域 -->
              <div class="post-images" v-if="post.images && post.images.length > 0">
                <div v-for="(img, idx) in post.images" :key="img.id" class="post-image-item">
                  <img
                    :src="getFullImageUrl(img.imageUrl)"
                    alt="帖子图片"
                    @click="previewImages(post.images!, idx)"
                    @error="handleImageError"
                  />
                </div>
              </div>
            </div>

            <!-- 帖子操作 -->
            <div class="post-actions">
              <div class="action-btn" @click="toggleComments(post.id)">
                <span class="icon">💬</span>
                <span class="count">{{ post.comments?.length || 0 }}</span>
              </div>
              <div
                v-if="post.canDelete"
                class="action-btn delete-btn"
                @click="handleDeletePost(post.id)"
              >
                <span class="icon"
                  ><el-icon><Delete /></el-icon
                ></span>
                <span class="count">删除</span>
              </div>
            </div>

            <!-- 评论区域 -->
            <div v-if="selectedPostId === post.id" class="comments-section">
              <div v-if="loadingComments" class="loading-comments">
                <el-icon class="loading-icon"><Loading /></el-icon>
                <span>加载评论中...</span>
              </div>

              <div v-else class="comments-list">
                <div class="comment-item" v-for="comment in post.comments || []" :key="comment.id">
                  <div class="comment-avatar">👤</div>
                  <div class="comment-content">
                    <div class="comment-header">
                      <span class="comment-author">{{ comment.userName || '未知用户' }}</span>
                      <span class="comment-time">{{
                        comment.createTime
                          ? new Date(comment.createTime).toLocaleString()
                          : '未知时间'
                      }}</span>
                      <span
                        v-if="comment.canDelete"
                        class="comment-delete"
                        @click="handleDeleteComment(comment.id, post.id)"
                      >
                        <el-icon><Delete /></el-icon>
                      </span>
                    </div>
                    <div class="comment-text">{{ comment.content || '' }}</div>
                    <!-- 评论图片 -->
                    <div class="post-images" v-if="comment.images && comment.images.length > 0">
                      <div
                        v-for="(img, idx) in comment.images"
                        :key="img.id"
                        class="post-image-item"
                      >
                        <img
                          :src="getFullImageUrl(img.imageUrl)"
                          alt="评论图片"
                          @click="previewImages(comment.images!, idx)"
                          @error="handleImageError"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="!post.comments || post.comments.length === 0" class="no-comments">
                  暂无评论，快来抢沙发~
                </div>
              </div>

              <!-- 评论输入框 -->
              <div class="comment-input-area">
                <div class="comment-upload-section">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    style="display: none"
                    :ref="
                      (el) => {
                        commentFileInputs[post.id] = el as HTMLInputElement | null
                      }
                    "
                    @change="(e) => handleCommentImageUpload(e, post.id)"
                  />
                  <el-button
                    type="primary"
                    plain
                    icon="Upload"
                    @click="
                      () => {
                        commentFileInputs[post.id]?.click()
                      }
                    "
                    :loading="commentUploadLoading[post.id]"
                  >
                    上传图片
                  </el-button>
                </div>
                <!-- 评论区域的图片预览 -->
                <div
                  v-if="(commentImages[post.id]?.length ?? 0) > 0"
                  class="image-preview-container"
                >
                  <div
                    v-for="(url, index) in commentImages[post.id] ?? []"
                    :key="index"
                    class="image-preview-item"
                    @click="previewImage(commentFullImages[post.id]?.[index] || '')"
                  >
                    <img
                      :src="commentFullImages[post.id]?.[index] || ''"
                      alt="预览图片"
                      class="preview-image"
                    />
                    <div
                      class="image-delete-btn"
                      @click.stop="handleCommentImageDelete(post.id, index)"
                    >
                      <el-icon><Delete /></el-icon>
                    </div>
                  </div>
                </div>
                <el-input
                  v-model="newComment"
                  placeholder="发表你的评论..."
                  @keyup.enter="handlePostComment(post.id)"
                >
                  <template #append>
                    <el-button @click="handlePostComment(post.id)" :loading="commenting"
                      >发送</el-button
                    >
                  </template>
                </el-input>
              </div>
            </div>
          </div>

          <div v-if="!loading && postList?.content?.length === 0" class="empty-state">
            <div class="empty-icon">💬</div>
            <p class="empty-text">暂无相关帖子</p>
          </div>

          <div v-if="!loading && currentPage < (postList?.totalPages || 0) - 1" class="load-more">
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
            <div class="input-item upload-section">
              <input
                type="file"
                multiple
                accept="image/*"
                style="display: none"
                ref="fileInput"
                @change="handleImageUpload"
              />
              <el-button
                type="primary"
                plain
                icon="Upload"
                @click="$refs.fileInput && ($refs.fileInput as HTMLInputElement).click()"
                :loading="uploadLoading"
              >
                上传图片
              </el-button>
            </div>
            <!-- 发布区域的图片预览 -->
            <div v-if="imageUrls.length > 0" class="image-preview-container">
              <div
                v-for="(url, index) in imageUrls"
                :key="index"
                class="image-preview-item"
                @click="previewImage(fullImageUrls[index] || '')"
              >
                <img :src="fullImageUrls[index]" alt="预览图片" class="preview-image" />
                <div class="image-delete-btn" @click.stop="handleImageDelete(index)">
                  <el-icon><Delete /></el-icon>
                </div>
              </div>
            </div>
            <div class="input-item">
              <el-input
                v-model="postTitle"
                placeholder="请输入你的标题"
                maxlength="100"
                show-word-limit
              />
            </div>
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
              :disabled="
                !postTitle.trim() ||
                !postContent.trim() ||
                !publishCategoryId ||
                publishCategoryId === ''
              "
              :loading="publishing"
            >
              发布
            </el-button>
          </div>
        </div>

        <el-image-viewer
          v-if="showImageViewer"
          :url-list="currentImageList"
          :initial-index="currentImageIndex"
          :close-on-press-escape="true"
          @close="closeImageViewer"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ==================== 基础布局与容器 ==================== */
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

/* ==================== 主题标签滚动区域 ==================== */
.topics-container {
  position: relative;
  margin-bottom: 20px;
  padding-left: 40px;
  padding-right: 40px;
}

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

/* 标签通用样式 (来自第二个块) */
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

/* 标签默认样式 (非主题色) */
.topics-bar .topic-tag:not([class*='topic-']) {
  background-color: #ffffff !important;
  color: #000000 !important;
  border: 1px solid #e5e5e5 !important;
  box-shadow: none !important;
}

.topics-bar .topic-tag:not([class*='topic-']):hover {
  background-color: #f5f5f5 !important;
  color: #000000 !important;
  border-color: #e5e5e5 !important;
  box-shadow: none !important;
}

.topics-bar .topic-tag:not([class*='topic-']).active {
  background-color: #f5f5f5 !important;
  color: #000000 !important;
  border-color: #e5e5e5 !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

/* 主题标签颜色 (来自第二个块) */
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

.topics-bar .topic-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  opacity: 0.9;
}

.topics-bar .topic-tag.active {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  opacity: 1;
}

/* 标签激活态加深 (来自第二个块) */
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

/* ==================== 帖子卡片 ==================== */
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

/* 帖子内标签样式 (来自第二个块) */
.post-card .topic-tag {
  font-size: 14px;
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 500;
  white-space: nowrap;
  cursor: default;
  margin-left: 10px;
}
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
  margin-bottom: 12px;
}

.post-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.post-image-item img {
  max-width: 200px;
  max-height: 150px;
  border-radius: 4px;
  border: 1px solid #eee;
  cursor: pointer;
  margin-top: 8px;
  transition: transform 0.2s ease;
}

.post-image-item img:hover {
  transform: scale(1.05);
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

/* ==================== 评论区 ==================== */
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

.comment-delete {
  color: #ff4d4f;
  cursor: pointer;
  font-size: 14px;
  transition: color 0.2s ease;
}
.comment-delete:hover {
  color: #ff7875;
}

.no-comments {
  text-align: center;
  padding: 20px;
  color: #8c8c8c;
  font-size: 14px;
}

.comment-input-area {
  margin-top: 12px;
}

.comment-upload-section {
  margin-bottom: 8px;
}

.loading-state,
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
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.load-more {
  text-align: center;
  padding: 20px;
}

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

/* ==================== 优化后的发布栏样式 (来自第一个块) ==================== */
.publish-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  padding: 16px 20px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  gap: 12px;
  align-items: flex-start;
  transition: all 0.3s ease;
}

/* 响应式居中 */
@media (min-width: 768px) {
  .publish-bar {
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 700px;
    border-radius: 20px 20px 0 0;
  }
}

@media (max-width: 767px) {
  .publish-bar {
    padding: 12px 16px;
    gap: 8px;
  }
}

.publish-topic-select {
  flex-shrink: 0;
  width: 110px;
}

.publish-input-wrapper {
  flex: 1;
  min-width: 0;
}

.input-item {
  margin-bottom: 8px;
}
.input-item:last-child {
  margin-bottom: 0;
}

/* 优化输入框样式 */
.input-item :deep(.el-input__wrapper) {
  border-radius: 24px;
  background-color: #f5f7fa;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  box-shadow: none;
}
.input-item :deep(.el-input__wrapper:hover) {
  background-color: #eef2f6;
}
.input-item :deep(.el-input__wrapper.is-focus) {
  background-color: #fff;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.input-item :deep(.el-textarea__inner) {
  border-radius: 20px;
  background-color: #f5f7fa;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  font-size: 14px;
  padding: 12px 16px;
  resize: none;
}
.input-item :deep(.el-textarea__inner:hover) {
  background-color: #eef2f6;
}
.input-item :deep(.el-textarea__inner:focus) {
  background-color: #fff;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

/* 上传按钮样式 */
.upload-section :deep(.el-button) {
  border-radius: 24px;
  background-color: #f5f7fa;
  border: 1px solid transparent;
  color: #606266;
  transition: all 0.2s ease;
}
.upload-section :deep(.el-button:hover) {
  background-color: #eef2f6;
  color: #409eff;
}
.upload-section :deep(.el-button:active) {
  transform: scale(0.98);
}

/* 发布按钮样式 */
.publish-action :deep(.el-button) {
  border-radius: 24px;
  padding: 10px 24px;
  font-weight: 500;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  border: none;
  transition: all 0.2s ease;
}
.publish-action :deep(.el-button:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}
.publish-action :deep(.el-button:active) {
  transform: translateY(0);
}
.publish-action :deep(.el-button.is-disabled) {
  background: #e0e3e7;
  transform: none;
  box-shadow: none;
}

/* 图片预览容器优化 */
.image-preview-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
  max-height: 80px;
  overflow-y: auto;
  padding: 4px 0;
}

.image-preview-item {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid #f0f0f0;
}
.image-preview-item:hover {
  transform: scale(1.05);
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-delete-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
  font-size: 12px;
  backdrop-filter: blur(4px);
}
.image-preview-item:hover .image-delete-btn {
  opacity: 1;
}
.image-delete-btn:hover {
  background: #ff4d4f;
  transform: scale(1.1);
}

/* 标题输入框特殊样式 */
.input-item:first-child :deep(.el-input__wrapper) {
  padding: 4px 16px;
}

/* ==================== 移动端适配补充 ==================== */
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
    padding: 12px 16px;
  }
  .publish-topic-select {
    width: 95px;
  }
  .image-preview-item {
    width: 52px;
    height: 52px;
  }
  .publish-action :deep(.el-button) {
    padding: 8px 18px;
    font-size: 13px;
  }
  .input-item :deep(.el-textarea__inner) {
    font-size: 13px;
    padding: 10px 14px;
  }
  .post-actions {
    gap: 20px;
  }
  .image-preview-container {
    max-height: 80px;
  }
  .post-preview-content {
    max-width: 95%;
  }
  .post-preview-image {
    max-height: 70vh;
  }
}
</style>
