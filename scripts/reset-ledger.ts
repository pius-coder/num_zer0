import { db } from "../src/database";
import { sql } from "drizzle-orm";
import { creditWallet, creditHold, creditLot, creditTransaction, creditPurchase } from "../src/database/schema";

async function runReset() {
  console.log("🧹 Starting Ledger Reset...");

  // 1. Delete active holds (depends on lots)
  console.log("🗑️ Deleting credit_holds...");
  await db.delete(creditHold);

  // 2. Delete transactions (depends on lots/purchases)
  console.log("🗑️ Deleting credit_transactions...");
  await db.delete(creditTransaction);

  // 3. Delete purchases
  console.log("🗑️ Deleting credit_purchases...");
  await db.delete(creditPurchase);

  // 4. Delete lots
  console.log("🗑️ Deleting credit_lots...");
  await db.delete(creditLot);

  // 5. Zero out wallets
  console.log("💰 Resetting wallet balances to 0...");
  await db.update(creditWallet).set({
    baseBalance: 0,
    bonusBalance: 0,
    promoBalance: 0,
    totalPurchased: 0,
    totalConsumed: 0,
    totalRefunded: 0,
    totalExpired: 0,
    totalBonusReceived: 0,
    heldBalance: 0,
  });

  console.log("✅ Ledger Reset Complete.");
  process.exit(0);
}

runReset().catch((e) => {
  console.error("❌ Reset failed:", e);
  process.exit(1);
});
