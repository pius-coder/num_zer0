'use client'

import { type ReactNode, useEffect, useState } from 'react'

import { Button } from '@/component/ui/button'
import { signIn } from '@/common/auth/auth-client'
import { GoogleIcon, GitHubIcon, MicrosoftIcon, FacebookIcon } from './icons'

interface SocialLoginButtonsProps {
  githubAvailable?: boolean
  googleAvailable?: boolean
  microsoftAvailable?: boolean
  facebookAvailable?: boolean
  callbackURL?: string
  isProduction?: boolean
  children?: ReactNode
}

export function SocialLoginButtons({
  githubAvailable = false,
  googleAvailable = false,
  microsoftAvailable = false,
  facebookAvailable = false,
  callbackURL = '/my-space',
  children,
}: SocialLoginButtonsProps) {
  const [isGithubLoading, setIsGithubLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false)
  const [isFacebookLoading, setIsFacebookLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  async function signInWithGithub() {
    if (!githubAvailable) return
    setIsGithubLoading(true)
    try {
      await signIn.social({ provider: 'github', callbackURL })
    } catch {
      // Error handled by Better-Auth
    } finally {
      setIsGithubLoading(false)
    }
  }

  async function signInWithGoogle() {
    if (!googleAvailable) return
    setIsGoogleLoading(true)
    try {
      await signIn.social({ provider: 'google', callbackURL })
    } catch {
      // Error handled by Better-Auth
    } finally {
      setIsGoogleLoading(false)
    }
  }

  async function signInWithMicrosoft() {
    if (!microsoftAvailable) return
    setIsMicrosoftLoading(true)
    try {
      await signIn.social({ provider: 'microsoft', callbackURL })
    } catch {
      // Error handled by Better-Auth
    } finally {
      setIsMicrosoftLoading(false)
    }
  }

  async function signInWithFacebook() {
    if (!facebookAvailable) return
    setIsFacebookLoading(true)
    try {
      await signIn.social({ provider: 'facebook', callbackURL })
    } catch {
      // Error handled by Better-Auth
    } finally {
      setIsFacebookLoading(false)
    }
  }

  const githubButton = (
    <Button
      variant='outline'
      size='lg'
      className='w-full hover:bg-accent'
      disabled={!githubAvailable || isGithubLoading}
      onClick={signInWithGithub}
    >
      <GitHubIcon className='h-[18px]! w-[18px]! mr-1' />
      {isGithubLoading ? 'Connecting...' : 'GitHub'}
    </Button>
  )

  const googleButton = (
    <Button
      variant='outline'
      size='lg'
      className='w-full hover:bg-accent'
      disabled={!googleAvailable || isGoogleLoading}
      onClick={signInWithGoogle}
    >
      <GoogleIcon className='h-[18px]! w-[18px]! mr-1' />
      {isGoogleLoading ? 'Connecting...' : 'Google'}
    </Button>
  )

  const microsoftButton = (
    <Button
      variant='outline'
      size='lg'
      className='w-full rounded-[10px] shadow-sm hover:bg-accent'
      disabled={!microsoftAvailable || isMicrosoftLoading}
      onClick={signInWithMicrosoft}
    >
      <MicrosoftIcon className='h-[18px]! w-[18px]! mr-1' />
      {isMicrosoftLoading ? 'Connecting...' : 'Microsoft'}
    </Button>
  )

  const facebookButton = (
    <Button
      variant='outline'
      size='lg'
      className='w-full hover:bg-accent'
      disabled={!facebookAvailable || isFacebookLoading}
      onClick={signInWithFacebook}
    >
      <FacebookIcon className='h-[18px]! w-[18px]! mr-1' />
      {isFacebookLoading ? 'Connecting...' : 'Facebook'}
    </Button>
  )

  const hasAnyOAuthProvider =
    githubAvailable || googleAvailable || microsoftAvailable || facebookAvailable

  if (!hasAnyOAuthProvider && !children) {
    return null
  }

  return (
    <div className='grid gap-3 font-light'>
      {googleAvailable && googleButton}
      {githubAvailable && githubButton}
      {microsoftAvailable && microsoftButton}
      {facebookAvailable && facebookButton}
      {children}
    </div>
  )
}
