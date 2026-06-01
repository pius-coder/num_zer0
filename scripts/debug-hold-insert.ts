import postgres from "postgres";
import { readFileSync } from "fs";

// Load env
const envContent = readFileSync("/home/afreeserv/project/num_zero/.env", "utf-8");
for (const line of envContent.split("\n").filter((l) => l && !l.startsWith("#"))) {
  const [key, ...valParts] = line.split("=");
  if (key && valParts.length) process.env[key.trim()] = valParts.join("=").trim();
}

const DB_URL = process.env.DIRECT_URL;
if (!DB_URL) { console.error("❌ DIRECT_URL missing"); process.exit(1); }

async function debugInsert() {
  console.log("🔍 Debugging credit_hold INSERT failure...");
  const client = postgres(DB_URL, { max: 1 });

  try {
    const userId = "0SrEJTWc7LpP7cqmN1NeoDvaEq5v3OwE";
    const walletId = "wallet_0SrEJTWc7LpP7cqmN1NeoDvaEq5v3OwE";
    const lotId = "lot_99bcb2a049e246fc"; // Base lot

    console.log("📋 Simulating Drizzle Insert (without activation_id)...");
    try {
      // Attempt 1: Standard insert without activation_id
      await client`
        INSERT INTO credit_hold (
          "id", "user_id", "wallet_id", "amount", "credit_type", "lot_id", "state", "expires_at", "idempotency_key", "created_at"
        ) VALUES (
          'hold_debug_test_1',
          ${userId},
          ${walletId},
          100,
          'base',
          ${lotId},
          'held',
          NOW() + INTERVAL '5 minutes',
          'test_debug_key_1',
          NOW()
        )
      `;
      console.log("✅ Insert SUCCESS!");
    } catch (e) {
      console.error("❌ Insert FAILED:");
      console.error((e as Error).message);
    }

    console.log("\n📋 Simulating Drizzle Insert (WITH null activation_id)...");
    try {
      // Attempt 2: Explicit null activation_id
      await client`
        INSERT INTO credit_hold (
          "id", "user_id", "wallet_id", "activation_id", "amount", "credit_type", "lot_id", "state", "expires_at", "idempotency_key", "created_at"
        ) VALUES (
          'hold_debug_test_2',
          ${userId},
          ${walletId},
          null,
          100,
          'base',
          ${lotId},
          'held',
          NOW() + INTERVAL '5 minutes',
          'test_debug_key_2',
          NOW()
        )
      `;
      console.log("✅ Insert with NULL SUCCESS!");
    } catch (e) {
      console.error("❌ Insert with NULL FAILED:");
      console.error((e as Error).message);
    }

  } finally {
    await client.end();
    process.exit(0);
  }
}

debugInsert();