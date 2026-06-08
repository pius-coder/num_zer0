import { env } from '../_generated/server'

const RAW_RATE = parseInt(env.XAF_USD_RATE, 10)
export const XAF_TO_USD_RATE = !isNaN(RAW_RATE) && RAW_RATE > 0 ? RAW_RATE : 600

export function xafToUsd(xaf: number): number {
  return Math.round((xaf / XAF_TO_USD_RATE) * 100) / 100
}
