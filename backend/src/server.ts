import dotenv from 'dotenv';
import { createApp } from './presentation/http/app.js';

// Load environment variables from backend/.env
dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

const PORT = Number(process.env.PORT || 3000);

async function start() {
  const app = await createApp();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
