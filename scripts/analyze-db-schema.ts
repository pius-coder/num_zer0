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

async function analyze() {
  console.log("🔍 Analyzing EXACT production schema for 'credit_hold' table...");
  const client = postgres(DB_URL, { max: 1 });

  try {
    // 1. Check columns in actual Postgres table
    const columns = await client`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'credit_hold'
      ORDER BY ordinal_position;
    `;
    
    console.log("\n📊 Actual DB Schema for 'credit_hold':");
    console.log("Column Name".padEnd(20), "Type".padEnd(15), "Nullable".padEnd(10), "Default");
    console.log("-".repeat(80));
    
    // 2. Check Foreign Key Constraints
    const fks = await client`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='credit_hold';
    `;

    columns.forEach((c: any) => {
        console.log(
            c.column_name.padEnd(20), 
            c.data_type.padEnd(15), 
            c.is_nullable.padEnd(10),
            c.column_default || 'NULL'
        );
    });

    console.log("\n🔗 Foreign Keys:");
    fks.forEach((f: any) => {
        console.log(`   - ${f.column_name} -> ${f.foreign_table_name}`);
    });

  } catch (err) {
    console.error("💥 Error:", err);
  } finally {
    await client.end();
    process.exit(0);
  }
}

analyze();
