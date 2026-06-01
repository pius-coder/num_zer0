export type Prettify<T> = { [K in keyof T]: T[K] } & {}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredFields<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

export interface DateRange {
  from: Date
  to: Date
}

export type SortOrder = 'asc' | 'desc'

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
