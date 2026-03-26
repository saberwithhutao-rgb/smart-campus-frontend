// src/types/forum.ts

/**
 * 分类类型
 */
export interface Category {
  id: number
  name: string
  code: string
  sort: number
  status: number
}

/**
 * 帖子图片类型
 */
export interface PostImage {
  id: number
  imageUrl: string
  postId: number
}

/**
 * 评论图片类型
 */
export interface CommentImage {
  id: number
  imageUrl: string
  commentId: number
}

/**
 * 评论类型
 */
export interface Comment {
  id: number
  postId: number
  userId: number
  userName?: string
  canDelete?: boolean
  content: string
  createTime: string
  auditStatus: number // 0-待审核，1-正常，2-违规
  images?: CommentImage[]
}

/**
 * 帖子类型
 */
export interface Post {
  id: number
  title: string
  content: string
  categoryId: number
  userId: number
  userName?: string
  canDelete?: boolean
  createTime: string
  auditStatus: number // 0-待审核，1-正常，2-违规
  comments?: Comment[]
  images?: PostImage[]
  category?: Category // 关联的分类对象（如果后端返回了）
  categoryName?: string // 分类名称（如果后端直接返回）
}

/**
 * 分页响应类型
 */
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

/**
 * 创建帖子参数
 */
export interface CreatePostParams {
  title: string
  content: string
  categoryId: number
  imageUrls?: string[]
}

/**
 * 创建评论参数
 */
export interface CreateCommentParams {
  postId: number
  content: string
  imageUrls?: string[]
}
