'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, ChevronRight, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { Button } from '@/component/ui/button'
import { Input } from '@/component/ui/input'
import { Label } from '@/component/ui/label'
import { cn } from '@/common/css'

// ── Request Reset Form ──────────────────────────────────────────────────────

interface RequestResetFormProps {
  phoneNumber: string
  onPhoneNumberChange: (phoneNumber: string) => void
  onSubmit: (phoneNumber: string) => Promise<void>
  isSubmitting: boolean
  statusType: 'success' | 'error' | null
  statusMessage: string
  className?: string
}

export function RequestResetForm({
  phoneNumber,
  onPhoneNumberChange,
  onSubmit,
  isSubmitting,
  statusType,
  statusMessage,
  className,
}: RequestResetFormProps) {
  const [isButtonHovered, setIsButtonHovered] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(phoneNumber)
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-8', className)}>
      <div className='space-y-6'>
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <Label htmlFor='reset-phone'>Phone number</Label>
          </div>
          <Input
            id='reset-phone'
            value={phoneNumber}
            onChange={(e) => onPhoneNumberChange(e.target.value)}
            placeholder='+237 612 345 678'
            type='tel'
            disabled={isSubmitting}
            required
            className='transition-all duration-200 focus:border-primary/40 focus:ring-2 focus:ring-primary/10'
          />
          <p className='text-muted-foreground text-sm'>
            We&apos;ll send a password reset link to your phone number.
          </p>
        </div>

        {statusType && statusMessage && (
          <div
            className={cn(
              'text-xs',
              statusType === 'success' ? 'text-success' : 'text-destructive'
            )}
          >
            <p>{statusMessage}</p>
          </div>
        )}
      </div>

      <Button
        type='submit'
        disabled={isSubmitting}
        onMouseEnter={() => setIsButtonHovered(true)}
        onMouseLeave={() => setIsButtonHovered(false)}
        className='group inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-primary py-[6px] pr-[10px] pl-[12px] text-[15px] text-primary-foreground shadow-sm transition-all'
      >
        <span className='flex items-center gap-1'>
          {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          <span className='inline-flex transition-transform duration-200 group-hover:translate-x-0.5'>
            {isButtonHovered ? (
              <ArrowRight className='h-4 w-4' aria-hidden='true' />
            ) : (
              <ChevronRight className='h-4 w-4' aria-hidden='true' />
            )}
          </span>
        </span>
      </Button>
    </form>
  )
}

// ── Set New Password Form ───────────────────────────────────────────────────

interface SetNewPasswordFormProps {
  token: string | null
  onSubmit: (password: string) => Promise<void>
  isSubmitting: boolean
  statusType: 'success' | 'error' | null
  statusMessage: string
  className?: string
}

