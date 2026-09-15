const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$transaction(async (tx) => {
      console.log('Inside tx...');
      await tx.subJobCard.create({ data: { subJobCardNo: 'invalid' } }).catch(e => console.log('Caught query error inside tx:', e.message));
      console.log('Continuing after catch inside tx...');
    });
  } catch (txErr) {
    console.log('Transaction failed with error:', txErr.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
