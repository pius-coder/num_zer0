import postgres from "postgres";
import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";
import { env } from "../src/config/env";

async function runMigrationFile(client: postgres.Sql, filePath: string): Promise<void> {
  const fileName = filePath.split("/").pop();
  const sqlFile = readFileSync(filePath, "utf-8");

  const statements: string[] = [];
  let current = "";
  let dollarTag = "";

  for (let i = 0; i < sqlFile.length; i++) {
    if (dollarTag === "" && sqlFile[i] === "$") {
      let j = i + 1;
      while (j < sqlFile.length && sqlFile[j] !== "$") j++;
      if (j < sqlFile.length) {
        dollarTag = sqlFile.slice(i, j + 1);
        current += dollarTag;
        i = j;
        continue;
      }
    }

    if (dollarTag !== "" && sqlFile[i] === "$") {
      let j = i + 1;
      while (j < sqlFile.length && sqlFile[j] !== "$") j++;
      if (j < sqlFile.length) {
        const closing = sqlFile.slice(i, j + 1);
        if (closing === dollarTag) {
          current += closing;
          dollarTag = "";
          i = j;
          continue;
        }
      }
    }

    if (sqlFile[i] === ";" && dollarTag === "") {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        statements.push(trimmed);
      }
      current = "";
    } else {
      current += sqlFile[i];
    }
  }

  const trimmed = current.trim();
  if (trimmed.length > 0) statements.push(trimmed);

  if (statements.length === 0) return;

  console.log(`\n📄 ${fileName} — ${statements.length} statements`);

  for (const stmt of statements) {
    const preview = (stmt.split("\n")[0] || "").slice(0, 70);
    try {
      await client.unsafe(stmt);
      console.log("  ✓", preview);
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      if (
        msg.includes("already exists") ||
        msg.includes("does not exist, skipping")
      ) {
        console.log("  ⏭", preview, "(skip)");
      } else {
        console.error("  ✗", preview);
        console.error("    ", msg);
      }
    }
  }
}

async function main() {
  const client = postgres(env.DATABASE_URL, { max: 1 });

  // Discover all migration files in order
  const migrationsDir = resolve(__dirname, "migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log(`Running ${files.length} migration(s)...`);

  for (const file of files) {
    await runMigrationFile(client, resolve(migrationsDir, file));
  }

  console.log("\n✅ Migrations complete.");
  await client.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
