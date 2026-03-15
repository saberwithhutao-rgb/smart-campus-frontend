import request from '@/utils/request'

// 分类类型
export interface Category {
  id: number
  name: string
  code: string
  sort: number
  status: number
}

// 帖子类型
export interface Post {
  id: number
  title: string
  content: string
  category: Category
  userId: number
  createTime: string
  comments?: Comment[]
}

// 评论类型
export interface Comment {
  id: number
  post: {
    id: number
  }
  userId: number
  content: string
  createTime: string
}

// 分页响应类型
export interface PageResponse<T> {
  content: T[]
  pageable: {
    pageNumber: number
    pageSize: number
    sort: {
      empty: boolean
      sorted: boolean
      unsorted: boolean
    }
    offset: number
    paged: boolean
    unpaged: boolean
  }
  totalPages: number
  totalElements: number
  last: boolean
  size: number
  number: number
  sort: {
    empty: boolean
    sorted: boolean
    unsorted: boolean
  }
  first: boolean
  numberOfElements: number
  empty: boolean
}

// 查询所有分类列表
export const getCategories = async (): Promise<Category[]> => {
  try {
    console.log('开始获取分类列表...')
    // 使用相对路径，通过代理访问后端
    const response = await request.get('/api/forum/categories')
    console.log('获取分类列表成功:', response)
    if (Array.isArray(response.data)) {
      return response.data
    } else {
      console.error('获取分类失败:', response)
      return []
    }
  } catch (error) {
    console.error('获取分类失败:', error)
    return []
  }
}

// 发布帖子
export const addPost = async (post: {
  title: string
  content: string
  categoryId: number
  userId: number
}): Promise<Post> => {
  try {
    const response = await request.post('/api/forum/posts', post)
    if (response.data.code === 200) {
      return response.data.data
    } else {
      console.error('发布帖子失败:', response.data.msg)
      throw new Error(response.data.msg || '发布帖子失败')
    }
  } catch (error) {
    console.error('发布帖子失败:', error)
    throw error
  }
}

// 分页查询所有帖子
export const getPosts = async (page: number = 0, size: number = 10): Promise<PageResponse<Post>> => {
  try {
    const response = await request.get('/api/forum/posts', {
      params: { page, size }
    })
    if (response.data.code === 200) {
      return response.data.data
    } else {
      console.error('获取帖子列表失败:', response.data.msg)
      return {
        content: [],
        pageable: {
          pageNumber: page,
          pageSize: size,
          sort: { empty: true, sorted: false, unsorted: true },
          offset: page * size,
          paged: true,
          unpaged: false
        },
        totalPages: 0,
        totalElements: 0,
        last: true,
        size: size,
        number: page,
        sort: { empty: true, sorted: false, unsorted: true },
        first: page === 0,
        numberOfElements: 0,
        empty: true
      }
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
        unpaged: false
      },
      totalPages: 0,
      totalElements: 0,
      last: true,
      size: size,
      number: page,
      sort: { empty: true, sorted: false, unsorted: true },
      first: page === 0,
      numberOfElements: 0,
      empty: true
    }
  }
}

// 按分类分页查询帖子
export const getPostsByCategory = async (
  categoryId: number,
  page: number = 0,
  size: number = 10
): Promise<PageResponse<Post>> => {
  try {
    const response = await request.get(`/api/forum/posts/category/${categoryId}`, {
      params: { page, size }
    })
    if (response.data.code === 200) {
      return response.data.data
    } else {
      console.error('获取分类帖子失败:', response.data.msg)
      return {
        content: [],
        pageable: {
          pageNumber: page,
          pageSize: size,
          sort: { empty: true, sorted: false, unsorted: true },
          offset: page * size,
          paged: true,
          unpaged: false
        },
        totalPages: 0,
        totalElements: 0,
        last: true,
        size: size,
        number: page,
        sort: { empty: true, sorted: false, unsorted: true },
        first: page === 0,
        numberOfElements: 0,
        empty: true
      }
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
        unpaged: false
      },
      totalPages: 0,
      totalElements: 0,
      last: true,
      size: size,
      number: page,
      sort: { empty: true, sorted: false, unsorted: true },
      first: page === 0,
      numberOfElements: 0,
      empty: true
    }
  }
}

// 获取帖子详情（包含评论）
export const getPostDetail = async (id: number): Promise<Post> => {
  try {
    const response = await request.get(`/api/forum/posts/${id}`)
    if (response.data.code === 200) {
      return response.data.data
    } else {
      console.error('获取帖子详情失败:', response.data.msg)
      throw new Error(response.data.msg || '获取帖子详情失败')
    }
  } catch (error) {
    console.error('获取帖子详情失败:', error)
    throw error
  }
}

// 删除帖子（只能本人删除）
export const deletePost = async (id: number, userId: number): Promise<void> => {
  try {
    const response = await request.delete(`/api/forum/posts/${id}`, {
      params: { userId }
    })
    if (response.data.code !== 200) {
      console.error('删除帖子失败:', response.data.msg)
      throw new Error(response.data.msg || '删除帖子失败')
    }
  } catch (error) {
    console.error('删除帖子失败:', error)
    throw error
  }
}

// 发表评论
export const addComment = async (comment: {
  postId: number
  content: string
  userId: number
}): Promise<Comment> => {
  try {
    const response = await request.post('/api/forum/comments', comment)
    if (response.data.code === 200) {
      return response.data.data
    } else {
      console.error('发表评论失败:', response.data.msg)
      throw new Error(response.data.msg || '发表评论失败')
    }
  } catch (error) {
    console.error('发表评论失败:', error)
    throw error
  }
}

// 删除评论（只能本人删除）
export const deleteComment = async (id: number, userId: number): Promise<void> => {
  try {
    const response = await request.delete(`/api/forum/comments/${id}`, {
      params: { userId }
    })
    if (response.data.code !== 200) {
      console.error('删除评论失败:', response.data.msg)
      throw new Error(response.data.msg || '删除评论失败')
    }
  } catch (error) {
    console.error('删除评论失败:', error)
    throw error
  }
}
