import { expect, test } from '@playwright/test';

test('end-to-end happy flows stay healthy', async ({ page }) => {
  const runId = `e2e-${Date.now()}`;
  const buildingName = `Happy Tower ${runId}`;
  const tenantName = `Tenant ${runId}`;
  const ownerName = `Owner ${runId}`;
  const repairItem = `消防巡檢 ${runId}`;

  // 1) 建大樓 -> 產生樓層 -> B 樓排序
  await page.goto('/buildings/new');
  await page.getByLabel('大樓名稱').fill(buildingName);
  await page.getByLabel('代碼').fill(`C${Date.now().toString().slice(-6)}`);
  await page.getByLabel('地址').fill('台北市信義區測試路 1 號');
  await page.getByRole('button', { name: 'Create' }).click();

  await expect(page).toHaveURL(/\/buildings\/.*\/floors/);
  const labels = await page.locator('table tbody tr td:first-child a').allInnerTexts();
  expect(labels.slice(0, 6)).toEqual(['B5', 'B4', 'B3', 'B2', 'B1', '1F']);

  const buildingId = page.url().match(/\/buildings\/([^/]+)\/floors/)?.[1];
  expect(buildingId).toBeTruthy();

  // 建 tenant 供後續 occupancy
  await page.goto(`/buildings/${buildingId}/tenants`);
  await page.locator('form[aria-label="create-tenant-form"] input[name="name"]').fill(tenantName);
  await page
    .locator('form[aria-label="create-tenant-form"] input[name="contactEmail"]')
    .fill(`${runId}@example.com`);
  await page.getByRole('button', { name: 'Add Tenant' }).click();
  await expect(page.getByText(tenantName)).toBeVisible();

  // 2) 進樓層頁建立 + 切割單位
  await page.goto(`/buildings/${buildingId}/floors`);
  await page.getByRole('link', { name: '1F' }).click();

  await page.locator('form[aria-label="add-unit-form"] input[name="code"]').fill('A1');
  await page.locator('form[aria-label="add-unit-form"] input[name="grossArea"]').fill('100');
  await page.getByRole('button', { name: 'Add Unit' }).click();

  const sourceRow = page.locator('table tbody tr', { hasText: 'A1' }).first();
  await expect(sourceRow).toBeVisible();
  await sourceRow.getByRole('button', { name: 'Split' }).click();

  await expect(page.getByText('A1-1')).toBeVisible();
  await expect(page.getByText('A1-2')).toBeVisible();

  // 3) 指派 DRAFT occupancy -> stacking 可看到 tenant 名
  const targetRow = page.locator('table tbody tr', { hasText: 'A1-1' }).first();
  await targetRow.locator('select').selectOption({ label: tenantName });
  await targetRow.getByRole('button', { name: 'Assign DRAFT' }).click();
  await expect(page.getByText('DRAFT occupancy 建立完成')).toBeVisible();

  await page.goto(`/buildings/${buildingId}/stacking`);
  await expect(page.getByText(tenantName)).toBeVisible();

  // 4) 建立租約 -> occupancy 轉 ACTIVE（UI 顯示）
  await page.goto(`/buildings/${buildingId}/leases`);
  await page.locator('form[aria-label="create-lease-form"] select[name="tenantId"]').selectOption({
    label: tenantName,
  });
  await page.locator('input[name="startDate"]').fill('2026-03-01');
  await page.locator('input[name="endDate"]').fill('2027-02-28');
  await page.locator('label', { hasText: 'A1-1' }).locator('input[type="checkbox"]').check();
  await page.getByRole('button', { name: 'Create Lease' }).click();

  await expect(page.getByText('租約已建立')).toBeVisible();
  await page.locator('a[href^="/leases/"]').first().click();
  await expect(page.getByText('ACTIVE')).toBeVisible();

  // 5-1) Owners happy path：建立 owner + 指派到樓層
  await page.goto(`/buildings/${buildingId}/owners`);
  await page.locator('form[aria-label="create-owner-form"] input[name="name"]').fill(ownerName);
  await page
    .locator('form[aria-label="create-owner-form"] input[name="contactEmail"]')
    .fill(`owner-${runId}@example.com`);
  await page.getByRole('button', { name: 'Add Owner' }).click();
  await expect(page.getByText(ownerName)).toBeVisible();

  await page.goto(`/buildings/${buildingId}/floors`);
  await page.getByRole('link', { name: '1F' }).click();
  await page.locator('form[aria-label="assign-owner-form"] select[name="ownerId"]').selectOption({
    label: ownerName,
  });
  await page.locator('form[aria-label="assign-owner-form"] input[name="sharePercent"]').fill('60');
  await page.getByRole('button', { name: 'Assign Owner' }).click();
  await expect(page.getByText(ownerName)).toBeVisible();
  await expect(page.getByText('60%')).toBeVisible();

  // 5-2) Repairs happy path：建立一筆 floor repair 並在列表可查
  await page.goto(`/buildings/${buildingId}/repairs`);
  await page.locator('form[aria-label="create-vendor-form"] input[name="name"]').fill(`Vendor ${runId}`);
  await page.getByRole('button', { name: 'Add Vendor' }).click();

  await page.locator('form[aria-label="create-repair-form"] select[name="scopeType"]').selectOption('FLOOR');
  await page.locator('form[aria-label="create-repair-form"] select[name="floorId"]').selectOption({
    label: '1F',
  });
  await page.locator('form[aria-label="create-repair-form"] input[name="item"]').fill(repairItem);
  await page
    .locator('form[aria-label="create-repair-form"] input[name="vendorName"]')
    .fill(`Vendor ${runId}`);
  await page.locator('form[aria-label="create-repair-form"] input[name="quoteAmount"]').fill('12000');
  await page.getByRole('button', { name: 'Create Repair' }).click();

  await expect(page.getByText(repairItem)).toBeVisible();
});
