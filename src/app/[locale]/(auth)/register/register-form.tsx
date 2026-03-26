'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, ChevronRight, Eye, EyeOff } from 'lucide-react'
import { Link, useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { client } from '@/lib/auth/auth-client'
import { cn } from '@/lib/utils'
import { SocialLoginButtons } from '../components/social-login-buttons'

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phoneNumber: z.string().min(8, 'Valid phone number is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type RegisterValues = z.infer<typeof registerSchema>

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
  const [callbackUrl, setCallbackUrl] = useState('/dashboard')

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      phoneNumber: '',
      email: '',
      password: '',
    },
  })

  const { register, handleSubmit, formState: { errors } } = form

  useEffect(() => {
    if (!searchParams) return
    const callback = searchParams.get('callbackUrl')
    if (callback?.startsWith('/')) {
      setCallbackUrl(callback)
    }
  }, [searchParams])

  async function onSubmit(data: RegisterValues) {
    setIsLoading(true)

    try {
      // BetterAuth: Register with phone as username
      const dummyEmail = `${data.phoneNumber.replace(/[^0-9]/g, '')}@shipfree.app`
      const emailToUse = data.email && data.email.trim() !== '' ? data.email : dummyEmail

      const requestData = {
        email: emailToUse,
        password: data.password,
        name: data.name,
        username: data.phoneNumber,
        phoneNumber: data.phoneNumber,
      } as any // Cast to any to bypass TS error if username/phoneNumber plugin fields are missing 

      const response = await client.signUp.email(requestData, {
        onRequest: () => {
          setIsLoading(true)
        },
        onError: (ctx: any) => {
          console.error('Signup error:', ctx.error)
          // Handle unique constraint or other errors if needed
        }
      })

      if (!response || response.error) {
        setIsLoading(false)
        return
      }

      router.push('/dashboard')
    } catch (error) {
      console.error('Signup error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const hasSocial = githubAvailable || googleAvailable || facebookAvailable || microsoftAvailable
  const showDivider = hasSocial

  return (
    <>
      <div className='space-y-1 text-center'>
        <h1 className='font-medium text-[32px] text-black tracking-tight'>Create an account</h1>
        <p className='font-[380] text-[16px] text-muted-foreground'>Enter your details</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className='mt-8 space-y-8'>
        <div className='space-y-6'>
          {/* Name Field */}
          <div className='space-y-2'>
            <Label htmlFor='name'>Full name</Label>
            <Input
              id='name'
              {...register('name')}
              placeholder='Enter your name'
              autoCapitalize='words'
              autoComplete='name'
              size='lg'
              className={cn(
                'transition-colors focus:border-gray-400 focus:ring-2 focus:ring-gray-100',
                errors.name && 'border-red-500 focus:ring-red-100'
              )}
            />
            {errors.name && <p className='mt-1 text-xs text-red-500'>{errors.name.message}</p>}
          </div>

          {/* Phone Number Field */}
          <div className='space-y-2'>
            <Label htmlFor='phoneNumber'>Phone number</Label>
            <Input
              id='phoneNumber'
              {...register('phoneNumber')}
              placeholder='+1234567890'
              autoComplete='tel'
              size='lg'
              className={cn(
                'transition-colors focus:border-gray-400 focus:ring-2 focus:ring-gray-100',
                errors.phoneNumber && 'border-red-500 focus:ring-red-100'
              )}
            />
            {errors.phoneNumber && <p className='mt-1 text-xs text-red-500'>{errors.phoneNumber.message}</p>}
          </div>

          {/* Email Field (Optional) */}
          <div className='space-y-2'>
            <Label htmlFor='email'>Email (optional)</Label>
            <Input
              id='email'
              {...register('email')}
              placeholder='john@example.com'
              autoComplete='email'
              size='lg'
              className={cn(
                'transition-colors focus:border-gray-400 focus:ring-2 focus:ring-gray-100',
                errors.email && 'border-red-500 focus:ring-red-100'
              )}
            />
            {errors.email && <p className='mt-1 text-xs text-red-500'>{errors.email.message}</p>}
          </div>

          {/* Password Field */}
          <div className='space-y-2'>
            <Label htmlFor='password'>Password</Label>
            <div className='relative'>
              <Input
                id='password'
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder='Enter your password'
                autoComplete='new-password'
                size='lg'
                className={cn(
                  'pr-10 transition-colors focus:border-gray-400 focus:ring-2 focus:ring-gray-100',
                  errors.password && 'border-red-500 focus:ring-red-100'
                )}
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='-translate-y-1/2 absolute top-1/2 right-3 text-gray-500 transition hover:text-gray-700'
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className='mt-1 text-xs text-red-500'>{errors.password.message}</p>}
          </div>
        </div>

        <Button
          type='submit'
          size='lg'
          onMouseEnter={() => setIsButtonHovered(true)}
          onMouseLeave={() => setIsButtonHovered(false)}
          className='group inline-flex w-full items-center justify-center gap-2 rounded-[10px] py-[6px] pr-[10px] pl-[12px] text-[15px] text-white shadow-[inset_0_2px_4px_0_#9B77FF] transition-all'
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
            <div className='w-full border-t border-gray-200' />
          </div>
          <div className='relative flex justify-center text-sm'>
            <span className='bg-white px-4 font-[340] text-muted-foreground'>Or continue with</span>
          </div>
        </div>
      )}

      {hasSocial && (
        <SocialLoginButtons
          googleAvailable={googleAvailable}
          githubAvailable={githubAvailable}
          facebookAvailable={facebookAvailable}
          microsoftAvailable={microsoftAvailable}
          isProduction={isProduction}
          callbackURL={callbackUrl}
        />
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
