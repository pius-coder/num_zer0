'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { Loader2, Search, X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  placeholder?: string
  className?: string
}

export function SearchBar({ placeholder = 'Search services...', className }: SearchBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [value, setValue] = useState(searchParams.get('q') ?? '')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const buildUrl = useCallback(
    (term: string) => {
      const params = new URLSearchParams(searchParams.toString())
      const cleanTerm = term.trim()
      if (cleanTerm.length > 0) {
        params.set('q', cleanTerm)
      } else {
        params.delete('q')
      }
      const qs = params.toString()
      return `${pathname}${qs ? `?${qs}` : ''}`
    },
    [pathname, searchParams]
  )

  const pushWithDebounce = useCallback(
    (term: string) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        startTransition(() => {
          router.replace(buildUrl(term), { scroll: false })
        })
      }, 300)
    },
    [buildUrl, router]
  )

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value
    setValue(next)
    pushWithDebounce(next)
  }

  const clearSearch = () => {
    setValue('')
    startTransition(() => {
      router.replace(buildUrl(''), { scroll: false })
    })
    inputRef.current?.focus()
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div className={cn('relative', className)}>
      {isPending ? (
        <Loader2 className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 animate-spin text-muted-foreground' />
      ) : (
        <Search className='-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 h-4 w-4 text-muted-foreground' />
      )}

      <Input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        type='search'
        placeholder={placeholder}
        className='h-9 pr-8 pl-9'
      />

      {value.length > 0 && (
        <button
          type='button'
          onClick={clearSearch}
          className='-translate-y-1/2 absolute top-1/2 right-2 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground'
          aria-label='Clear search'
        >
          <X className='h-3.5 w-3.5' />
        </button>
      )}
    </div>
  )
}

