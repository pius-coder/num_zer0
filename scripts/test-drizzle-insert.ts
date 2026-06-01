import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { readFileSync } from "fs";
import * as schema from '../src/database/schema';

// Load env
const envFile = readFileSync("/home/afreeserv/project/num_zero/.env", "utf-8");
envFile.split("\n").forEach(line => {
    if (!line.startsWith("#") && line.includes("=")) {
        const [key, val] = line.split("=");
        process.env[key.trim()] = val.trim();
    }
});

const client = postgres(process.env.DIRECT_URL!, { max: 1 });
const db = drizzle(client, { schema });

async function testDrizzleInsert() {
    console.log("🔍 Connecting to DB via Drizzle...");
    
    // Clean up potential previous test rows
    await client`DELETE FROM credit_hold WHERE idempotency_key = 'test_drizzle_hold';`;

    try {
        console.log("🚀 Attempting Drizzle Insert (Exact match with App logic)...");
        
        await db.insert(schema.creditHold).values({
            id: "hold_test_drizzle_1",
            userId: "0SrEJTWc7LpP7cqmN1NeoDvaEq5v3OwE",
            walletId: "wallet_0SrEJTWc7LpP7cqmN1NeoDvaEq5v3OwE",
            activationId: null, // Force NULL
            amount: 100,
            creditType: "base",
            lotId: "lot_99bcb2a049e246fc",
            state: "held",
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            idempotencyKey: "test_drizzle_hold",
            debitedAt: null,
            releasedAt: null,
            createdAt: new Date(),
        });
        
        console.log("✅ SUCCESS: The insert worked!");
    } catch (error) {
        console.error("❌ FAILED:", error);
        console.error("-- RAW ERROR:", JSON.stringify(error, null, 2));
    } finally {
        await client.end();
    }
}

testDrizzleInsert();
