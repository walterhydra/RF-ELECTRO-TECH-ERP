const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDependencies() {
  try {
    console.log('--- Testing Roles ---');
    let role = await prisma.role.findFirst({ where: { name: 'SUPER_ADMIN' } });
    if (!role) {
      role = await prisma.role.create({ data: { name: 'SUPER_ADMIN', description: 'Super Administrator' } });
    }
    console.log('Role ID:', role.id);

    console.log('--- Testing User ---');
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: 'System Admin',
          email: 'admin@rfelectro.com',
          passwordHash: 'dummy_hash',
          roleId: role.id,
        },
      });
    }
    console.log('User ID:', user.id);

    console.log('--- Testing Stages ---');
    let stages = await prisma.processStage.findMany();
    if (stages.length === 0) {
      const defaultStageNames = ['CAM / MI Generation', 'CNC Drilling'];
      for (let i = 0; i < defaultStageNames.length; i++) {
        await prisma.processStage.create({
          data: {
            code: `STG-${i + 1}`,
            name: defaultStageNames[i],
            sequenceOrder: i + 1,
            description: defaultStageNames[i],
          },
        });
      }
      stages = await prisma.processStage.findMany();
    }
    console.log('Stages count:', stages.length);

    console.log('--- Testing ProcessFlowMaster ---');
    let processFlow = await prisma.processFlowMaster.findFirst({ where: { isActive: true } });
    if (!processFlow) {
      processFlow = await prisma.processFlowMaster.create({
        data: {
          name: 'PF-01 Standard Flow',
          totalSteps: stages.length,
          createdById: user.id,
        },
      });
    }
    console.log('ProcessFlow ID:', processFlow.id);

    console.log('--- Testing Customer ---');
    let customer = await prisma.customer.findFirst();
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          companyName: 'Apex Electronics Ltd',
          code: 'CUST-RF045',
          contactPerson: 'John Manager',
          email: 'contact@apexelectronics.com',
          phone: '9876543210',
        },
      });
    }
    console.log('Customer ID:', customer.id);

    console.log('--- Testing Product ---');
    let product = await prisma.product.findFirst();
    if (!product) {
      product = await prisma.product.create({
        data: {
          specCardNo: 'D3625',
          revisionNo: 'Rev-00',
          name: 'Main Motherboard V2',
          code: 'EV-900W-WP-TO247',
          customerId: customer.id,
          pcbSize: '100x150mm',
          layers: 4,
          thicknessMm: 1.6,
          copperWeight: '1oz',
          solderMask: 'Green',
          legend: 'White',
          surfaceFinish: 'HASL',
          processFlowId: processFlow.id,
          createdById: user.id,
        },
      });
    }
    console.log('Product ID:', product.id);

    console.log('--- Testing CustomerPO ---');
    let customerPO = await prisma.customerPO.findFirst();
    if (!customerPO) {
      customerPO = await prisma.customerPO.create({
        data: {
          poNo: `PO-2026-${Date.now().toString().slice(-4)}`,
          customerId: customer.id,
          productId: product.id,
          orderQty: 1000,
          poDate: new Date(),
          expectedDeliveryDate: new Date(Date.now() + 7 * 86400000),
          createdById: user.id,
        },
      });
    }
    console.log('CustomerPO ID:', customerPO.id);

    console.log('--- Testing JobCard Create ---');
    const jobCard = await prisma.jobCard.create({
      data: {
        jobCardNo: `JC-TEST-${Date.now().toString().slice(-4)}`,
        customerPoId: customerPO.id,
        productId: product.id,
        processFlowMasterId: processFlow.id,
        totalQty: 40,
        customerPartNo: 'EV-900W-WP-TO247',
        rfePartCode: 'D3625',
        customerCode: 'CUST-RF045',
        priority: 'NORMAL',
        prodPnlQty: 40,
        custPnlQty: 160,
        totalPcbQty: 160,
        prodPnlAreaSqm: 50,
        custPnlAreaSqm: 45,
        status: 'IN_PROGRESS',
        qrCodeValue: `RFE-JC-TEST-${Date.now()}`,
        createdById: user.id,
      },
    });
    console.log('JobCard Created ID:', jobCard.id);

    const findResult = await prisma.jobCard.findFirst({
      where: { id: jobCard.id },
      include: {
        customerPO: { include: { customer: true } },
        product: true,
        processFlowMaster: {
          include: {
            steps: {
              include: { stage: true },
            },
          },
        },
        subJobCards: {
          include: { currentStage: true },
        },
      },
    });
    console.log('FindResult:', findResult ? findResult.jobCardNo : 'NULL');

  } catch (err) {
    console.error('TEST ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testDependencies();
