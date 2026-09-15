const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const c = await p.jobCard.findFirst({ where: { jobCardNo: 'JC001' } });
  console.log('JC001 local id:', c ? c.id : null);
}
main().finally(() => p.$disconnect());
