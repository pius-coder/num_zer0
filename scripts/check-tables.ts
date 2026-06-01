import { db } from '../src/database';
import { sql } from 'drizzle-orm';

async function main() {
  const result = await db.execute(sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`);
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

main().catch(console.error);
