import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up all Job Cards, Sub Job Cards, Stage Movement Logs, and Dispatches...');

  const logs = await prisma.stageMovementLog.deleteMany({});
  console.log(`Deleted ${logs.count} stage movement logs.`);

  const dispatches = await prisma.dispatch.deleteMany({});
  console.log(`Deleted ${dispatches.count} dispatches.`);

  await prisma.subJobCard.updateMany({
    data: { parentSubJobCardId: null },
  });

  const subCards = await prisma.subJobCard.deleteMany({});
  console.log(`Deleted ${subCards.count} sub job cards.`);

  const jobCards = await prisma.jobCard.deleteMany({});
  console.log(`Deleted ${jobCards.count} job cards.`);

  console.log('✅ ALL JOB CARDS CLEARED SUCCESSFULLY!');
}

main()
  .catch((e) => {
    console.error('Error clearing job cards:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
