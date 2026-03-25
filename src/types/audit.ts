// src/types/audit.ts

/**
 * 帖子审核记录
 */
export interface PostAudit {
  id: number
  postId: number
  auditStatus: number // 0-待审核，1-正常，2-违规
  violationDetails: string
  createdAt: string
  updatedAt: string
}

/**
 * 评论审核记录
 */
export interface CommentAudit {
  id: number
  commentId: number
  auditStatus: number // 0-待审核，1-正常，2-违规
  violationDetails: string
  createdAt: string
  updatedAt: string
}

/**
 * 违规记录（前端展示用，聚合帖子和评论）
 * 根据 /audit/violations 接口返回的数据结构
 */
export interface Violation {
  id: number
  type: 'post' | 'comment'
  postId?: number
  commentId?: number
  content: string
  reason: string
  auditStatus: number
  createdAt: string
}
