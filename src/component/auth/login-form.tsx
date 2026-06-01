'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, ChevronRight, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from '@/component/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from '@/component/ui/dialog'
import { Input } from '@/component/ui/input'
import { Label } from '@/component/ui/label'
import { cn } from '@/common/css'
import { signIn } from '@/common/auth/auth-client'
import { phoneToEmail, isValidPhone } from '@/common/auth/phone-utils'
import { SocialLoginButtons } from './social-login-buttons'

const loginSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .refine((v) => isValidPhone(v), 'Enter a valid phone number (e.g. +237612345678)'),
  password: z.string().min(1, 'Password is required'),
})

type LoginValues = z.infer<typeof loginSchema>

// Better-Auth error context type
interface AuthErrorContext {
  error?: {
    code?: string
    message?: string
  }
}

// Better-Auth signIn input type
interface SignInEmailInput {
  email: string
  password: string
  callbackURL?: string
}

const forgotPasswordSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .refine((v) => isValidPhone(v), 'Enter a valid phone number (e.g. +237612345678)'),
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

const validateCallbackUrl = (url: string): boolean => {
  try {
    if (url.startsWith('/')) return true
    return url.startsWith(typeof window !== 'undefined' ? window.location.origin : '')
  } catch {
    return false
  }
}

export function LoginForm({
  githubAvailable,
  googleAvailable,
  facebookAvailable,
  microsoftAvailable,
}: {
  githubAvailable: boolean
  googleAvailable: boolean
  facebookAvailable: boolean
  microsoftAvailable: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isButtonHovered, setIsButtonHovered] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [callbackUrl, setCallbackUrl] = useState('/my-space')

  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false)
  const [isSubmittingReset, setIsSubmittingReset] = useState(false)
  const [isResetButtonHovered, setIsResetButtonHovered] = useState(false)
  const [resetStatus, setResetStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phoneNumber: '', password: '' },
  })

  const {
    register: registerForgot,
    handleSubmit: handleForgotSubmit,
    formState: { errors: forgotErrors },
    reset: resetForgotForm,
    getValues: getForgotValues,
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { phoneNumber: '' },
  })

  useEffect(() => {
    if (!searchParams) return
    const callback = searchParams.get('callbackUrl')
    if (callback && validateCallbackUrl(callback)) setCallbackUrl(callback)
  }, [searchParams])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && forgotPasswordOpen) handleForgotPassword(getForgotValues())
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [forgotPasswordOpen, getForgotValues])

  async function onSubmit(data: LoginValues) {
    setIsLoading(true)
    setServerError(null)

    const syntheticEmail = phoneToEmail(data.phoneNumber)

    try {
      const safeCallbackUrl = validateCallbackUrl(callbackUrl) ? callbackUrl : '/my-space'

      await signIn.email(
        {
          email: syntheticEmail,
          password: data.password,
          callbackURL: safeCallbackUrl,
        } satisfies SignInEmailInput,
        {
          onError: (ctx: AuthErrorContext) => {
            if (ctx.error?.code?.includes('EMAIL_NOT_VERIFIED')) {
              // Phone verification disabled — proceed to callback URL
              router.push(safeCallbackUrl)
              return
            }
            if (
              ctx.error?.code?.includes('INVALID_CREDENTIALS') ||
              ctx.error?.message?.includes('invalid password')
            ) {
              setServerError('Invalid phone number or password.')
            } else if (
              ctx.error?.code?.includes('USER_NOT_FOUND') ||
              ctx.error?.message?.includes('not found')
            ) {
              setServerError('No account found with this phone number.')
            } else {
              setServerError(ctx.error?.message || 'Login failed. Please try again.')
            }
          },
        }
      )

      router.push(safeCallbackUrl)
    } catch {
      setServerError('An unexpected error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (data: ForgotPasswordValues) => {
    const resetEmail = phoneToEmail(data.phoneNumber)

    try {
      setIsSubmittingReset(true)
      setResetStatus({ type: null, message: '' })

      const response = await fetch('/api/auth/forget-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          redirectTo: `${window.location.origin}/reset-password`,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to request password reset')
      }

      setResetStatus({
        type: 'success',
        message: 'Password reset link sent (check your messages)',
      })
      setTimeout(() => {
        setForgotPasswordOpen(false)
        setResetStatus({ type: null, message: '' })
        resetForgotForm()
      }, 2000)
    } catch (error) {
      setResetStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to request password reset',
      })
    } finally {
      setIsSubmittingReset(false)
    }
  }

  const hasSocial = githubAvailable || googleAvailable || facebookAvailable || microsoftAvailable
  const showDivider = hasSocial

  return (
    <>
      <div className='space-y-1 text-center'>
        <h1 className='font-medium text-[32px] text-foreground tracking-tight'>Sign in</h1>
        <p className='font-[380] text-[16px] text-muted-foreground'>Enter your details</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className='mt-8 space-y-8'>
        <div className='space-y-6'>
          <div className='space-y-2'>
            <Label htmlFor='phoneNumber'>Phone number</Label>
            <Input
              id='phoneNumber'
              {...register('phoneNumber')}
              placeholder='+237 612 345 678'
              autoComplete='tel'
              className={cn(
                'transition-all duration-200 focus:border-primary/40 focus:ring-2 focus:ring-primary/10',
                errors.phoneNumber &&
                  'border-destructive focus:border-destructive focus:ring-destructive/20'
              )}
            />
            {errors.phoneNumber && (
              <p className='mt-1 text-xs text-destructive'>{errors.phoneNumber.message}</p>
            )}
          </div>

          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Label htmlFor='password'>Password</Label>
              <button
                type='button'
                onClick={() => setForgotPasswordOpen(true)}
                className='font-medium text-muted-foreground text-xs transition hover:text-foreground'
              >
                Forgot password?
              </button>
            </div>
            <div className='relative'>
              <Input
                id='password'
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                autoCapitalize='none'
                autoComplete='current-password'
                autoCorrect='off'
                placeholder='Enter your password'
                className={cn(
                  'pr-10 transition-all duration-200 focus:border-primary/40 focus:ring-2 focus:ring-primary/10',
                  errors.password &&
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
            {errors.password && (
              <p className='mt-1 text-xs text-destructive'>{errors.password.message}</p>
            )}
          </div>
        </div>

        {serverError && <p className='text-xs text-destructive text-center'>{serverError}</p>}

        <Button
          type='submit'
          onMouseEnter={() => setIsButtonHovered(true)}
          onMouseLeave={() => setIsButtonHovered(false)}
          className='group inline-flex w-full items-center justify-center gap-2 rounded-[10px] py-[6px] pr-[10px] pl-[12px] text-[15px] bg-primary text-primary-foreground shadow-sm transition-all'
          disabled={isLoading}
        >
          <span className='flex items-center gap-1'>
            {isLoading ? 'Signing in...' : 'Sign in'}
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

      {showDivider && (
        <div className='relative my-6 font-light'>
          <div className='absolute inset-0 flex items-center'>
            <div className='w-full border-t border-border' />
          </div>
          <div className='relative flex justify-center text-sm'>
            <span className='bg-background px-4 font-[340] text-muted-foreground'>
              Or continue with
            </span>
          </div>
        </div>
      )}

      {hasSocial && (
        <div>
          <SocialLoginButtons
            googleAvailable={googleAvailable}
            githubAvailable={githubAvailable}
            facebookAvailable={facebookAvailable}
            microsoftAvailable={microsoftAvailable}
            callbackURL={callbackUrl}
          />
        </div>
      )}

      <div className='pt-6 text-center text-[14px] font-light'>
        <span className='font-normal'>Don&apos;t have an account? </span>
        <Link
          href={`/register?callbackUrl=${callbackUrl}`}
          className='font-medium text-primary underline-offset-4 transition hover:text-primary/80 hover:underline'
        >
          Sign up
        </Link>
      </div>

      <div className='absolute inset-x-0 bottom-0 px-8 pb-8 text-center text-[13px] font-[340] leading-relaxed text-muted-foreground sm:px-8 md:px-[44px]'>
        By signing in, you agree to our{' '}
        <Link
          href='/terms'
          target='_blank'
          rel='noopener noreferrer'
          className='text-primary underline-offset-4 transition hover:text-primary/80 hover:underline'
        >
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link
          href='/privacy'
          target='_blank'
          rel='noopener noreferrer'
          className='text-primary underline-offset-4 transition hover:text-primary/80 hover:underline'
        >
          Privacy Policy
        </Link>
      </div>

      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle className='text-xl font-semibold tracking-tight text-foreground'>
              Reset Password
            </DialogTitle>
            <DialogDescription className='text-sm text-muted-foreground'>
              Enter your phone number and we&apos;ll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotSubmit(handleForgotPassword)}>
            <DialogPanel className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='reset-phone'>Phone number</Label>
                <Input
                  id='reset-phone'
                  {...registerForgot('phoneNumber')}
                  placeholder='+237 612 345 678'
                  type='tel'
                  disabled={isSubmittingReset}
                  className={cn(
                    'transition-all duration-200 focus:border-primary/40 focus:ring-2 focus:ring-primary/10',
                    (resetStatus.type === 'error' || forgotErrors.phoneNumber) &&
                      'border-destructive focus:border-destructive focus:ring-destructive/20'
                  )}
                />
                {forgotErrors.phoneNumber && (
                  <div className='mt-1 text-xs text-destructive'>
                    <p>{forgotErrors.phoneNumber.message}</p>
                  </div>
                )}
                {resetStatus.type === 'error' && resetStatus.message && (
                  <div className='mt-1 text-xs text-destructive'>
                    <p>{resetStatus.message}</p>
                  </div>
                )}
              </div>
              {resetStatus.type === 'success' && (
                <div className='mt-1 text-xs text-success'>
                  <p>{resetStatus.message}</p>
                </div>
              )}
            </DialogPanel>
            <DialogFooter>
              <Button
                type='submit'
                onMouseEnter={() => setIsResetButtonHovered(true)}
                onMouseLeave={() => setIsResetButtonHovered(false)}
                className='group inline-flex items-center justify-center gap-2 rounded-[10px] border border-primary bg-primary px-4 py-2 text-[15px] text-primary-foreground shadow-sm transition-all'
                disabled={isSubmittingReset}
              >
                <span className='flex items-center gap-1'>
                  {isSubmittingReset ? 'Sending...' : 'Send Reset Link'}
                  <span className='inline-flex transition-transform duration-200 group-hover:translate-x-0.5'>
                    {isResetButtonHovered ? (
                      <ArrowRight className='h-4 w-4' aria-hidden='true' />
                    ) : (
                      <ChevronRight className='h-4 w-4' aria-hidden='true' />
                    )}
                  </span>
                </span>
              </Button>
            </DialogFooter>
          </form>
        </DialogPopup>
      </Dialog>
    </>
  )
}
