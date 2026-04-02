import postgres from "postgres";
import { readFileSync } from "fs";
import { resolve } from "path";
import { env } from "../src/config/env";

async function main() {
  const client = postgres(env.DATABASE_URL, { max: 1 });

  console.log("Running migrations...");

  const sqlFile = readFileSync(
    resolve(__dirname, "migrations/0001_optimization.sql"),
    "utf-8",
  );

  const statements: string[] = [];
  let current = "";
  let dollarTag = "";

  for (let i = 0; i < sqlFile.length; i++) {
    // Detect $$ or $tag$ opening
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

    // Detect closing $$ or $tag$
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

    // Statement separator
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
  if (trimmed.length > 0) {
    statements.push(trimmed);
  }

  console.log(`Found ${statements.length} statements`);

  for (const stmt of statements) {
    const preview = (stmt.split("\n")[0] || "").slice(0, 80);
    try {
      await client.unsafe(stmt);
      console.log("  ✓", preview);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("already exists")) {
        console.log("  ⏭", preview, "(already exists)");
      } else {
        console.error("  ✗", preview);
        console.error("    ", msg);
      }
    }
  }

  console.log("Migrations complete.");
  await client.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
