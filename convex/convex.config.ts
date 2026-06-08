import { defineApp } from 'convex/server'
import { v } from 'convex/values'
import betterAuth from '@convex-dev/better-auth/convex.config'

const app = defineApp({
  env: {
    XAF_USD_RATE: v.string(),
  },
})
app.use(betterAuth)

export default app
