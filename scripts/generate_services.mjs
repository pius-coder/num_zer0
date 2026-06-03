#!/usr/bin/env node
/**
 * Parse raw_sms_data.txt and generate the SERVICES array for data.ts
 *
 * Input format: code on one line, name on next (from spreadsheet export)
 * Output: TypeScript SERVICES array printed to stdout
 */
import { readFileSync } from 'fs'

const raw = readFileSync('scripts/raw_sms_data.txt', 'utf-8')
const lines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0)

// Skip header line "Code	Name"
const startIdx = lines[0] === 'Code	Name' ? 1 : 0

// Map known categories (can be expanded)
const CATEGORIES = {
  // Social / messaging
  wa: 'social', tg: 'social', vi: 'social', vb: 'social',
  bw: 'social', ig: 'social', fb: 'social', ds: 'social',
  tw: 'social', tt: 'social', sn: 'social', im: 'social',
  me: 'social', li: 'social', // line messenger
  fu: 'social', // snapchat
  tg: 'social', wa: 'social', imo: 'social',
  // E-commerce / marketplace
  ab: 'ecommerce', // alibaba
  dl: 'ecommerce', // lazada
  ka: 'ecommerce', // shopee
  jd: 'ecommerce', // jd.com
  za: 'ecommerce', // jdcom
  xt: 'ecommerce', // flipkart
  hx: 'ecommerce', // aliexpress
  hw: 'ecommerce', // alipay/alibaba/1688
  pr: 'ecommerce', // trendyol
  yn: 'ecommerce', // allegro
  uu: 'ecommerce', // wildberries
  sn: 'ecommerce', // olx
  // Delivery / transport
  ub: 'delivery', ua: 'delivery', // blablacar
  jg: 'delivery', // grab
  ni: 'delivery', // gojek
  ul: 'delivery', // getir
  rr: 'delivery', // wolt
  dt: 'delivery', // delivery club
  tx: 'delivery', // bolt
  tu: 'delivery', // lyft
  // Finance / banking
  ts: 'finance', // paypal
  re: 'finance', // coinbase
  ti: 'finance', // crypto.com
  ij: 'finance', // revolut
  nu: 'finance', // stripe
  ge: 'finance', // paytm
  bo: 'finance', // wise
  // Dating
  oi: 'dating', // tinder
  qv: 'dating', // badoo
  mo: 'dating', // bumble
  vz: 'dating', // hinge
  ir: 'dating', // chispa
  mv: 'dating', // fruitz
  // Streaming / media
  nf: 'streaming', // netflix
  hb: 'streaming', // twitch
  pp: 'streaming', // huya
  // Gaming
  mt: 'gaming', // steam
  bz: 'gaming', // blizzard
  // Professional
  tn: 'professional', // linkedin
  dr: 'professional', // openai
  mm: 'professional', // microsoft
  go: 'professional', // google,youtube,gmail
  wx: 'professional', // apple
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/--+/g, '-')
}

const services = []
for (let i = startIdx; i < lines.length; i += 2) {
  const code = lines[i].replace(/\t/g, '').trim()
  const name = lines[i + 1]?.replace(/\t/g, '').trim()
  if (!code || !name) continue

  services.push({
    id: code,
    slug: slugify(name) || code,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    category: CATEGORIES[code] || 'other',
  })
}

// Put WhatsApp first, then sort by category order, then alphabetically by name
const catOrder = ['social', 'ecommerce', 'delivery', 'finance', 'dating', 'streaming', 'gaming', 'professional', 'other']

// Remove WhatsApp from sort pool
const whatsapp = services.find(s => s.id === 'wa')
const rest = services.filter(s => s.id !== 'wa')

rest.sort((a, b) => {
  const catA = String(catOrder.indexOf(a.category)).padStart(2, '0')
  const catB = String(catOrder.indexOf(b.category)).padStart(2, '0')
  if (catA !== catB) return catA.localeCompare(catB)
  return a.name.localeCompare(b.name, 'fr')
})

const sorted = whatsapp ? [whatsapp, ...rest] : rest

// Output TypeScript
console.log(`export const SERVICES: Service[] = [`)
for (const s of sorted) {
  console.log(`  { id: '${s.id}', slug: '${s.slug}', name: '${s.name.replace(/'/g, "\\'")}', category: '${s.category}' },`)
}
console.log(`]`)
console.log(`\n// Total: ${sorted.length} services`)
