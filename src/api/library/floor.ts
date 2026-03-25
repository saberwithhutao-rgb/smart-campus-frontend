// src/api/forum.ts
import request from '@/utils/request'
import type {
  Category,
  Post,
  PageResponse,
  CreatePostParams,
  CreateCommentParams,
  Comment,
} from '@/types/forum'

// ==================== 分类 API ====================

/**
 * 查询所有分类列表
 */
export const getCategories = async (): Promise<Category[]> => {
  try {
    const response = await request({
      url: '/categories',
      method: 'GET',
    })
    if (response && typeof response === 'object') {
      if ('code' in response && response.code === 200) {
        return response.data || []
      }
      if (Array.isArray(response)) {
        return response
      }
    }
    return []
  } catch (error) {
    console.error('获取分类列表失败:', error)
    return []
  }
}

// ==================== 帖子 API ====================

/**
 * 发布帖子（userId 从 token 获取，不需要传）
 */
export const addPost = async (post: CreatePostParams): Promise<Post> => {
  try {
    const response = await request({
      url: '/posts',
      method: 'POST',
      data: post,
    })
    return response as unknown as Post
  } catch (error) {
    console.error('发布帖子失败:', error)
    throw error
  }
}

/**
 * 分页查询所有帖子
 */
export const getPosts = async (
  page: number = 0,
  size: number = 10,
): Promise<PageResponse<Post>> => {
  try {
    const response = await request({
      url: '/posts',
      method: 'GET',
      params: { page, size },
    })

    const res = response as unknown as PageResponse<Post>

    if (res && res.content !== undefined) {
      return res
    }

    return {
      content: [],
      pageable: {
        pageNumber: page,
        pageSize: size,
        sort: { empty: true, sorted: false, unsorted: true },
        offset: page * size,
        paged: true,
        unpaged: false,
      },
      totalPages: 0,
      totalElements: 0,
      last: true,
      size: size,
      number: page,
      sort: { empty: true, sorted: false, unsorted: true },
      first: page === 0,
      numberOfElements: 0,
      empty: true,
    }
  } catch (error) {
    console.error('获取帖子列表失败:', error)
    return {
      content: [],
      pageable: {
        pageNumber: page,
        pageSize: size,
        sort: { empty: true, sorted: false, unsorted: true },
        offset: page * size,
        paged: true,
        unpaged: false,
      },
      totalPages: 0,
      totalElements: 0,
      last: true,
      size: size,
      number: page,
      sort: { empty: true, sorted: false, unsorted: true },
      first: page === 0,
      numberOfElements: 0,
      empty: true,
    }
  }
}

/**
 * 按分类分页查询帖子
 */
export const getPostsByCategory = async (
  categoryId: number,
  page: number = 0,
  size: number = 10,
): Promise<PageResponse<Post>> => {
  if (!categoryId || typeof categoryId !== 'number') {
    return Promise.reject(new Error('分类ID必须是数字'))
  }

  try {
    const response = await request({
      url: `/posts/category/${categoryId}`,
      method: 'GET',
      params: { page, size },
    })

    const res = response as unknown as PageResponse<Post>

    if (res && res.content !== undefined) {
      return res
    }

    return {
      content: [],
      pageable: {
        pageNumber: page,
        pageSize: size,
        sort: { empty: true, sorted: false, unsorted: true },
        offset: page * size,
        paged: true,
        unpaged: false,
      },
      totalPages: 0,
      totalElements: 0,
      last: true,
      size: size,
      number: page,
      sort: { empty: true, sorted: false, unsorted: true },
      first: page === 0,
      numberOfElements: 0,
      empty: true,
    }
  } catch (error) {
    console.error('获取分类帖子失败:', error)
    return {
      content: [],
      pageable: {
        pageNumber: page,
        pageSize: size,
        sort: { empty: true, sorted: false, unsorted: true },
        offset: page * size,
        paged: true,
        unpaged: false,
      },
      totalPages: 0,
      totalElements: 0,
      last: true,
      size: size,
      number: page,
      sort: { empty: true, sorted: false, unsorted: true },
      first: page === 0,
      numberOfElements: 0,
      empty: true,
    }
  }
}

/**
 * 获取帖子详情（包含评论）
 */
export const getPostDetail = async (id: number): Promise<Post> => {
  if (!id || typeof id !== 'number') {
    return Promise.reject(new Error('帖子ID必须是数字'))
  }

  try {
    const response = await request({
      url: `/posts/${id}`,
      method: 'GET',
    })
    return response as unknown as Post
  } catch (error) {
    console.error('获取帖子详情失败:', error)
    throw error
  }
}

/**
 * 删除帖子（userId 从 token 获取，不需要传）
 */
export const deletePost = async (id: number): Promise<void> => {
  if (!id || typeof id !== 'number') {
    return Promise.reject(new Error('帖子ID必须是数字'))
  }

  try {
    await request({
      url: `/posts/${id}`,
      method: 'DELETE',
    })
  } catch (error) {
    console.error('删除帖子失败:', error)
    throw error
  }
}

// ==================== 评论 API ====================

/**
 * 发表评论（userId 从 token 获取，不需要传）
 */
export const addComment = async (comment: CreateCommentParams): Promise<Comment> => {
  if (!comment.postId || !comment.content) {
    return Promise.reject(new Error('缺少必要参数：postId 或 content'))
  }

  try {
    const response = await request({
      url: '/comments',
      method: 'POST',
      data: comment,
    })
    return response as unknown as Comment
  } catch (error) {
    console.error('发表评论失败:', error)
    throw error
  }
}

/**
 * 删除评论（userId 从 token 获取，不需要传）
 */
export const deleteComment = async (id: number): Promise<void> => {
  if (!id || typeof id !== 'number') {
    return Promise.reject(new Error('评论ID必须是数字'))
  }

  try {
    await request({
      url: `/comments/${id}`,
      method: 'DELETE',
    })
  } catch (error) {
    console.error('删除评论失败:', error)
    throw error
  }
}
