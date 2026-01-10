import { createPgPool, ensureSchema } from '../src/infrastructure/database/pg.js';
import 'dotenv/config';

async function main() {
  const pool = createPgPool();
  try {
    console.log('Applying schema...');
    await ensureSchema(pool);
    console.log('✓ Schema ensured successfully');
  } catch (error) {
    console.error('Schema migration failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
