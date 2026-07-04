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

  // 3. Process Stages (Standard 10-Stage Multilayer Flow vocabulary)
  const stages = [
    { name: 'Cutting & Shearing', defaultOrder: 1, description: 'Raw copper laminate cutting' },
    { name: 'Inner Layer Printing & Etching', defaultOrder: 2, description: 'DES line processing' },
    { name: 'AOI Testing (Inner)', defaultOrder: 3, description: 'Automated optical inspection for inner layers' },
    { name: 'Multilayer Lamination & Pressing', defaultOrder: 4, description: 'Pressing layers together' },
    { name: 'CNC Drilling', defaultOrder: 5, description: 'Through-hole and via drilling' },
    { name: 'Electroless Copper & Plating', defaultOrder: 6, description: 'PTH plating' },
    { name: 'Outer Layer Imaging & Etching', defaultOrder: 7, description: 'Outer circuit formation' },
    { name: 'Solder Mask & Legend Printing', defaultOrder: 8, description: 'Green/Blue solder mask and white silkscreen' },
    { name: 'Surface Finish (ENIG / HAL)', defaultOrder: 9, description: 'Gold immersion or Hot Air Leveling' },
    { name: 'Final QC & E-Test', defaultOrder: 10, description: 'Electrical continuity testing and visual inspection' },
  ];

  const stageMap: Record<string, string> = {};
  for (const stg of stages) {
    const created = await prisma.processStage.upsert({
      where: { name: stg.name },
      update: {},
      create: stg,
    });
    stageMap[stg.name] = created.id;
  }
  console.log('✅ Seeded 10 Process Stages');

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
      assignedStageId: stageMap['CNC Drilling'],
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

  // 6. Default Process Flow Master
  const defaultFlow = await prisma.processFlowMaster.upsert({
    where: { name: 'Standard 10-Stage Multilayer Flow' },
    update: {},
    create: {
      name: 'Standard 10-Stage Multilayer Flow',
      totalSteps: 10,
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
    console.log('✅ Seeded Default Process Flow Steps');
  }
  console.log('✅ Seeded Default Process Flow Master');

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
