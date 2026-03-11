/**
 * 职业资讯相关类型（与职业资讯 API 接口文档一致）
 */

/** 资讯列表项 */
export interface CareerArticle {
  id: number
  title: string
  summary: string
  publishDate: string
  category: string
  authorId: number
}

/** 资讯详情（含正文） */
export interface CareerArticleDetail extends CareerArticle {
  fullContent: string
}

/** 发表/更新资讯请求体 */
export interface CareerArticleCreateDto {
  title: string
  fullContent: string
  category: string
  summary?: string
}

/**
 * 热门职业方向相关类型（与热门职业方向 API 接口文档一致）
 */

/** 热门职业方向列表项（图标由前端按 category 使用默认 emoji，不使用 iconUrl） */
export interface CareerDirectionItem {
  id: number
  title: string
  description: string
  skills: string[]
  minSalary: number | null
  maxSalary: number | null
  category: string
}

/** 热门职业方向详情（含职业详情扩展字段） */
export interface CareerDirectionDetail extends CareerDirectionItem {
  workContent: string | null
  growthPath: string | null
  entryRequirements: string | null
  fullContent: string | null
}
