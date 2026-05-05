import { test, expect } from '@playwright/test';

test.describe('US3: Rule Set Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('saves a rule set and shows it in the saved list', async ({ page }) => {
    await page.fill('#rule-name', 'Has ID');
    await page.fill('#rule-pattern', 'ID-\\d+');
    await page.click('button[type="submit"]');

    await page.fill('#save-rule-set-name', 'My First Set');
    await page.click('#btn-save-rule-set');
    await page.waitForTimeout(200);

    await expect(page.locator('.rule-set-item')).toHaveCount(1);
    await expect(page.locator('.rule-set-item').first()).toContainText('My First Set');
  });

  test('loads a rule set and restores rules', async ({ page }) => {
    await page.fill('#rule-name', 'Has Email');
    await page.fill('#rule-pattern', '\\S+@\\S+');
    await page.click('button[type="submit"]');
    await page.fill('#save-rule-set-name', 'Email Checks');
    await page.click('#btn-save-rule-set');
    await page.waitForTimeout(200);

    // Clear rules
    await page.click('.btn-delete');
    await expect(page.locator('.dq-rule-item')).toHaveCount(0);

    // Load saved set
    await page.click('.btn-load-set');
    await page.waitForTimeout(200);
    await expect(page.locator('.dq-rule-item')).toHaveCount(1);
    await expect(page.locator('.dq-rule-item').first()).toContainText('Has Email');
  });

  test('rules survive a page reload via localStorage', async ({ page }) => {
    await page.fill('#rule-name', 'Persistent Rule');
    await page.fill('#rule-pattern', 'test');
    await page.click('button[type="submit"]');
    await page.fill('#save-rule-set-name', 'Saved Set');
    await page.click('#btn-save-rule-set');
    await page.waitForTimeout(200);

    await page.reload();
    await page.waitForTimeout(300);
    await expect(page.locator('.rule-set-item')).toHaveCount(1);
    await expect(page.locator('.rule-set-item').first()).toContainText('Saved Set');
  });

  test('deletes a rule set from the saved list', async ({ page }) => {
    await page.fill('#rule-name', 'Temp Rule');
    await page.fill('#rule-pattern', 'x');
    await page.click('button[type="submit"]');
    await page.fill('#save-rule-set-name', 'To Delete');
    await page.click('#btn-save-rule-set');
    await page.waitForTimeout(200);
    await expect(page.locator('.rule-set-item')).toHaveCount(1);

    await page.click('.btn-delete-set');
    await page.waitForTimeout(200);
    await expect(page.locator('.rule-set-item')).toHaveCount(0);
  });

  test('saved list shows rule count for each set', async ({ page }) => {
    await page.fill('#rule-name', 'Rule A');
    await page.fill('#rule-pattern', 'a');
    await page.click('button[type="submit"]');
    await page.fill('#rule-name', 'Rule B');
    await page.fill('#rule-pattern', 'b');
    await page.click('button[type="submit"]');
    await page.fill('#save-rule-set-name', 'Two Rules');
    await page.click('#btn-save-rule-set');
    await page.waitForTimeout(200);

    const item = page.locator('.rule-set-item').first();
    await expect(item).toContainText('2');
  });

  test('load completes in under 2 seconds (SC-005)', async ({ page }) => {
    await page.fill('#rule-name', 'Speed Rule');
    await page.fill('#rule-pattern', 'x');
    await page.click('button[type="submit"]');
    await page.fill('#save-rule-set-name', 'Speed Set');
    await page.click('#btn-save-rule-set');
    await page.waitForTimeout(200);

    await page.click('.btn-delete');
    const start = Date.now();
    await page.click('.btn-load-set');
    await expect(page.locator('.dq-rule-item')).toHaveCount(1);
    expect(Date.now() - start).toBeLessThan(2000);
  });
});
