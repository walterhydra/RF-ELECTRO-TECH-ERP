const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncToRender() {
  try {
    const localJobCards = await prisma.jobCard.findMany({
      include: {
        customerPO: { include: { customer: true } },
        product: true,
        processFlowMaster: true,
        subJobCards: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    console.log(`Found ${localJobCards.length} local job cards.`);

    for (const card of localJobCards) {
      console.log(`Pushing Job Card ${card.jobCardNo}...`);
      const payload = {
        jobCardNo: card.jobCardNo,
        customerCode: card.customerCode || card.customerPO?.customer?.code || 'CUST-RF045',
        rfePartCode: card.rfePartCode || card.product?.specCardNo || 'D3625',
        customerPartNo: card.customerPartNo || card.product?.code || 'EV-900W-WP-TO247',
        priority: card.priority || 'NORMAL',
        prodPnlQty: card.prodPnlQty || 40,
        custPnlQty: card.custPnlQty || 160,
        totalPcbQty: card.totalPcbQty || 160,
        prodPnlAreaSqm: card.prodPnlAreaSqm || 50,
        custPnlAreaSqm: card.custPnlAreaSqm || 45,
        autoLaunch: card.status === 'IN_PROGRESS',
      };

      try {
        const res = await fetch('https://rf-electro-tech-erp.onrender.com/api/v1/job-cards/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const resData = await res.json();
          console.log(`SUCCESS: Job Card ${card.jobCardNo} created/synced!`, resData?.jobCardNo || resData);
        } else {
          const errText = await res.text();
          console.error(`FAILED: Job Card ${card.jobCardNo} - Status ${res.status}:`, errText);
        }
      } catch (postErr) {
        console.error(`ERROR pushing ${card.jobCardNo}:`, postErr.message);
      }
    }

    // Verify final count on Render
    const checkRes = await fetch('https://rf-electro-tech-erp.onrender.com/api/v1/job-cards');
    if (checkRes.ok) {
      const renderCards = await checkRes.json();
      console.log(`RENDER DB CURRENT JOB CARDS COUNT: ${renderCards.length}`);
    }
  } catch (err) {
    console.error('Sync process error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

syncToRender();
