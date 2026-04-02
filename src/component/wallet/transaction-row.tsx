'use client'

interface TransactionRowProps {
  label: string
  date: string
  amount: number
  kind: string
}

export function TransactionRow({ label, date, amount, kind }: TransactionRowProps) {
  return (
    <div className='flex items-center gap-3 rounded-lg border bg-card/50 px-4 py-3'>
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-medium truncate'>{label}</p>
        <p className='text-xs text-muted-foreground'>{date}</p>
      </div>
      <span className={`text-sm font-bold ${amount >= 0 ? 'text-success' : 'text-destructive'}`}>
        {amount >= 0 ? '+' : ''}
        {amount} cr
      </span>
    </div>
  )
}
