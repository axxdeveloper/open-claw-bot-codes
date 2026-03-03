import { expect, test } from '@playwright/test';

test('task-first UX smoke flow', async ({ page, request }) => {
  const runId = `e2e-${Date.now()}`;
  const loginPassword = process.env.AUTH_PAGE_PASSWORD || '0910301562';

  await page.goto('/login');
  await page.getByPlaceholder('密碼').fill(loginPassword);
  await page.getByRole('button', { name: '登入' }).click();
  await expect(page).toHaveURL(/\/buildings/);

  const buildingResp = await request.post('http://127.0.0.1:8080/api/buildings', {
    data: {
      name: `Happy Tower ${runId}`,
      code: `C${Date.now().toString().slice(-6)}`,
      address: '台北市信義區測試路 1 號',
    },
    headers: {
      'X-Actor-Id': 'playwright-happy',
    },
  });
  const buildingBody = await buildingResp.json();
  const buildingId = buildingBody.data.id as string;

  await request.post(`http://127.0.0.1:8080/api/buildings/${buildingId}/floors/generate`, {
    data: { basementFloors: 2, aboveGroundFloors: 3 },
    headers: {
      'X-Actor-Id': 'playwright-happy',
    },
  });

  const floorsRes = await request.get(`http://127.0.0.1:8080/api/buildings/${buildingId}/floors`);
  const floorsBody = await floorsRes.json();
  const floor1 = (floorsBody.data || []).find((x: any) => x.label === '1F');
  expect(floor1).toBeTruthy();

  const unitRes = await request.post(`http://127.0.0.1:8080/api/floors/${floor1.id}/units`, {
    data: { code: 'A1', grossArea: 100 },
    headers: {
      'X-Actor-Id': 'playwright-happy',
    },
  });
  const unitBody = await unitRes.json();
  const unitId = unitBody.data.id as string;

  const tenantRes = await request.post(`http://127.0.0.1:8080/api/buildings/${buildingId}/tenants`, {
    data: { name: `Tenant ${runId}`, contactEmail: `${runId}@example.com` },
    headers: {
      'X-Actor-Id': 'playwright-happy',
    },
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
    headers: {
      'X-Actor-Id': 'playwright-happy',
    },
  });

  const leaseRes = await request.post('http://127.0.0.1:8080/api/leases', {
    data: {
      buildingId,
      tenantId,
      unitIds: [unitId],
      status: 'ACTIVE',
      startDate: '2026-03-01',
      endDate: '2027-02-28',
    },
    headers: {
      'X-Actor-Id': 'playwright-happy',
    },
  });
  const leaseBody = await leaseRes.json();
  const leaseId = leaseBody.data.id as string;

  await page.goto('/buildings');
  await expect(page.getByRole('heading', { name: 'Dashboard｜今日營運重點' })).toBeVisible();

  await page.goto(`/buildings/${buildingId}`);
  await expect(page.getByRole('heading', { name: /樓層作業中心|Happy Tower/ })).toBeVisible();

  await page.goto(`/buildings/${buildingId}/floors`);
  await expect(page.getByRole('heading', { name: '樓層與單位配置' })).toBeVisible();
  await expect(page.getByText('sortIndex')).toHaveCount(0);

  await page.goto(`/buildings/${buildingId}/floors/${floor1.id}`);
  await expect(page.getByRole('heading', { name: /樓層作業中心/ })).toBeVisible();

  await page.goto(`/buildings/${buildingId}/stacking`);
  await expect(page.getByRole('heading', { name: '堆疊圖｜空置與入住總覽' })).toBeVisible();

  await page.goto(`/buildings/${buildingId}/tenants`);
  await expect(page.getByRole('heading', { name: '住戶管理' })).toBeVisible();

  await page.goto(`/buildings/${buildingId}/leases`);
  await expect(page.getByRole('heading', { name: '租約管理' })).toBeVisible();

  await page.goto(`/leases/${leaseId}`);
  await expect(page.getByRole('heading', { name: /租約詳情/ })).toBeVisible();

  await page.goto(`/buildings/${buildingId}/owners`);
  await expect(page.getByRole('heading', { name: '業主與持分管理' })).toBeVisible();

  await page.goto(`/buildings/${buildingId}/common-areas`);
  await expect(page.getByRole('heading', { name: '公共區域管理' })).toBeVisible();

  await page.goto(`/buildings/${buildingId}/repairs`);
  await expect(page.getByRole('heading', { name: '修繕管理' })).toBeVisible();
});
