const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDirectCreate() {
  try {
    const jobCardNo = `26-27-TEST-${Date.now().toString().slice(-4)}`;
    console.log('Testing create for:', jobCardNo);

    // Replicate exact createJobCard logic
    let defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
      let superAdminRole = await prisma.role.findFirst({ where: { name: 'SUPER_ADMIN' } });
      if (!superAdminRole) {
        superAdminRole = await prisma.role.create({ data: { name: 'SUPER_ADMIN', description: 'Super Admin' } });
      }
      defaultUser = await prisma.user.create({
        data: { name: 'System Admin', email: 'admin@rfelectro.com', passwordHash: 'hash', roleId: superAdminRole.id },
      });
    }

    let customer = await prisma.customer.findFirst();
    if (!customer) {
      customer = await prisma.customer.create({
        data: { companyName: 'Apex', code: 'CUST-RF045', contactPerson: 'John', email: 'a@b.com', phone: '123' },
      });
    }

    let product = await prisma.product.findFirst();
    if (!product) {
      product = await prisma.product.create({
        data: { specCardNo: 'D3625', revisionNo: 'R0', name: 'Board', code: 'P01', customerId: customer.id, createdById: defaultUser.id },
      });
    }

    let customerPO = await prisma.customerPO.findFirst();
    if (!customerPO) {
      customerPO = await prisma.customerPO.create({
        data: { poNo: 'PO-01', customerId: customer.id, productId: product.id, orderQty: 1000, poDate: new Date(), expectedDeliveryDate: new Date(), createdById: defaultUser.id },
      });
    }

    let processFlow = await prisma.processFlowMaster.findFirst({ where: { isActive: true } });
    if (!processFlow) {
      processFlow = await prisma.processFlowMaster.create({
        data: { name: 'PF-01', totalSteps: 1, createdById: defaultUser.id },
      });
    }

    const createdJobCard = await prisma.$transaction(async (tx) => {
      const jobCard = await tx.jobCard.create({
        data: {
          jobCardNo,
          customerPoId: customerPO.id,
          productId: product.id,
          processFlowMasterId: processFlow.id,
          totalQty: 40,
          customerPartNo: 'P01',
          rfePartCode: 'D3625',
          customerCode: 'CUST-RF045',
          priority: 'NORMAL',
          prodPnlQty: 40,
          custPnlQty: 160,
          totalPcbQty: 160,
          prodPnlAreaSqm: 50,
          custPnlAreaSqm: 45,
          status: 'CREATED',
          qrCodeValue: `QR-${jobCardNo}`,
          createdById: defaultUser.id,
        },
        include: {
          customerPO: { include: { customer: true } },
          product: true,
          processFlowMaster: true,
          subJobCards: true,
        },
      });

      const subJobCardNo = `${jobCardNo}-1`;
      await tx.subJobCard.create({
        data: {
          subJobCardNo,
          jobCardId: jobCard.id,
          qty: 40,
          prodPnlQty: 40,
          totalPcbQty: 160,
          prodPnlAreaSqm: 50,
          custPnlAreaSqm: 45,
          status: 'PENDING_LAUNCH',
          qrCodeValue: `QR-SJC-${subJobCardNo}`,
          createdById: defaultUser.id,
        },
      });

      return jobCard;
    });

    console.log('SUCCESS: Created job card:', createdJobCard.jobCardNo, createdJobCard.id);
  } catch (err) {
    console.error('ERROR during direct create:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testDirectCreate();
