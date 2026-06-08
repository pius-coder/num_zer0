import { query } from './_generated/server'
import { XAF_TO_USD_RATE } from './lib/rates'

export const getXafUsdRate = query({
  args: {},
  handler: () => XAF_TO_USD_RATE,
})
