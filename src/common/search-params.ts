import {
  createSearchParamsCache,
  parseAsString,
  parseAsStringEnum,
  parseAsInteger,
} from 'nuqs/server'

export type DisplayMode = 'list' | 'grid'

export const searchParamsCache = createSearchParamsCache({
  q: parseAsString.withDefault(''),
  display: parseAsStringEnum<DisplayMode>(['list', 'grid']).withDefault('list'),
  category: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
})

export type SearchParams = Awaited<ReturnType<typeof searchParamsCache.parse>>
