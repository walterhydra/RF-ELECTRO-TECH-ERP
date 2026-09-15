async function testCreateOne() {
  const payload = {
    jobCardNo: '26-27-0001',
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

  const res = await fetch('https://rf-electro-tech-erp.onrender.com/api/v1/job-cards/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  console.log('STATUS:', res.status);
  console.log('RESPONSE:', text);
}

testCreateOne();
