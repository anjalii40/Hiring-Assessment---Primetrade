require('dotenv').config();
const app = require('./src/app');
const prisma = require('./src/config/database');

const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 API Docs at http://localhost:${PORT}/api/docs`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('SIGINT received. Closing server...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing server...');
  await prisma.$disconnect();
  process.exit(0);
});

start();
