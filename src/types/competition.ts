export interface Competition {
  id: number
  name: string
  type: string
  status: string
  level: string
  competitionTime: string
  duration: string
  location: string
  tags: string[]
  officialWebsite?: string
  description?: string
  registrationDeadline?: string
  organizer?: string
  contact?: string
  requirements?: string
}

export interface CompetitionRule {
  id: number
  category: string
  title: string
  content: string
  required: boolean
}

export interface CompetitionListParams {
  name?: string
  type?: string
  status?: string
  level?: string
}

export interface CompetitionListResponse<T = Competition[]> {
  code: number
  msg?: string
  message?: string
  data: T
}

