import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function exportBackup() {
  console.log('🚀 Starting Neon Database Backup...');

  try {
    const backup: Record<string, any[]> = {};

    console.log('📦 Fetching Departments...');
    backup.departments = await prisma.department.findMany();

    console.log('📦 Fetching Process Stages...');
    backup.processStages = await prisma.processStage.findMany();

    console.log('📦 Fetching Roles...');
    backup.roles = await prisma.role.findMany();

    console.log('📦 Fetching Permissions...');
    backup.permissions = await prisma.permission.findMany();

    console.log('📦 Fetching Role Permissions...');
    backup.rolePermissions = await prisma.rolePermission.findMany();

    console.log('📦 Fetching Users...');
    backup.users = await prisma.user.findMany();

    console.log('📦 Fetching Process Flow Masters...');
    backup.processFlowMasters = await prisma.processFlowMaster.findMany();

    console.log('📦 Fetching Process Flow Steps...');
    backup.processFlowSteps = await prisma.processFlowStep.findMany();

    console.log('📦 Fetching Customers...');
    backup.customers = await prisma.customer.findMany();

    console.log('📦 Fetching Customer Portal Access...');
    backup.customerPortalAccess = await prisma.customerPortalAccess.findMany();

    console.log('📦 Fetching Products...');
    backup.products = await prisma.product.findMany();

    console.log('📦 Fetching Customer POs...');
    backup.customerPOs = await prisma.customerPO.findMany();

    console.log('📦 Fetching Job Cards...');
    backup.jobCards = await prisma.jobCard.findMany();

    console.log('📦 Fetching Sub Job Cards (WIP Lots)...');
    backup.subJobCards = await prisma.subJobCard.findMany();

    console.log('📦 Fetching Stage Movement Logs...');
    backup.stageMovementLogs = await prisma.stageMovementLog.findMany();

    console.log('📦 Fetching Dispatches...');
    backup.dispatches = await prisma.dispatch.findMany();

    console.log('📦 Fetching Notifications...');
    backup.notifications = await prisma.notification.findMany();

    console.log('📦 Fetching Audit Logs...');
    backup.auditLogs = await prisma.auditLog.findMany();

    console.log('📦 Fetching Daily Report Snapshots...');
    backup.dailyReportSnapshots = await prisma.dailyReportSnapshot.findMany();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = path.join(__dirname, '..', '..', `neon_backup_${timestamp}.json`);
    const defaultOutputPath = path.join(__dirname, '..', '..', `neon_backup_latest.json`);

    const jsonString = JSON.stringify(backup, null, 2);
    fs.writeFileSync(outputPath, jsonString, 'utf-8');
    fs.writeFileSync(defaultOutputPath, jsonString, 'utf-8');

    console.log(`\n✅ Backup successfully saved to:\n  - ${outputPath}\n  - ${defaultOutputPath}`);
    console.log('\n📊 Summary of Backed Up Records:');
    for (const [table, records] of Object.entries(backup)) {
      console.log(`  • ${table}: ${records.length} records`);
    }
  } catch (error) {
    console.error('❌ Error during backup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportBackup();
