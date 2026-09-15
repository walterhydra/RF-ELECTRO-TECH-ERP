const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check if we can find default user, customer, product, po, flow
  const user = await prisma.user.findFirst();
  const flow = await prisma.processFlowMaster.findFirst();
  const customer = await prisma.customer.findFirst();
  const product = await prisma.product.findFirst();
  const po = await prisma.customerPO.findFirst();

  console.log('Dependencies:', {
    user: user?.id,
    flow: flow?.id,
    customer: customer?.id,
    product: product?.id,
    po: po?.id,
  });

  const jcNo = `TEST-${Date.now().toString().slice(-4)}`;
  const created = await prisma.jobCard.create({
    data: {
      jobCardNo: jcNo,
      customerPoId: po.id,
      productId: product.id,
      processFlowMasterId: flow.id,
      totalQty: 40,
      prodPnlQty: 40,
      custPnlQty: 80,
      totalPcbQty: 160,
      prodPnlAreaSqm: 50,
      custPnlAreaSqm: 45,
      status: 'CREATED',
      qrCodeValue: `RFE-JC-${jcNo}`,
      createdById: user.id,
    }
  });

  console.log('Created JC ID:', created.id);

  // Test findFirst with OR: [{ id: created.id }, { jobCardNo: created.id }]
  const searchWhere = { OR: [{ id: created.id }, { jobCardNo: created.id }] };
  const found = await prisma.jobCard.findFirst({
    where: searchWhere,
    include: {
      customerPO: { include: { customer: true } },
      product: true,
      processFlowMaster: {
        include: {
          steps: { include: { stage: true }, orderBy: { stepOrder: 'asc' } },
        },
      },
      subJobCards: { include: { currentStage: true }, orderBy: { subJobCardNo: 'asc' } },
    },
  });

  console.log('Found with findFirst OR:', found ? found.jobCardNo : 'NULL!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
