import { headers } from 'next/headers'
import { auth } from './auth'

export async function requireAdminSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new AdminAuthError('unauthorized', 401)
  }

  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  const userEmail = session.user.email?.toLowerCase()

  if (!userEmail || !adminEmails.includes(userEmail)) {
    throw new AdminAuthError('forbidden: admin access required', 403)
  }

  return session
}

export class AdminAuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'AdminAuthError'
    this.status = status
  }
}
