import * as assert from 'assert';

const API_URL = 'http://localhost:3001/api/v1';
let adminToken = '';
let customerToken = '';

async function request(method: string, endpoint: string, body?: any, token?: string) {
  const headers: any = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error [${method} ${endpoint}]: ${res.status} ${res.statusText} - ${text}`);
  }

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  return res.text();
}

async function runTest() {
  console.log('--- STARTING E2E TEST ---');

  // Step 1: Admin Login
  console.log('1. Admin Login...');
  const loginRes = await request('POST', '/auth/login', {
    email: 'admin@rfelectro.com',
    password: 'Admin@123456',
  });
  adminToken = loginRes.accessToken || loginRes.access_token;
  assert.ok(adminToken, 'Admin token should be present');

  // Generate unique suffix for this test run
  const runId = Date.now().toString().slice(-6);

  // Step 2: Create Customer
  console.log('2. Create Customer...');
  const customer = await request('POST', '/customers', {
    companyName: `Test Company ${runId}`,
    contactPerson: 'John Doe',
    email: `customer${runId}@test.com`,
    phone: '1234567890',
    address: '123 Test St',
    password: 'password123',
  }, adminToken);
  assert(customer.id, 'Customer ID should be present');

  // Step 3: Fetch process flows & Create Product
  console.log('3. Create Product...');
  const flows = await request('GET', '/process-stages/flows', null, adminToken);
  const defaultFlow = flows[0];
  assert.ok(defaultFlow, 'Should have at least one seeded process flow');

  const product = await request('POST', '/products', {
    code: `PROD-${runId}`,
    name: 'Test PCB',
    specCardNo: `SPEC-${runId}`,
    layers: 2,
    pcbSize: '100x100mm',
    thicknessMm: 1.6,
    copperWeight: '1oz',
    solderMask: 'Green',
    legend: 'White',
    surfaceFinish: 'HASL',
    materialType: 'FR4',
    processFlowId: defaultFlow.id,
  }, adminToken);
  assert(product.id, 'Product ID should be present');
  
  // Step 4: Create Process Stages
  let stages = await request('GET', '/process-stages', null, adminToken);
  if (stages.length < 2) {
    await request('POST', '/process-stages', { name: 'Cutting', code: 'CUT', defaultOrder: 1 }, adminToken);
    await request('POST', '/process-stages', { name: 'Drilling', code: 'DRL', defaultOrder: 2 }, adminToken);
    stages = await request('GET', '/process-stages', null, adminToken);
  }
  const stage1 = stages[0];
  const stage2 = stages[1];
  assert(stage1 && stage2, 'At least 2 stages required');

  // Step 6: Create Customer PO
  console.log('6. Create Customer PO...');
  const po = await request('POST', '/customer-pos', {
    poNo: `PO-${runId}`,
    customerId: customer.id,
    productId: product.id,
    orderQty: 1000,
    poDate: new Date().toISOString(),
    expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'OPEN'
  }, adminToken);
  assert(po.id, 'PO ID should be present');

  // Step 7: Generate Job Card
  console.log('7. Generate Job Card...');
  const jobCard = await request('POST', `/job-cards/from-po/${po.id}`, {}, adminToken);
  assert(jobCard.id, 'Job Card should be created');

  // Step 8: Split into Sub Job Cards
  console.log('8. Split into Sub Job Cards...');
  await request('POST', `/job-cards/${jobCard.id}/split`, {
    splits: [
      { qty: 400 },
      { qty: 600 }
    ]
  }, adminToken);
  
  const jobCardDetails = await request('GET', `/job-cards/${jobCard.id}`, null, adminToken);
  const sjc1 = jobCardDetails.subJobCards[0];
  const sjc2 = jobCardDetails.subJobCards[1];
  assert(sjc1 && sjc2, 'Sub Job Cards should be created');
  assert(sjc1.qty + sjc2.qty === 1000, 'Total split quantity should match');

  // Step 9: Launch Job Card
  console.log('9. Launch Job Card...');
  await request('POST', `/job-cards/${jobCard.id}/launch`, {}, adminToken);

  const jcLaunched = await request('GET', `/job-cards/${jobCard.id}`, null, adminToken);
  const launchedSjc = jcLaunched.subJobCards[0];
  assert(launchedSjc.currentStageId === stage1.id, 'SJC should be at first stage');

  // Step 10 & 11 & 12: Receive and Process SJC 1 in Stage 1
  console.log('10. Process SJC 1 through Stage 1 (with rejection & hold)...');
  await request('POST', `/sub-job-cards/${sjc1.id}/stage-update`, {
    qtyReceived: sjc1.qty,
    qtyProcessed: sjc1.qty,
    qtyForwarded: sjc1.qty - 50,
    qtyRejected: 30,
    qtyHold: 20,
    rejectionReason: 'Scratch mark',
    remarks: 'Processed successfully with some rejections'
  }, adminToken);

  // Because we forwarded 350 out of 400, a split occurred!
  // sjc1 stays at stage 1 with remaining qty (20 hold), and a new SJC is created for 350.
  const allSubCards = await request('GET', `/job-cards/${jobCard.id}`, null, adminToken);
  const forwardedSjc = allSubCards.subJobCards.find((c: any) => c.currentStageId === stage2.id);
  assert(forwardedSjc, 'Should have created a new sub job card at stage 2');
  assert(forwardedSjc.qty === sjc1.qty - 50, `Expected 350, got ${forwardedSjc.qty}`);

  // Step 13: Check WIP Report
  console.log('13. Check WIP Report...');
  const wipReport = await request('GET', '/reports/wip', null, adminToken);
  assert(Array.isArray(wipReport), 'WIP report should return an array');

  // Step 14: Complete Production
  console.log('14. Complete Production...');
  await request('POST', `/sub-job-cards/${forwardedSjc.id}/stage-update`, {
    qtyReceived: forwardedSjc.qty,
    qtyProcessed: forwardedSjc.qty,
    qtyForwarded: forwardedSjc.qty,
    qtyRejected: 0,
    qtyHold: 0,
    remarks: 'Final stage complete'
  }, adminToken);

  try {
     await request('PATCH', `/job-cards/${jobCard.id}/status`, { status: 'READY_FOR_DISPATCH' }, adminToken);
  } catch(e) {}

  // Step 15: Create Dispatch
  console.log('15. Create Dispatch...');
  const dispatch = await request('POST', '/dispatches', {
    jobCardId: jobCard.id,
    dispatchedQty: 350,
    destination: 'Customer Warehouse',
    vehicleNo: 'MH-12-AB-1234',
    courierName: 'Internal Transport',
    deliveryPartner: 'Delivery Co',
    driverName: 'Raju Driver',
    contactNumber: '9988776655',
    trackingLrNo: 'TRK99887766',
    dispatchRemarks: 'Test Dispatch'
  }, adminToken);
  assert(dispatch.id, 'Dispatch ID should exist');

  // Step 16: Delivery Confirmation
  console.log('16. Confirm Delivery...');
  await request('PATCH', `/dispatches/${dispatch.id}/delivery`, {
    deliveredBy: 'FedEx',
    receiverName: 'Customer Test',
    receiverMobile: '8888888888',
    remarks: 'Delivered successfully'
  }, adminToken);

  // Step 17: Create Portal User and Login as Customer
  console.log('17. Customer Login...');
  await request('POST', '/portal/users', {
    customerId: customer.id,
    email: `customer${runId}@test.com`,
    password: 'password123'
  }, adminToken);

  const custLogin = await request('POST', '/portal/login', {
    email: `customer${runId}@test.com`,
    password: 'password123',
  });
  customerToken = custLogin.accessToken || custLogin.access_token;
  assert.ok(customerToken, 'Customer token should be present');

  // Step 18: Verify Customer Portal
  console.log('18. Verify Customer Portal Data Isolation...');
  const portalDashboard = await request('GET', '/portal/dashboard', null, customerToken);
  assert(portalDashboard.totalOrders >= 1, 'Customer should see their orders');
  
  const portalTraceability = await request('GET', `/portal/traceability/${jobCard.jobCardNo}`, null, customerToken);
  const log = portalTraceability.logs.find((l: any) => l.qtyRejected > 0);
  if (log) {
    assert(log.rejectionReason === undefined || !log.rejectionReason, 'Should NOT expose rejection reason');
  }

  console.log('--- E2E TEST COMPLETED SUCCESSFULLY ---');
}

runTest().catch((err) => {
  console.error('\n!!! E2E TEST FAILED !!!\n');
  console.error(err);
  process.exit(1);
});
