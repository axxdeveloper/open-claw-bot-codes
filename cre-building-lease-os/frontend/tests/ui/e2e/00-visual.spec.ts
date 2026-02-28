import { expect, test } from '@playwright/test';

test('visual snapshots for key pages', async ({ page, request }) => {
  const buildingResp = await request.post('http://127.0.0.1:8080/api/buildings', {
    data: {
      name: 'Visual Baseline Tower',
      code: 'VISUAL-BASE',
      address: '台北市信義區視覺測試路',
    },
    headers: {
      'X-Actor-Id': 'playwright-visual',
    },
  });
  const buildingBody = await buildingResp.json();
  const buildingId = buildingBody.data.id as string;

  await request.post(`http://127.0.0.1:8080/api/buildings/${buildingId}/floors/generate`, {
    data: { basementFloors: 1, aboveGroundFloors: 2 },
    headers: {
      'X-Actor-Id': 'playwright-visual',
    },
  });

  const floorsRes = await request.get(`http://127.0.0.1:8080/api/buildings/${buildingId}/floors`);
  const floors = (await floorsRes.json()).data as Array<{ id: string; label: string }>;
  const floor1 = floors.find((f) => f.label === '1F')!;

  const unitRes = await request.post(`http://127.0.0.1:8080/api/floors/${floor1.id}/units`, {
    data: {
      code: 'A1',
      grossArea: 100,
    },
    headers: {
      'X-Actor-Id': 'playwright-visual',
    },
  });
  const unitId = (await unitRes.json()).data.id as string;

  const tenantRes = await request.post(`http://127.0.0.1:8080/api/buildings/${buildingId}/tenants`, {
    data: {
      name: 'Visual Tenant',
      contactEmail: 'visual@example.com',
    },
    headers: {
      'X-Actor-Id': 'playwright-visual',
    },
  });
  const tenantId = (await tenantRes.json()).data.id as string;

  await request.post('http://127.0.0.1:8080/api/occupancies', {
    data: {
      buildingId,
      unitId,
      tenantId,
      status: 'DRAFT',
    },
    headers: {
      'X-Actor-Id': 'playwright-visual',
    },
  });

  await page.goto('/buildings');
  await expect(page.locator('.hero')).toHaveScreenshot('buildings-hero.png');

  await page.goto(`/buildings/${buildingId}`);
  await expect(page.locator('.hero')).toHaveScreenshot('building-detail-hero.png');

  await page.goto(`/buildings/${buildingId}/stacking`);
  await expect(page.locator('main')).toHaveScreenshot('stacking-page.png');
});
