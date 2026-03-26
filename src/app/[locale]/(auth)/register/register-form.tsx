'use client'

import { useState } from 'react'
import { ArrowRight, ChevronRight, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { client } from '@/lib/auth/auth-client'
import { cn } from '@/lib/utils'
import { phoneToEmail, isValidPhone } from '@/lib/auth/phone-utils'
import { clientLogger } from '@/lib/logger/client-logger'
import { SocialLoginButtons } from '../components/social-login-buttons'

const authPhoneMapLogger = clientLogger.child('auth-phone-map')

// ── Zod Schema ──────────────────────────────────────────────────────────────
const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(39, 'Username must be at most 39 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    phoneNumber: z
      .string()
      .min(1, 'Phone number is required')
      .refine((v) => isValidPhone(v), 'Enter a valid phone number (e.g. +237612345678)'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type RegisterValues = z.infer<typeof registerSchema>

// ── Component ───────────────────────────────────────────────────────────────
export default function RegisterForm({
  githubAvailable,
  googleAvailable,
  facebookAvailable,
  microsoftAvailable,
  isProduction,
}: {
  githubAvailable: boolean
  googleAvailable: boolean
  facebookAvailable: boolean
  microsoftAvailable: boolean
  isProduction: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isButtonHovered, setIsButtonHovered] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const callbackUrl = searchParams?.get('callbackUrl') ?? '/my-space'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(data: RegisterValues) {
    setIsLoading(true)
    setServerError(null)

    try {
      const syntheticEmail = phoneToEmail(data.phoneNumber)

      const requestData = {
        email: syntheticEmail,
        password: data.password,
        username: data.username,
        name: data.username,
      }

      clientLogger.info('Register attempt initiated', {
        phoneNumber: data.phoneNumber,
        email: requestData.email,
        username: requestData.username,
        hasPassword: !!requestData.password,
      })

      authPhoneMapLogger.info('phone_to_email', {
        method: 'phoneToEmail',
        phoneNumber: data.phoneNumber,
        email: requestData.email,
        flow: 'register',
      })

      const response = await client.signUp.email(
        requestData as any, // Cast required: Better-Auth TS types don't include plugin fields on signUp.email
        {
          onError: (ctx: any) => {
            clientLogger.error('Register error', {
              error: ctx.error,
              code: ctx.error.code,
              message: ctx.error.message,
              phoneNumber: data.phoneNumber,
              email: requestData.email,
              username: requestData.username,
            })
            setServerError(ctx.error?.message || 'Registration failed. Please try again.')
          },
        }
      )

      if (!response || response.error) {
        setIsLoading(false)
        return
      }

      clientLogger.info('Register successful', {
        phoneNumber: data.phoneNumber,
        email: requestData.email,
        username: requestData.username,
      })
      router.push('/my-space')
    } catch (error) {
      clientLogger.error('Uncaught register error', {
        error: error instanceof Error ? error.message : String(error),
        phoneNumber: data.phoneNumber,
      })
      setServerError('An unexpected error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  const hasSocial = githubAvailable || googleAvailable || facebookAvailable || microsoftAvailable
  const showDivider = hasSocial

  return (
    <>
      <div className='space-y-1 text-center'>
        <h1 className='font-medium text-[32px] text-foreground tracking-tight'>Create an account</h1>
        <p className='font-[380] text-[16px] text-muted-foreground'>Enter your details</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className='mt-8 space-y-8'>
        <div className='space-y-6'>
          {/* ── Username ── */}
          <div className='space-y-2'>
            <Label htmlFor='username'>Username</Label>
            <Input
              id='username'
              {...register('username')}
              placeholder='johndoe'
              autoCapitalize='none'
              autoComplete='username'
              autoCorrect='off'
              size='lg'
              className={cn(
                'transition-colors focus:border-gray-400 focus:ring-2 focus:ring-gray-100',
                errors.username &&
                'border-destructive focus:border-destructive focus:ring-destructive/20'
              )}
            />
            {errors.username && (
              <p className='mt-1 text-xs text-destructive'>{errors.username.message}</p>
            )}
          </div>

          {/* ── Phone Number (primary) ── */}
          <div className='space-y-2'>
            <Label htmlFor='phoneNumber'>Phone number</Label>
            <Input
              id='phoneNumber'
              {...register('phoneNumber')}
              placeholder='+237 612 345 678'
              autoComplete='tel'
              size='lg'
              className={cn(
                'transition-colors focus:border-gray-400 focus:ring-2 focus:ring-gray-100',
                errors.phoneNumber &&
                'border-destructive focus:border-destructive focus:ring-destructive/20'
              )}
            />
            {errors.phoneNumber && (
              <p className='mt-1 text-xs text-destructive'>{errors.phoneNumber.message}</p>
            )}
          </div>

          {/* ── Password ── */}
          <div className='space-y-2'>
            <Label htmlFor='password'>Password</Label>
            <div className='relative'>
              <Input
                id='password'
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder='Enter your password'
                autoCapitalize='none'
                autoComplete='new-password'
                autoCorrect='off'
                size='lg'
                className={cn(
                  'pr-10 transition-colors focus:border-gray-400 focus:ring-2 focus:ring-gray-100',
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

          {/* ── Confirm Password ── */}
          <div className='space-y-2'>
            <Label htmlFor='confirmPassword'>Confirm password</Label>
            <Input
              id='confirmPassword'
              {...register('confirmPassword')}
              type={showPassword ? 'text' : 'password'}
              placeholder='Confirm your password'
              autoCapitalize='none'
              autoComplete='new-password'
              autoCorrect='off'
              size='lg'
              className={cn(
                'transition-colors focus:border-gray-400 focus:ring-2 focus:ring-gray-100',
                errors.confirmPassword &&
                'border-destructive focus:border-destructive focus:ring-destructive/20'
              )}
            />
            {errors.confirmPassword && (
              <p className='mt-1 text-xs text-destructive'>{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        {/* ── Server Error ── */}
        {serverError && (
          <p className='text-xs text-destructive text-center'>{serverError}</p>
        )}

        <Button
          type='submit'
          size='lg'
          onMouseEnter={() => setIsButtonHovered(true)}
          onMouseLeave={() => setIsButtonHovered(false)}
          className='group inline-flex w-full items-center justify-center gap-2 rounded-[10px] py-[6px] pr-[10px] pl-[12px] text-[15px] bg-primary text-primary-foreground shadow-sm transition-all'
          disabled={isLoading}
        >
          <span className='flex items-center gap-1'>
            {isLoading ? 'Creating account...' : 'Create account'}
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
            <span className='bg-background px-4 font-[340] text-muted-foreground'>Or continue with</span>
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
            isProduction={isProduction}
            callbackURL={callbackUrl}
          />
        </div>
      )}

      <div className='pt-6 text-center text-[14px] font-light'>
        <span className='font-normal'>Already have an account? </span>
        <Link
          href={`/login?callbackUrl=${callbackUrl}`}
          className='font-medium text-(--brand-accent-hex) underline-offset-4 transition hover:text-(--brand-accent-hover-hex) hover:underline'
        >
          Sign in
        </Link>
      </div>

      <div className='absolute inset-x-0 bottom-0 px-8 pb-8 text-center text-[13px] font-[340] leading-relaxed text-muted-foreground sm:px-8 md:px-[44px]'>
        By creating an account, you agree to our{' '}
        <Link
          href='/terms'
          target='_blank'
          rel='noopener noreferrer'
          className='text-(--brand-accent-hex) underline-offset-4 transition hover:text-(--brand-accent-hover-hex) hover:underline'
        >
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link
          href='/privacy'
          target='_blank'
          rel='noopener noreferrer'
          className='text-(--brand-accent-hex) underline-offset-4 transition hover:text-(--brand-accent-hover-hex) hover:underline'
        >
          Privacy Policy
        </Link>
      </div>
    </>
  )
}
