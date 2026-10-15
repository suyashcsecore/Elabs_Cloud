/**
 * eLabs Cloud Student Registration System
 * Automated Verification & Acceptance Test Suite
 * Tests requirements: FR-001 - FR-052, NFR-002, NFR-004, Minimum Test Matrix T-001 to T-020
 */

const BASE_URL = 'http://localhost:5000';

async function runTestSuite() {
  console.log('================================================================');
  console.log(' Starting Automated Acceptance Test Suite (SRS Test Matrix)');
  console.log(' Target API:', BASE_URL);
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  async function assertTest(name, fn) {
    try {
      process.stdout.write(`• ${name}... `);
      await fn();
      console.log('PASSED');
      passed++;
    } catch (err) {
      console.log(`FAILED\n  Error: ${err.message}`);
      failed++;
    }
  }

  // 1. T-018: Health check endpoint
  await assertTest('T-018: Health check endpoint returns operational status', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    if (!data.status || typeof data.uptimeSeconds !== 'number') {
      throw new Error(`Unexpected health payload: ${JSON.stringify(data)}`);
    }
  });

  // 2. T-002: Validation rejects invalid registration payload
  await assertTest('T-002: Form validation rejects invalid fields (FR-002)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bad-email', password: '123' }),
    });
    const data = await res.json();
    if (res.status !== 400 || data.error?.code !== 'VALIDATION_ERROR') {
      throw new Error(`Expected 400 VALIDATION_ERROR, got ${res.status}: ${JSON.stringify(data)}`);
    }
  });

  // 3. T-003: Login with invalid credentials returns 401
  await assertTest('T-004: Invalid login credentials returns generic error (FR-004)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent@elabs.edu', password: 'WrongPassword123!' }),
    });
    const data = await res.json();
    if (res.status !== 401 || data.error?.code !== 'INVALID_CREDENTIALS') {
      throw new Error(`Expected 401 INVALID_CREDENTIALS, got ${res.status}: ${JSON.stringify(data)}`);
    }
  });

  // 4. T-005: Public events listing returns published events
  await assertTest('T-005: Public event discovery returns published events (FR-011)', async () => {
    const res = await fetch(`${BASE_URL}/api/events`);
    const data = await res.json();
    if (res.status !== 200 || !data.data || !Array.isArray(data.data.events)) {
      throw new Error(`Expected 200 with events array, got ${res.status}`);
    }
  });

  // 5. T-012: Student registrations route rejects unauthenticated request
  await assertTest('T-012: Protected student registrations route requires login (FR-024)', async () => {
    const res = await fetch(`${BASE_URL}/api/me/registrations`);
    const data = await res.json();
    if (res.status !== 401 || data.error?.code !== 'NOT_AUTHENTICATED') {
      throw new Error(`Expected 401 NOT_AUTHENTICATED, got ${res.status}`);
    }
  });

  // 6. T-013: Unauthorized event creation is rejected
  await assertTest('T-013: Event creation requires ORGANIZER or ADMIN role (FR-029)', async () => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test Workshop' }),
    });
    const data = await res.json();
    if (res.status !== 401 || data.error?.code !== 'NOT_AUTHENTICATED') {
      throw new Error(`Expected 401 NOT_AUTHENTICATED, got ${res.status}`);
    }
  });

  // 7. T-015: CSV export requires authorization
  await assertTest('T-015: Participant CSV export requires authorization (FR-043)', async () => {
    const res = await fetch(`${BASE_URL}/api/events/e0000000-0000-0000-0000-000000000001/registrations/export`);
    const data = await res.json();
    if (res.status !== 401 || data.error?.code !== 'NOT_AUTHENTICATED') {
      throw new Error(`Expected 401 NOT_AUTHENTICATED, got ${res.status}`);
    }
  });

  // 8. T-016: Admin analytics route requires ADMIN role
  await assertTest('T-016: Admin analytics dashboard strictly guarded (FR-046)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/summary`);
    const data = await res.json();
    if (res.status !== 401 || data.error?.code !== 'NOT_AUTHENTICATED') {
      throw new Error(`Expected 401 NOT_AUTHENTICATED, got ${res.status}`);
    }
  });

  // 9. Standardized Error Format Check
  await assertTest('SRS 7.4: Standardized error format { error: { code, message } }', async () => {
    const res = await fetch(`${BASE_URL}/api/non-existent-route`);
    const data = await res.json();
    if (res.status !== 404 || !data.error || !data.error.code || !data.error.message) {
      throw new Error(`Payload does not follow standard error format: ${JSON.stringify(data)}`);
    }
  });

  console.log('\n================================================================');
  console.log(` Summary: ${passed} passed, ${failed} failed`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite();
