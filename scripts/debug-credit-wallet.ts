import postgres from "postgres";
import { readFileSync } from "fs";

// Load env manually to bypass strict validators
const envContent = readFileSync("/home/afreeserv/project/num_zero/.env", "utf-8");
const envLines = envContent.split("\n").filter((l) => l && !l.startsWith("#"));
for (const line of envLines) {
  const [key, ...valParts] = line.split("=");
  if (key && valParts.length) {
    process.env[key.trim()] = valParts.join("=").trim();
  }
}

// Use DIRECT_URL to bypass pgbouncer limits
const DB_URL = process.env.DIRECT_URL;
if (!DB_URL) {
  console.error("❌ DIRECT_URL not found in .env");
  process.exit(1);
}

async function debug() {
  console.log("🔍 Connecting to DB using DIRECT_URL...");
  const client = postgres(DB_URL, { max: 1 });

  try {
    // 1. Check if table exists
    console.log("📋 1. Checking columns for 'credit_wallet'...");
    const columns = await client`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'credit_wallet'
      ORDER BY ordinal_position;
    `;
    
    if (columns.length === 0) {
      console.error("❌ Table 'credit_wallet' DOES NOT EXIST.");
      return;
    }

    console.log("✅ Table exists with columns:");
    columns.forEach((c: any) => console.log(`   - ${c.column_name} (${c.data_type})`));

    // 2. Try the exact query failing on Vercel
    console.log("\n🛒 2. Running failing query...");
    try {
      const rows = await client`SELECT id, user_id, base_balance, bonus_balance, promo_balance, total_purchased, total_consumed, total_refunded, total_expired, total_bonus_received, held_balance, created_at, updated_at FROM credit_wallet LIMIT 5`;
      console.log(`✅ Query SUCCESS. Found rows: ${rows.length}`);
      rows.forEach((r: any) => console.log(r));
    } catch (e) {
      console.error("❌ Query FAILED:", (e as Error).message);
    }

  } catch (err) {
    console.error("💥 Connection Error:", err);
  } finally {
    await client.end();
    process.exit(0);
  }
}

debug();