export function SetNewPasswordForm({
  token,
  onSubmit,
  isSubmitting,
  statusType,
  statusMessage,
  className,
}: SetNewPasswordFormProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validationMessage, setValidationMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isButtonHovered, setIsButtonHovered] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 8) {
      setValidationMessage('Password must be at least 8 characters long')
      return
    }

    if (password.length > 100) {
      setValidationMessage('Password must not exceed 100 characters')
      return
    }

    if (!/[A-Z]/.test(password)) {
      setValidationMessage('Password must contain at least one uppercase letter')
      return
    }

    if (!/[a-z]/.test(password)) {
      setValidationMessage('Password must contain at least one lowercase letter')
      return
    }

    if (!/[0-9]/.test(password)) {
      setValidationMessage('Password must contain at least one number')
      return
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      setValidationMessage('Password must contain at least one special character')
      return
    }

    if (password !== confirmPassword) {
      setValidationMessage('Passwords do not match')
      return
    }

    setValidationMessage('')
    onSubmit(password)
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-8', className)}>
      <div className='space-y-6'>
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <Label htmlFor='password'>New Password</Label>
          </div>
          <div className='relative'>
            <Input
              id='password'
              type={showPassword ? 'text' : 'password'}
              autoCapitalize='none'
              autoComplete='new-password'
              autoCorrect='off'
              disabled={isSubmitting || !token}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder='Enter new password'
              className={cn(
                'pr-10 transition-all duration-200 focus:border-primary/40 focus:ring-2 focus:ring-primary/10',
                validationMessage &&
                  'border-destructive focus:border-destructive focus:ring-destructive/20'
              )}
            />
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='-translate-y-1/2 absolute top-1/2 right-3 text-muted-foreground transition hover:text-foreground'
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <Label htmlFor='confirmPassword'>Confirm Password</Label>
          </div>
          <div className='relative'>
            <Input
              id='confirmPassword'
              type={showConfirmPassword ? 'text' : 'password'}
              autoCapitalize='none'
              autoComplete='new-password'
              autoCorrect='off'
              disabled={isSubmitting || !token}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder='Confirm new password'
              className={cn(
                'pr-10 transition-all duration-200 focus:border-primary/40 focus:ring-2 focus:ring-primary/10',
                validationMessage &&
                  'border-destructive focus:border-destructive focus:ring-destructive/20'
              )}
            />
            <button
              type='button'
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className='-translate-y-1/2 absolute top-1/2 right-3 text-muted-foreground transition hover:text-foreground'
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {validationMessage && (
          <div className='mt-1 space-y-1 text-destructive text-xs'>
            <p>{validationMessage}</p>
          </div>
        )}

        {statusType && statusMessage && (
          <div
            className={cn(
              'mt-1 space-y-1 text-xs',
              statusType === 'success' ? 'text-success' : 'text-destructive'
            )}
          >
            <p>{statusMessage}</p>
          </div>
        )}
      </div>

      <Button
        disabled={isSubmitting || !token}
        type='submit'
        onMouseEnter={() => setIsButtonHovered(true)}
        onMouseLeave={() => setIsButtonHovered(false)}
        className='group inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-primary py-[6px] pr-[10px] pl-[12px] text-[15px] text-primary-foreground shadow-sm transition-all'
      >
        <span className='flex items-center gap-1'>
          {isSubmitting ? 'Resetting...' : 'Reset Password'}
          <span className='inline-flex transition-transform duration-200 group-hover:translate-x-0.5'>
            {isButtonHovered ? (
              <ArrowRight className='h-4 w-4' aria-hidden='true' />
            ) : (
              <ChevronRight className='h-4 w-4' aria-hidden='true' />
            )}
          </span>
        </span>
      </Button>
    </form>
  )
}

// ── Reset Password Page Component ───────────────────────────────────────────

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | null
    text: string
  }>({
    type: null,
    text: '',
  })

  useEffect(() => {
    if (!token) {
      setStatusMessage({
        type: 'error',
        text: 'Invalid or missing reset token. Please request a new password reset link.',
      })
    }
  }, [token])

  const handleResetPassword = async (password: string) => {
    try {
      setIsSubmitting(true)
      setStatusMessage({ type: null, text: '' })

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to reset password')
      }

      setStatusMessage({
        type: 'success',
        text: 'Password reset successful! Redirecting to login...',
      })

      setTimeout(() => {
        router.push('/login?resetSuccess=true')
      }, 1500)
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to reset password',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className='space-y-1 text-center'>
        <h1 className='font-medium text-[32px] text-foreground tracking-tight'>
          Reset your password
        </h1>
        <p className='font-[380] text-[16px] text-muted-foreground'>
          Enter a new password for your account
        </p>
      </div>

      <div className='mt-8'>
        <SetNewPasswordForm
          token={token}
          onSubmit={handleResetPassword}
          isSubmitting={isSubmitting}
          statusType={statusMessage.type}
          statusMessage={statusMessage.text}
        />
      </div>

      <div className='pt-6 text-center text-[14px] font-light'>
        <Link
          href='/login'
          className='font-medium text-primary underline-offset-4 transition hover:text-primary/80 hover:underline'
        >
          Back to login
        </Link>
      </div>
    </>
  )
}
