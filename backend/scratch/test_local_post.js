const payload = {
  jobCardNo: 'JC-LOCAL-TEST',
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

async function testLocalPost() {
  console.log('Sending POST to Localhost /api/v1/job-cards/create...');
  try {
    const res = await fetch('http://localhost:3001/api/v1/job-cards/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log('Status:', res.status, res.statusText);
    const text = await res.text();
    console.log('Response body:', text);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testLocalPost();
