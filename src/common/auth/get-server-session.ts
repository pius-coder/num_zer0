import { cache } from 'react'
import { headers } from 'next/headers'
import { auth } from './auth'

export const getServerSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  })
})

export const isServerAuthenticated = cache(async () => {
  const session = await getServerSession()
  return Boolean(session)
})
