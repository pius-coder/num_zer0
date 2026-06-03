#!/usr/bin/env node
/**
 * Test script for Fapshi Sandbox API
 *
 * Usage:
 *   FAPSHI_API_USER=xxx FAPSHI_API_KEY=xxx node scripts/test-fapshi.mjs
 *
 * Sandbox test numbers:
 *   Success: 670000000, 670000002, 650000000 (MTN)
 *   Success: 690000000, 690000002, 656000000 (Orange)
 *   Failure: 670000001, 670000003, 650000001 (MTN)
 *   Failure: 690000001, 690000003, 656000001 (Orange)
 */

const API_BASE = 'https://sandbox.fapshi.com'
const API_USER = process.env.FAPSHI_API_USER
const API_KEY = process.env.FAPSHI_API_KEY

if (!API_USER || !API_KEY) {
  console.error('Missing FAPSHI_API_USER or FAPSHI_API_KEY env vars')
  process.exit(1)
}

const headers = {
  apiuser: API_USER,
  apikey: API_KEY,
  'Content-Type': 'application/json',
}

async function testDirectPay() {
  console.log('\n=== TEST 1: POST /direct-pay ===')
  console.log('Phone: 670000000 (MTN sandbox - should succeed)')
  console.log('Amount: 1500 XAF')

  const res = await fetch(`${API_BASE}/direct-pay`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      amount: 1500,
      phone: '670000000',
      medium: 'mobile money',
      userId: 'test-user-001',
      externalId: `test_${Date.now()}`,
      message: 'Test payment',
    }),
  })

  const data = await res.json()
  console.log('Status:', res.status)
  console.log('Response:', JSON.stringify(data, null, 2))

  if (res.ok && data.transId) {
    console.log('\n✓ Direct pay initiated. transId:', data.transId)
    return data.transId
  } else {
    console.error('✗ Direct pay failed')
    return null
  }
}

async function testPaymentStatus(transId) {
  console.log('\n=== TEST 2: GET /payment-status/:transId ===')
  console.log('transId:', transId)

  const res = await fetch(`${API_BASE}/payment-status/${transId}`, {
    headers: { apiuser: API_USER, apikey: API_KEY },
  })

  const data = await res.json()
  console.log('Status:', res.status)
  console.log('Response:', JSON.stringify(data, null, 2))
  return data
}

async function testBalance() {
  console.log('\n=== TEST 3: GET /balance ===')

  const res = await fetch(`${API_BASE}/balance`, {
    headers: { apiuser: API_USER, apikey: API_KEY },
  })

  const data = await res.json()
  console.log('Status:', res.status)
  console.log('Response:', JSON.stringify(data, null, 2))
  return data
}

async function testInvalidCredentials() {
  console.log('\n=== TEST 4: Invalid credentials ===')

  const res = await fetch(`${API_BASE}/direct-pay`, {
    method: 'POST',
    headers: {
      apiuser: 'invalid',
      apikey: 'invalid',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount: 1500, phone: '670000000' }),
  })

  const data = await res.json()
  console.log('Status:', res.status, '(expected 403)')
  console.log('Response:', JSON.stringify(data, null, 2))
}

async function main() {
  console.log('Fapshi Sandbox API Test')
  console.log('=======================')
  console.log('API Base:', API_BASE)
  console.log('API User:', API_USER)
  console.log('API Key:', API_KEY.slice(0, 10) + '...')

  await testBalance()

  const transId = await testDirectPay()

  if (transId) {
    // Wait a bit for the payment to process
    console.log('\nWaiting 5s for payment to process...')
    await new Promise((r) => setTimeout(r, 5000))
    await testPaymentStatus(transId)
  }

  await testInvalidCredentials()

  console.log('\n=== DONE ===')
}

main().catch(console.error)
