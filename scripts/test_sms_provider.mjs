#!/usr/bin/env node
/**
 * Test script for sms-online.pro API
 *
 * Usage:
 *   SMSONLINEPRO_API_KEY=xxx node scripts/test_sms_provider.mjs
 *
 * This tests the raw HTTP API endpoints that will be wrapped by Convex actions.
 */

const API_BASE = 'https://sms-online.pro/stubs/handler_api.php'
const API_KEY = process.env.SMSONLINEPRO_API_KEY

if (!API_KEY) {
  console.error('Missing SMSONLINEPRO_API_KEY env var')
  process.exit(1)
}

async function apiCall(params) {
  const url = new URL(API_BASE)
  url.searchParams.set('api_key', API_KEY)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url.toString())
  const text = await res.text()
  // Try JSON parse for V2 endpoints
  try { return JSON.parse(text) } catch { return text }
}

async function testGetBalance() {
  console.log('\n=== TEST 1: getBalance ===')
  const res = await apiCall({ action: 'getBalance' })
  console.log('Response:', res)
  return res
}

async function testGetPrices() {
  console.log('\n=== TEST 2: getPrices (country=33, service=wa) ===')
  const res = await apiCall({ action: 'getPrices', country: '33', service: 'wa' })
  console.log('Response:', JSON.stringify(res, null, 2))
  return res
}

async function testGetNumbersStatus() {
  console.log('\n=== TEST 3: getNumbersStatus (country=33) ===')
  const res = await apiCall({ action: 'getNumbersStatus', country: '33' })
  console.log('Response:', JSON.stringify(res, null, 2))
  return res
}

async function testGetTopCountriesByService() {
  console.log('\n=== TEST 4: getTopCountriesByService (service=wa) ===')
  const res = await apiCall({ action: 'getTopCountriesByService', service: 'wa' })
  console.log('Response:', JSON.stringify(res, null, 2))
  return res
}

async function testGetNumberV2() {
  console.log('\n=== TEST 5: getNumberV2 (service=wa, country=33) ===')
  const res = await apiCall({ action: 'getNumberV2', service: 'wa', country: '33' })
  console.log('Response:', JSON.stringify(res, null, 2))
  return res
}

async function testBadKey() {
  console.log('\n=== TEST 6: Bad API Key ===')
  const url = new URL(API_BASE)
  url.searchParams.set('api_key', 'INVALID_KEY')
  url.searchParams.set('action', 'getBalance')
  const res = await fetch(url.toString())
  const text = await res.text()
  console.log('Response:', text, '(expected BAD_KEY)')
}

async function main() {
  console.log('SMS Online Pro API Test')
  console.log('=======================')
  console.log('API Base:', API_BASE)
  console.log('API Key:', API_KEY.slice(0, 8) + '...')

  await testGetBalance()
  await testGetPrices()
  await testGetNumbersStatus()
  await testGetTopCountriesByService()

  // Only test getNumberV2 if balance is sufficient
  // await testGetNumberV2()

  await testBadKey()

  console.log('\n=== DONE ===')
}

main().catch(console.error)
