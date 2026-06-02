'use client'

export function SearchBar() {
  return (
    <div className='relative'>
      <input
        type='text'
        placeholder='Search...'
        className='h-10 w-full rounded-xl border border-border bg-card/50 px-4 text-sm outline-none focus:border-primary/40'
      />
    </div>
  )
}
