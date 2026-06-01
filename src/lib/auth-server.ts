import { convexBetterAuthReactStart } from '@convex-dev/better-auth/react-start'

const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL!
const CONVEX_SITE_URL = (import.meta as any).env.VITE_CONVEX_SITE_URL!

export const { handler, getToken, fetchAuthQuery, fetchAuthMutation, fetchAuthAction } =
  convexBetterAuthReactStart({
    convexUrl: CONVEX_URL,
    convexSiteUrl: CONVEX_SITE_URL,
  })
