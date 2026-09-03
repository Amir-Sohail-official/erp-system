import dotenv from 'dotenv';

dotenv.config();

import app from './src/app.js';
import { connectDatabase } from './src/config/database.js';
import { seedDatabase } from './src/config/seed.js';

const port = Number(process.env.PORT ?? 5005);

async function startServer() {
  try {
    await connectDatabase();
    await seedDatabase();

    app.listen(port, () => {
      console.log(`Backend server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
