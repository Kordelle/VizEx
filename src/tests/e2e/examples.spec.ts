import { test, expect } from '@playwright/test';

test.describe('US4: Example Patterns Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('examples panel is visible in the sidebar', async ({ page }) => {
    await expect(page.locator('#examples-panel')).toBeVisible();
  });

  test('at least 5 example categories are rendered', async ({ page }) => {
    const categories = page.locator('.example-category');
    await expect(categories).toHaveCount(await categories.count());
    expect(await categories.count()).toBeGreaterThanOrEqual(5);
  });

  test('clicking "↗ Pattern" loads the pattern into #pattern-input', async ({ page }) => {
    await page.click('.btn-use-pattern >> nth=0');
    const value = await page.inputValue('#pattern-input');
    expect(value.length).toBeGreaterThan(0);
  });

  test('clicking "↗ Sample" loads sample text into #raw-input', async ({ page }) => {
    await page.click('.btn-use-sample >> nth=0');
    const value = await page.inputValue('#raw-input');
    expect(value.length).toBeGreaterThan(0);
  });

  test('highlights update within 300ms after loading an example pattern + sample', async ({ page }) => {
    await page.click('.btn-use-pattern >> nth=0');
    await page.click('.btn-use-sample >> nth=0');
    const start = Date.now();
    await expect(page.locator('#highlight-layer mark').first()).toBeVisible({ timeout: 300 });
    expect(Date.now() - start).toBeLessThan(300);
  });

  test('each example entry shows a label and description', async ({ page }) => {
    const firstEntry = page.locator('.example-entry >> nth=0');
    await expect(firstEntry.locator('.example-label')).toBeVisible();
    await expect(firstEntry.locator('.example-desc')).toBeVisible();
  });
});
