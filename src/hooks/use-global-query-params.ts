'use client'

import { useQueryStates, parseAsString, parseAsStringEnum, parseAsInteger } from 'nuqs'
import type { DisplayMode } from '@/common/search-params'
import type { MySpaceTab } from '@/component/numbers/my-space-orchestrator'

const parsers = {
  q: parseAsString.withDefault(''),
  display: parseAsStringEnum<DisplayMode>(['list', 'grid']).withDefault('list'),
  category: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
  tab: parseAsStringEnum<MySpaceTab>(['services', 'numbers']).withDefault('services'),
}

export interface GlobalQueryParams {
  q: string
  display: DisplayMode
  category: string
  page: number
  tab: MySpaceTab
}

export interface UseGlobalQueryParamsReturn {
  params: GlobalQueryParams
  setParams: (updates: Partial<GlobalQueryParams>) => void
  clearFilters: () => void
  setTab: (tab: MySpaceTab) => void
}

export function useGlobalQueryParams(): UseGlobalQueryParamsReturn {
  const [params, setQueryStates] = useQueryStates(parsers, {
    history: 'push',
    shallow: true,
  })

  const setParams = (updates: Partial<GlobalQueryParams>) => {
    setQueryStates(updates)
  }

  const clearFilters = () => {
    setQueryStates({ q: '', category: '', page: 1 })
  }

  const setTab = (tab: MySpaceTab) => {
    setQueryStates({ tab })
  }

  return { params, setParams, clearFilters, setTab }
}
