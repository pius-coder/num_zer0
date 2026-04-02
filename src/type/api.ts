export interface ApiResponse<T> {
  data: T
  error?: never
}

export interface ApiError {
  data?: never
  error: string
  message: string
}

export interface PaginatedResponse<T> {
  items: T[]
  nextCursor: string | null
  total: number
}
