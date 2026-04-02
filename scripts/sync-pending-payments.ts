import { eq, inArray } from "drizzle-orm";
import { db } from "../src/database";
import { creditPurchase } from "../src/database/schema";
import { getFapshiClient } from "../src/services/fapshi";
import { CreditLedgerService } from "../src/services/credit-ledger.service";

const ledgerService = new CreditLedgerService();
const fapshi = getFapshiClient();

async function syncPendingPayments() {
  console.log("🔄 Syncing pending payments...\n");

  const pendingPurchases = await db.query.creditPurchase.findMany({
    where: inArray(creditPurchase.status, ["payment_pending", "confirmed"]),
    columns: {
      id: true,
      userId: true,
      packageId: true,
      creditsBase: true,
      creditsBonus: true,
      totalCredits: true,
      priceXaf: true,
      status: true,
      paymentGatewayId: true,
      paymentRef: true,
      idempotencyKey: true,
      createdAt: true,
    },
  });

  if (pendingPurchases.length === 0) {
    console.log("✅ No pending payments to sync.");
    return;
  }

  console.log(`📦 Found ${pendingPurchases.length} pending purchase(s)\n`);

  let successCount = 0;
  let failedCount = 0;
  let alreadyCreditedCount = 0;

  for (const purchase of pendingPurchases) {
    const gatewayId = purchase.paymentGatewayId ?? purchase.id;
    console.log(`⏳ Checking ${purchase.id} (gateway: ${gatewayId})...`);

    try {
      const fapshiTx = await fapshi.getStatus(gatewayId);
      console.log(`   → Fapshi status: ${fapshiTx.status}`);

      if (fapshiTx.status === "SUCCESSFUL") {
        if (purchase.status === "confirmed") {
          console.log(`   → Already confirmed, crediting wallet...`);
        } else {
          console.log(`   → Marking as confirmed...`);
          await db
            .update(creditPurchase)
            .set({ status: "confirmed" })
            .where(eq(creditPurchase.id, purchase.id));
        }

        const existingTxn = await db.query.creditTransaction.findFirst({
          where: eq(creditTransaction.purchaseId, purchase.id),
        });

        if (existingTxn) {
          console.log(`   → Already credited (transaction exists)`);
          alreadyCreditedCount++;
          continue;
        }

        await ledgerService.creditWallet({
          userId: purchase.userId,
          creditsBase: purchase.creditsBase,
          creditsBonus: purchase.creditsBonus,
          purchaseId: purchase.id,
        });

        await db
          .update(creditPurchase)
          .set({ status: "credited", creditedAt: new Date() })
          .where(eq(creditPurchase.id, purchase.id));

        console.log(
          `   ✅ Credited ${purchase.totalCredits} credits to ${purchase.userId}`,
        );
        successCount++;
      } else if (
        fapshiTx.status === "FAILED" ||
        fapshiTx.status === "EXPIRED"
      ) {
        await db
          .update(creditPurchase)
          .set({
            status: "failed",
            failedAt: new Date(),
            failureReason: `Fapshi status: ${fapshiTx.status}`,
          })
          .where(eq(creditPurchase.id, purchase.id));

        console.log(`   ❌ Marked as failed (${fapshiTx.status})`);
        failedCount++;
      } else {
        console.log(`   ⏸️ Still ${fapshiTx.status}, skipping`);
      }
    } catch (error) {
      console.log(
        `   ⚠️  Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    console.log("");
  }

  console.log("📊 Summary:");
  console.log(`   ✅ Credited: ${successCount}`);
  console.log(`   ⏸️  Already credited: ${alreadyCreditedCount}`);
  console.log(`   ❌ Failed: ${failedCount}`);
  console.log(`   📦 Total processed: ${pendingPurchases.length}`);
}

syncPendingPayments()
  .then(() => {
    console.log("\n✅ Sync complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Sync failed:", err);
    process.exit(1);
  });
