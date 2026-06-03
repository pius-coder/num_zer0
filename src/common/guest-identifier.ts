'use client'

import { authClient } from '#/lib/auth-client'

const GUEST_DOMAIN = 'numzer0.app'

const WORDS = [
  'lune',
  'orage',
  'saphir',
  'azure',
  'nuage',
  'plume',
  'brise',
  'sable',
  'aurore',
  'jade',
  'ciel',
  'aube',
  'neige',
  'baie',
  'douce',
  'glace',
  'vague',
  'perle',
  'lys',
  'roche',
  'olive',
  'cascade',
  'etoile',
  'opale',
] as const

export const IDENTIFIER_REGEX = /^[a-z]+\.[a-z0-9]{4}$/

function randomSuffix(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  const maxValid = Math.floor(256 / chars.length) * chars.length
  const result = new Array<string>(4)
  for (let i = 0; i < 4; i++) {
    let b: number
    do {
      b = crypto.getRandomValues(new Uint8Array(1))[0]
    } while (b >= maxValid)
    result[i] = chars[b % chars.length]
  }
  return result.join('')
}

export function generateIdentifier(): string {
  const word = WORDS[Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32 * WORDS.length)]
  return `${word}.${randomSuffix()}`
}

export function emailFromIdentifier(id: string): string {
  return `${id}@${GUEST_DOMAIN}`
}

function hashIdentifier(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

export function passwordFromIdentifier(id: string): string {
  const h = hashIdentifier(id + 'numz-guest-v1')
  return `G!${h}X`
}

export async function signUpAsGuest(
  existingIdentifier?: string,
): Promise<{ identifier: string; error?: string }> {
  try {
    if (existingIdentifier !== undefined && !IDENTIFIER_REGEX.test(existingIdentifier)) {
      return { identifier: existingIdentifier, error: "Format d'identifiant invité invalide" }
    }
    const identifier = existingIdentifier ?? generateIdentifier()

    const email = emailFromIdentifier(identifier)
    const password = passwordFromIdentifier(identifier)

    const response = await authClient.signUp.email({
      email,
      password,
      name: identifier,
    })

    if (response?.error) {
      return { identifier, error: response.error.message || 'Échec de la création du compte invité' }
    }

    return { identifier }
  } catch (err) {
    return { identifier: existingIdentifier ?? '', error: 'Une erreur réseau est survenue' }
  }
}

export async function signInAsGuest(
  identifier: string,
): Promise<{ error?: string }> {
  try {
    if (!IDENTIFIER_REGEX.test(identifier)) {
      return { error: "Format d'identifiant invité invalide" }
    }

    const email = emailFromIdentifier(identifier)
    const password = passwordFromIdentifier(identifier)

    const response = await authClient.signIn.email({
      email,
      password,
    })

    if (response?.error) {
      return { error: response.error.message || 'Identifiant invité invalide' }
    }

    return {}
  } catch (err) {
    return { error: 'Une erreur réseau est survenue' }
  }
}
