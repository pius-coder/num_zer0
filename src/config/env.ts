import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    // ─── Database ────────────────────────────────────────────────────────
    DATABASE_URL: z.string().min(1),
    DIRECT_URL: z.string().optional(),

    // ─── Auth ────────────────────────────────────────────────────────────
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().url().default('http://localhost:3000'),

    // ─── GrizzlySMS ─────────────────────────────────────────────────────
    GRIZZLY_API_KEY: z.string().min(1),

    // ─── Fapshi ─────────────────────────────────────────────────────────
    FAPSHI_API_KEY: z.string().min(1),
    FAPSHI_API_USER: z.string().min(1),
    FAPSHI_ENVIRONMENT: z.enum(['sandbox', 'live']).default('sandbox'),

    // ─── SMSMan ─────────────────────────────────────────────────────────
    SMSMAN_API_KEY: z.string().optional(),
    SMSMAN_BASE_URL: z.string().url().optional(),

    // ─── Admin ──────────────────────────────────────────────────────────
    ADMIN_EMAILS: z.string().default(''),
    INTERNAL_API_SECRET: z.string().optional(),

    // ─── Email ──────────────────────────────────────────────────────────
    EMAIL_PROVIDER: z
      .enum(['resend', 'postmark', 'nodemailer', 'plunk', 'custom', 'log'])
      .default('log'),
    RESEND_API_KEY: z.string().optional(),
    RESEND_DOMAIN: z.string().optional(),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    DEFAULT_FROM_EMAIL: z.string().default('noreply@numzero.com'),
    DEFAULT_FROM_NAME: z.string().default('NumZero'),
    FAPSHI_DEFAULT_EMAIL: z.string().default('numzero@gmail.com'),

    // ─── Social Providers ───────────────────────────────────────────────
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    FACEBOOK_CLIENT_ID: z.string().optional(),
    FACEBOOK_CLIENT_SECRET: z.string().optional(),

    // ─── Dev ────────────────────────────────────────────────────────────
    SEED_LIMIT: z.coerce.number().default(200),
  },

  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
    NEXT_PUBLIC_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  },

  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    GRIZZLY_API_KEY: process.env.GRIZZLY_API_KEY,
    FAPSHI_API_KEY: process.env.FAPSHI_API_KEY,
    FAPSHI_API_USER: process.env.FAPSHI_API_USER,
    FAPSHI_ENVIRONMENT: process.env.FAPSHI_ENVIRONMENT,
    SMSMAN_API_KEY: process.env.SMSMAN_API_KEY,
    SMSMAN_BASE_URL: process.env.SMSMAN_BASE_URL,
    ADMIN_EMAILS: process.env.ADMIN_EMAILS,
    INTERNAL_API_SECRET: process.env.INTERNAL_API_SECRET,
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_DOMAIN: process.env.RESEND_DOMAIN,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    DEFAULT_FROM_EMAIL: process.env.DEFAULT_FROM_EMAIL,
    DEFAULT_FROM_NAME: process.env.DEFAULT_FROM_NAME,
    FAPSHI_DEFAULT_EMAIL: process.env.FAPSHI_DEFAULT_EMAIL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
    FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET,
    SEED_LIMIT: process.env.SEED_LIMIT,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
  },

  emptyStringAsUndefined: true,
})
