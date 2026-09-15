const payload = {
  jobCardNo: 'JC-TEST-9999',
  customerCode: 'CUST-RF045',
  rfePartCode: 'D3625',
  customerPartNo: 'EV-900W-WP-TO247',
  priority: 'NORMAL',
  prodPnlQty: 40,
  custPnlQty: 160,
  totalPcbQty: 160,
  prodPnlAreaSqm: 50,
  custPnlAreaSqm: 45,
  autoLaunch: true,
};

async function testPost() {
  console.log('Sending POST to Render /api/v1/job-cards/create...');
  const res = await fetch('https://rf-electro-tech-erp.onrender.com/api/v1/job-cards/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  console.log('Status:', res.status, res.statusText);
  const text = await res.text();
  console.log('Response body:', text);
}

testPost();
