import { SyncService } from '../src/services/sync.service'

async function fullSync() {
  console.log('🔄 Full service sync pipeline...\n')
  const sync = new SyncService()
  const providerId = 'prov_grizzly'

  // Step 1: Sync external mappings
  console.log('📦 Step 1: Syncing external service/country mappings...')
  const mappings = await sync.syncExternalMappings(providerId)
  console.log(`   ✅ ${mappings.servicesSynced} services, ${mappings.countriesSynced} countries\n`)

  // Step 2: Sync prices (ALL services, not just 50)
  console.log('💰 Step 2: Syncing prices from provider (all services)...')
  const prices = await sync.syncPricesFromProvider(providerId)
  console.log(
    `   ✅ ${prices.totalUpserted} costs, ${prices.subProvidersSynced} sub-providers, ${prices.servicesProcessed} services\n`
  )

  // Step 3: Recalculate price rules
  console.log('📊 Step 3: Recalculating price rules...')
  const rules = await sync.recalculatePriceRules()
  console.log(`   ✅ ${rules.rulesCreated} price rules created/updated\n`)

  console.log('📋 Full sync complete!')
}

fullSync()
  .then(() => {
    console.log('\n✅ Done.')
    process.exit(0)
  })
  .catch((err) => {
    console.error('\n❌ Failed:', err)
    process.exit(1)
  })
