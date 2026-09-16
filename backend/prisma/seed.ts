import { PrismaClient, RoleCode } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Hash helper for default seed passwords
function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

async function main() {
  console.log('🌱 Starting database seeding for PCB Manufacturing ERP...');

  // 1. Departments
  const departments = [
    { name: 'Admin & IT', description: 'System administration and IT support' },
    { name: 'Sales & Planning', description: 'Customer PO entry, job card launch, and planning' },
    { name: 'Production & Engineering', description: 'Product engineering, CAM, and floor manufacturing' },
    { name: 'Quality Assurance', description: 'In-process QC, AOI, and rejection sign-off' },
    { name: 'Stores & Dispatch', description: 'Finished goods inventory, packing, and gate dispatch' },
    { name: 'Accounts & MIS', description: 'Financial reports and MIS read-only views' },
  ];

  const deptMap: Record<string, string> = {};
  for (const dept of departments) {
    const created = await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: dept,
    });
    deptMap[dept.name] = created.id;
  }
  console.log('✅ Seeded 6 Departments');

  // 2. Roles
  const roles = Object.values(RoleCode);
  const roleMap: Record<string, string> = {};
  for (const roleName of roles) {
    const created = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        description: `Standard role for ${roleName.replace(/_/g, ' ')}`,
      },
    });
    roleMap[roleName] = created.id;
  }
  console.log(`✅ Seeded ${roles.length} Roles`);

  // 3. Process Stages (Standard 20-Stage Double Sided PCB Flow for PF-01)
  const stages = [
    { name: 'SHEARING', defaultOrder: 1, code: 'SHR', description: 'Cutting and Shearing' },
    { name: 'DRILLING', defaultOrder: 2, code: 'DRL', description: 'CNC Drilling' },
    { name: 'DRL-QC', defaultOrder: 3, code: 'DRL-QC', description: 'Drilling Quality Control' },
    { name: 'DML', defaultOrder: 4, code: 'DML', description: 'Direct Metallization Line' },
    { name: 'PIT', defaultOrder: 5, code: 'PIT', description: 'Photo Image Transfer' },
    { name: 'PIT-QC', defaultOrder: 6, code: 'PIT-QC', description: 'Photo Image Quality Control' },
    { name: 'PLATING', defaultOrder: 7, code: 'PLT', description: 'Pattern & Panel Plating' },
    { name: 'ETCHING', defaultOrder: 8, code: 'ETC', description: 'Etching Line' },
    { name: 'PREMASK-QC/AOI', defaultOrder: 9, code: 'AOI', description: 'Premask QC & Automated Optical Inspection' },
    { name: 'PISM', defaultOrder: 10, code: 'PISM', description: 'Photo Imageable Solder Mask' },
    { name: 'PISM-QC', defaultOrder: 11, code: 'PISM-QC', description: 'Solder Mask Quality Control' },
    { name: 'HASL', defaultOrder: 12, code: 'HASL', description: 'Hot Air Solder Leveling' },
    { name: 'HASL-QC', defaultOrder: 13, code: 'HASL-QC', description: 'HASL Quality Control' },
    { name: 'LEGEND PRINT', defaultOrder: 14, code: 'LGD', description: 'Legend / Silkscreen Printing' },
    { name: 'ROUTING', defaultOrder: 15, code: 'RTE', description: 'CNC Routing' },
    { name: 'VG', defaultOrder: 16, code: 'VG', description: 'V-Grooving' },
    { name: 'BBT', defaultOrder: 17, code: 'BBT', description: 'Bare Board Testing / E-Test' },
    { name: 'FQC (AI)', defaultOrder: 18, code: 'FQC', description: 'Final Quality Control with AI' },
    { name: 'PDI-AQL', defaultOrder: 19, code: 'PDI', description: 'Pre-Dispatch Inspection AQL' },
    { name: 'PACKING', defaultOrder: 20, code: 'PKG', description: 'Final Packing & Outbound Dispatch Ready' },
  ];

  const stageMap: Record<string, string> = {};
  for (const stg of stages) {
    const existing = await prisma.processStage.findFirst({
      where: {
        OR: [
          { name: stg.name },
          { code: stg.code },
        ],
      },
    });

    let created;
    if (existing) {
      created = await prisma.processStage.update({
        where: { id: existing.id },
        data: stg,
      });
    } else {
      created = await prisma.processStage.create({
        data: stg,
      });
    }
    stageMap[stg.name] = created.id;
  }
  console.log(`✅ Seeded ${stages.length} Process Stages`);

  // 4. Default Users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@rfelectro.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@rfelectro.com',
      phone: '+919876543210',
      passwordHash: hashPassword('Admin@123456'),
      roleId: roleMap[RoleCode.SUPER_ADMIN],
      departmentId: deptMap['Admin & IT'],
      isActive: true,
    },
  });

  const plannerUser = await prisma.user.upsert({
    where: { email: 'planner@rfelectro.com' },
    update: {},
    create: {
      name: 'Production Planner',
      email: 'planner@rfelectro.com',
      phone: '+919876543211',
      passwordHash: hashPassword('Planner@123'),
      roleId: roleMap[RoleCode.PRODUCTION_PLANNER],
      departmentId: deptMap['Sales & Planning'],
      isActive: true,
    },
  });

  const operatorUser = await prisma.user.upsert({
    where: { email: 'drilling@rfelectro.com' },
    update: {},
    create: {
      name: 'Drilling Operator',
      email: 'drilling@rfelectro.com',
      phone: '+919876543212',
      passwordHash: hashPassword('Floor@123'),
      roleId: roleMap[RoleCode.PROCESS_OPERATOR],
      departmentId: deptMap['Production & Engineering'],
      assignedStageId: stageMap['DRILLING'],
      isActive: true,
    },
  });

  const qcUser = await prisma.user.upsert({
    where: { email: 'qc@rfelectro.com' },
    update: {},
    create: {
      name: 'Quality Assurance Officer',
      email: 'qc@rfelectro.com',
      phone: '+919876543213',
      passwordHash: hashPassword('Quality@123'),
      roleId: roleMap[RoleCode.QC_OFFICER],
      departmentId: deptMap['Quality Assurance'],
      isActive: true,
    },
  });

  console.log('✅ Seeded 4 Default Users (Admin, Planner, Operator, QC)');

  // 5. Default Customer & Portal Access
  const customer = await prisma.customer.upsert({
    where: { companyName: 'Acme Electronics Ltd' },
    update: {},
    create: {
      companyName: 'Acme Electronics Ltd',
      contactPerson: 'John Buyer',
      email: 'buyer@acme-electronics.com',
      phone: '+18005550199',
      address: '100 Silicon Way, Tech Park',
      isActive: true,
    },
  });

  await prisma.customerPortalAccess.upsert({
    where: { email: 'buyer@acme-electronics.com' },
    update: {},
    create: {
      customerId: customer.id,
      email: 'buyer@acme-electronics.com',
      passwordHash: hashPassword('Portal@123'),
      isActive: true,
    },
  });
  console.log('✅ Seeded Default Customer & Portal Access');

  // 6. Default Process Flow Master (PF-01)
  const defaultFlow = await prisma.processFlowMaster.upsert({
    where: { name: 'PF-01' },
    update: { totalSteps: 19 },
    create: {
      name: 'PF-01',
      totalSteps: 19,
      isActive: true,
      createdById: adminUser.id,
    },
  });

  const existingSteps = await prisma.processFlowStep.count({
    where: { processFlowMasterId: defaultFlow.id },
  });
  if (existingSteps === 0) {
    for (let i = 0; i < stages.length; i++) {
      const stageName = stages[i].name;
      await prisma.processFlowStep.create({
        data: {
          processFlowMasterId: defaultFlow.id,
          stageId: stageMap[stageName],
          stepOrder: i + 1,
        },
      });
    }
    console.log('✅ Seeded PF-01 Process Flow Steps (19 stages)');
  }
  console.log('✅ Seeded Default Process Flow Master (PF-01)');

  // 7. Seed Sample Products & Open Customer POs
  const product1 = await prisma.product.upsert({
    where: { code_revisionNo: { code: 'PCB-MB-V2', revisionNo: 'Rev-00' } },
    update: {},
    create: {
      specCardNo: 'D001',
      name: 'Main Motherboard V2',
      code: 'PCB-MB-V2',
      pcbSize: '100x150mm',
      layers: 4,
      thicknessMm: 1.6,
      copperWeight: '1oz',
      solderMask: 'Green',
      legend: 'White',
      surfaceFinish: 'ENIG',
      processFlowId: defaultFlow.id,
      createdById: adminUser.id,
    },
  });

  const product2 = await prisma.product.upsert({
    where: { code_revisionNo: { code: 'D3633', revisionNo: 'Rev-00' } },
    update: {},
    create: {
      specCardNo: 'D3633',
      name: '3.3KW NEW DAUGHTER BOARD',
      code: 'D3633',
      pcbSize: '25x45mm',
      layers: 2,
      thicknessMm: 1.6,
      copperWeight: '1oz',
      solderMask: 'Green',
      legend: 'White',
      surfaceFinish: 'HAL',
      processFlowId: defaultFlow.id,
      createdById: adminUser.id,
    },
  });

  await prisma.customerPO.upsert({
    where: { poNo: 'PO-2026-001' },
    update: {},
    create: {
      poNo: 'PO-2026-001',
      customerId: customer.id,
      productId: product1.id,
      orderQty: 2500,
      poDate: new Date('2026-07-01'),
      expectedDeliveryDate: new Date('2026-08-15'),
      status: 'OPEN',
      createdById: adminUser.id,
    },
  });

  await prisma.customerPO.upsert({
    where: { poNo: 'PO-2026-004' },
    update: {},
    create: {
      poNo: 'PO-2026-004',
      customerId: customer.id,
      productId: product2.id,
      orderQty: 3500,
      poDate: new Date('2026-08-01'),
      expectedDeliveryDate: new Date('2026-09-30'),
      status: 'OPEN',
      createdById: adminUser.id,
    },
  });
  console.log('✅ Seeded Sample Products & Open Customer POs');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
