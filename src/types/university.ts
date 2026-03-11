export interface University {
  id: number
  name: string
  shortName?: string
  code?: string
  province?: string
  city?: string
  institutionType?: string
  officialWebsite?: string
  is985?: boolean
  is211?: boolean
  isDoubleFirstClass?: boolean
  hasDoctorate?: boolean
  hasMaster?: boolean
  tags?: string
}

export interface UniversityListDetail {
  universityId: number
}

export interface UniversityListResponse<T = University[]> {
  code: number
  msg?: string
  message?: string
  data: T
}

export interface UniversityCheckResponse {
  code: number
  msg?: string
  message?: string
  data: boolean
}

export interface UniversityIdsResponse {
  code: number
  msg?: string
  message?: string
  data: number[]
}

export interface UniversityListDetailResponse {
  code: number
  msg?: string
  message?: string
  data: UniversityListDetail[]
}

export interface UniversityCountResponse {
  code: number
  msg?: string
  message?: string
  data: number
}

