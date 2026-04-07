import postgres from "postgres";
import { readFileSync } from "fs";

// Load env manually
const envContent = readFileSync("/home/afreeserv/project/num_zero/.env", "utf-8");
for (const line of envContent.split("\n").filter((l) => l && !l.startsWith("#"))) {
  const [key, ...valParts] = line.split("=");
  if (key && valParts.length) process.env[key.trim()] = valParts.join("=").trim();
}

const DB_URL = process.env.DIRECT_URL;
if (!DB_URL) { console.error("❌ DIRECT_URL missing"); process.exit(1); }

async function debug() {
  console.log("🔍 Debugging Ghost Lots Issue...");
  const client = postgres(DB_URL, { max: 1 });
  const userId = "0SrEJTWc7LpP7cqmN1NeoDvaEq5v3OwE";

  try {
    // 1. Get wallet
    const wallets = await client`SELECT id, base_balance, bonus_balance FROM credit_wallet WHERE user_id = ${userId}`;
    if (wallets.length === 0) { console.error("❌ Wallet not found"); process.exit(1); }
    const wallet = wallets[0];
    console.log(`✅ Wallet: ${wallet.id} (Base: ${wallet.base_balance}, Bonus: ${wallet.bonus_balance})`);

    // 2. Check ALL credit_lots for this wallet
    console.log("\n📋 2. ALL credit_lots for this wallet:");
    const lots = await client`
      SELECT id, credit_type, initial_amount, remaining_amount 
      FROM credit_lot 
      WHERE wallet_id = ${wallet.id}
      ORDER BY created_at;
    `;
    if (lots.length === 0) {
      console.log("   ⚠️ NO credit_lots found for this wallet! This is the root cause.");
    } else {
      lots.forEach((l: any) => console.log(`   - ${l.id} (${l.credit_type}: ${l.remaining_amount}/${l.initial_amount})`));
    }

    // 3. Check transactions to find ghost lot references
    console.log("\n🔍 3. Looking for transaction records referencing lots:");
    const txns = await client`
      SELECT DISTINCT lot_id, type, amount, created_at 
      FROM credit_transaction 
      WHERE user_id = ${userId} AND lot_id IS NOT NULL
      LIMIT 10;
    `;
    txns.forEach((t: any) => console.log(`   - TX: ${t.lot_id} (${t.type}: ${t.amount})`));

    // 4. Check if the ghost lot from logs exists
    const ghostLotId = "lot_bonus_purchase_1774625930862_lfdr8x";
    console.log(`\n👻 4. Checking if ghost lot exists: ${ghostLotId}`);
    const ghostCheck = await client`SELECT id FROM credit_lot WHERE id = ${ghostLotId}`;
    if (ghostCheck.length === 0) {
      console.log("   ❌ Ghost lot DOES NOT EXIST. This confirms the corruption.");
    } else {
      console.log("   ✅ Ghost lot actually exists.");
    }

    // 5. Try calling the stored procedure
    console.log("\n⚗️ 5. Testing get_consumable_lots() procedure for 250 credits...");
    try {
      const result = await client`SELECT * FROM get_consumable_lots(${wallet.id}, 250)`;
      console.log("   ✅ Procedure returned:");
      result.forEach((r: any) => console.log(`   - lot_id: ${r.lot_id}, amount: ${r.consume_amount}`));
    } catch (e) {
      console.error("   ❌ Procedure FAILED:", (e as Error).message);
    }

  } catch (err) {
    console.error("💥 Error:", err);
  } finally {
    await client.end();
    process.exit(0);
  }
}

debug();