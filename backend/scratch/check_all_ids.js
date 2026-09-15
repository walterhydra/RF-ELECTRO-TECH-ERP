const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const users = await p.user.findMany();
  const flows = await p.processFlowMaster.findMany();
  const custs = await p.customer.findMany();
  const prods = await p.product.findMany();
  const pos = await p.customerPO.findMany();
  console.log('Users:', users.map(u => ({ id: u.id, email: u.email })));
  console.log('Flows:', flows.map(f => ({ id: f.id, name: f.name })));
  console.log('Custs:', custs.map(c => ({ id: c.id, code: c.code })));
  console.log('Prods:', prods.map(pr => ({ id: pr.id, code: pr.code })));
  console.log('POs:', pos.map(po => ({ id: po.id, poNo: po.poNo })));
}
main().finally(() => p.$disconnect());
