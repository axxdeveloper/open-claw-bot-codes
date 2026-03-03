import { expect, test } from '@playwright/test';

test('drill-down links route to expected pages and query filters', async ({ page, request }) => {
  const runId = `drill-${Date.now()}`;
  const loginPassword = process.env.AUTH_PAGE_PASSWORD || '0910301562';

  await page.goto('/login');
  await page.getByPlaceholder('密碼').fill(loginPassword);
  await page.getByRole('button', { name: '登入' }).click();
  await expect(page).toHaveURL(/\/buildings/);

  const buildingResp = await request.post('http://127.0.0.1:8080/api/buildings', {
    data: {
      name: `Drill Tower ${runId}`,
      code: `D${Date.now().toString().slice(-6)}`,
      address: '台北市中山區鑽取路 99 號',
    },
    headers: { 'X-Actor-Id': 'playwright-drilldown' },
  });
  const buildingBody = await buildingResp.json();
  const buildingId = buildingBody.data.id as string;

  await request.post(`http://127.0.0.1:8080/api/buildings/${buildingId}/floors/generate`, {
    data: { basementFloors: 1, aboveGroundFloors: 3 },
    headers: { 'X-Actor-Id': 'playwright-drilldown' },
  });

  const floorsRes = await request.get(`http://127.0.0.1:8080/api/buildings/${buildingId}/floors`);
  const floorsBody = await floorsRes.json();
  const floor1 = (floorsBody.data || []).find((x: any) => x.label === '1F');
  expect(floor1).toBeTruthy();

  const unitRes = await request.post(`http://127.0.0.1:8080/api/floors/${floor1.id}/units`, {
    data: { code: 'A1', grossArea: 42 },
    headers: { 'X-Actor-Id': 'playwright-drilldown' },
  });
  const unitBody = await unitRes.json();
  const unitId = unitBody.data.id as string;

  const tenantRes = await request.post(`http://127.0.0.1:8080/api/buildings/${buildingId}/tenants`, {
    data: { name: `Tenant ${runId}`, contactEmail: `${runId}@example.com` },
    headers: { 'X-Actor-Id': 'playwright-drilldown' },
  });
  const tenantBody = await tenantRes.json();
  const tenantId = tenantBody.data.id as string;

  await request.post('http://127.0.0.1:8080/api/occupancies', {
    data: {
      buildingId,
      unitId,
      tenantId,
      status: 'DRAFT',
    },
    headers: { 'X-Actor-Id': 'playwright-drilldown' },
  });

  await request.post('http://127.0.0.1:8080/api/leases', {
    data: {
      buildingId,
      tenantId,
      unitIds: [unitId],
      status: 'ACTIVE',
      startDate: '2026-01-01',
      endDate: '2026-03-25',
    },
    headers: { 'X-Actor-Id': 'playwright-drilldown' },
  });

  await request.post('http://127.0.0.1:8080/api/repairs', {
    data: {
      buildingId,
      scopeType: 'FLOOR',
      floorId: floor1.id,
      item: `消防檢修 ${runId}`,
      vendorName: '台北修繕公司',
      quoteAmount: 12000,
      status: 'IN_PROGRESS',
    },
    headers: { 'X-Actor-Id': 'playwright-drilldown' },
  });

  await page.goto('/buildings');
  await page.getByTestId('drilldown-link-dashboard-expiring').click();
  await expect(page).toHaveURL(new RegExp(`(/buildings/${buildingId}/leases\\?filter=expiring|/buildings\\?scope=expiring)`));

  await page.goto('/buildings');
  await page.getByTestId(`drilldown-link-building-setup-${buildingId}`).click();
  await expect(page).toHaveURL(new RegExp(`/buildings/${buildingId}/floors\\?filter=unconfigured`));

  await page.getByTestId('drilldown-link-floor-summary-draft-occupancies').click();
  await expect(page).toHaveURL(new RegExp(`/buildings/${buildingId}/stacking\\?filter=draft`));

  await page.getByTestId('drilldown-link-stacking-active').click();
  await expect(page).toHaveURL(new RegExp(`/buildings/${buildingId}/stacking\\?filter=active`));

  await page.goto(`/buildings/${buildingId}/tenants`);
  await page.getByTestId('drilldown-link-tenants-summary-active-leases').click();
  await expect(page).toHaveURL(new RegExp(`/buildings/${buildingId}/leases\\?filter=active`));

  await page.goto(`/buildings/${buildingId}/repairs`);
  await page.getByTestId('drilldown-link-repairs-summary-in-progress').click();
  await expect(page).toHaveURL(new RegExp(`/buildings/${buildingId}/repairs\\?status=IN_PROGRESS`));
});
