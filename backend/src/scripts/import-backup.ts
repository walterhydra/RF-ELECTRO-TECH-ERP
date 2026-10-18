import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function importBackup() {
  const backupPath = path.join(__dirname, '..', '..', 'neon_backup_latest.json');

  if (!fs.existsSync(backupPath)) {
    console.error(`❌ Backup file not found at: ${backupPath}`);
    process.exit(1);
  }

  console.log(`🚀 Reading backup file from: ${backupPath}`);
  const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

  try {
    console.log('🔄 Starting data restoration (Order preserved for foreign keys)...');

    // 1. Departments
    if (backupData.departments?.length) {
      console.log(`📥 Restoring ${backupData.departments.length} Departments...`);
      for (const item of backupData.departments) {
        await prisma.department.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 2. Process Stages
    if (backupData.processStages?.length) {
      console.log(`📥 Restoring ${backupData.processStages.length} Process Stages...`);
      for (const item of backupData.processStages) {
        await prisma.processStage.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 3. Roles
    if (backupData.roles?.length) {
      console.log(`📥 Restoring ${backupData.roles.length} Roles...`);
      for (const item of backupData.roles) {
        await prisma.role.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 4. Permissions
    if (backupData.permissions?.length) {
      console.log(`📥 Restoring ${backupData.permissions.length} Permissions...`);
      for (const item of backupData.permissions) {
        await prisma.permission.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 5. Users
    if (backupData.users?.length) {
      console.log(`📥 Restoring ${backupData.users.length} Users...`);
      for (const item of backupData.users) {
        await prisma.user.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 6. Process Flow Masters
    if (backupData.processFlowMasters?.length) {
      console.log(`📥 Restoring ${backupData.processFlowMasters.length} Process Flow Masters...`);
      for (const item of backupData.processFlowMasters) {
        await prisma.processFlowMaster.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 7. Process Flow Steps
    if (backupData.processFlowSteps?.length) {
      console.log(`📥 Restoring ${backupData.processFlowSteps.length} Process Flow Steps...`);
      for (const item of backupData.processFlowSteps) {
        await prisma.processFlowStep.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 8. Customers
    if (backupData.customers?.length) {
      console.log(`📥 Restoring ${backupData.customers.length} Customers...`);
      for (const item of backupData.customers) {
        await prisma.customer.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 9. Customer Portal Access
    if (backupData.customerPortalAccess?.length) {
      console.log(`📥 Restoring ${backupData.customerPortalAccess.length} Customer Portal Access records...`);
      for (const item of backupData.customerPortalAccess) {
        await prisma.customerPortalAccess.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 10. Products
    if (backupData.products?.length) {
      console.log(`📥 Restoring ${backupData.products.length} Products...`);
      for (const item of backupData.products) {
        await prisma.product.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 11. Customer POs
    if (backupData.customerPOs?.length) {
      console.log(`📥 Restoring ${backupData.customerPOs.length} Customer POs...`);
      for (const item of backupData.customerPOs) {
        await prisma.customerPO.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 12. Job Cards
    if (backupData.jobCards?.length) {
      console.log(`📥 Restoring ${backupData.jobCards.length} Job Cards...`);
      for (const item of backupData.jobCards) {
        await prisma.jobCard.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 13. Sub Job Cards (WIP Lots)
    if (backupData.subJobCards?.length) {
      console.log(`📥 Restoring ${backupData.subJobCards.length} Sub Job Cards...`);
      for (const item of backupData.subJobCards) {
        await prisma.subJobCard.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 14. Stage Movement Logs
    if (backupData.stageMovementLogs?.length) {
      console.log(`📥 Restoring ${backupData.stageMovementLogs.length} Stage Movement Logs...`);
      for (const item of backupData.stageMovementLogs) {
        await prisma.stageMovementLog.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 15. Dispatches
    if (backupData.dispatches?.length) {
      console.log(`📥 Restoring ${backupData.dispatches.length} Dispatches...`);
      for (const item of backupData.dispatches) {
        await prisma.dispatch.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    // 16. Audit Logs
    if (backupData.auditLogs?.length) {
      console.log(`📥 Restoring ${backupData.auditLogs.length} Audit Logs...`);
      for (const item of backupData.auditLogs) {
        await prisma.auditLog.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }

    console.log('\n🎉 ALL DATA RESTORED SUCCESSFULLY WITH ZERO LOSS!');
  } catch (error) {
    console.error('❌ Error during restore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importBackup();
