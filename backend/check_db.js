const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const count = await prisma.jobCard.count();
    console.log('Local DB Job Cards Count:', count);
    const recent = await prisma.jobCard.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
    console.log('Recent 5 Job Cards:', JSON.stringify(recent, null, 2));
  } catch (err) {
    console.error('Error querying local DB:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
