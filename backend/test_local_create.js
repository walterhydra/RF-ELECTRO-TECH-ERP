const { PrismaClient } = require('@prisma/client');
const { JobCardsService } = require('./dist/src/modules/job-cards/job-cards.service');
const { PrismaService } = require('./dist/src/prisma/prisma.service');

async function testLocal() {
  const prisma = new PrismaService();
  await prisma.$connect();
  const service = new JobCardsService(prisma);

  try {
    const res = await service.createJobCard({
      jobCardNo: 'TEST-999',
      customerCode: 'CUST-RF045',
      rfePartCode: 'D3625',
      customerPartNo: 'EV-900W-WP-TO247',
      priority: 'NORMAL',
      prodPnlQty: 40,
      custPnlQty: 160,
      totalPcbQty: 160,
      prodPnlAreaSqm: 50,
      custPnlAreaSqm: 45,
      autoLaunch: true,
    }, '');
    console.log('SUCCESS LOCAL CREATE:', res);
  } catch (err) {
    console.error('ERROR LOCAL CREATE:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testLocal();
