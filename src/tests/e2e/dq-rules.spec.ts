import { test, expect } from '@playwright/test';

test.describe('US2: DQ Rule Pass/Fail Evaluation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows Pass badge when must-match rule matches input', async ({ page }) => {
    await page.fill('#rule-name', 'Has Numbers');
    await page.fill('#rule-pattern', '\\d+');
    await page.selectOption('#rule-condition', 'must-match');
    await page.click('button[type="submit"]');
    await page.fill('#raw-input', 'order 123 shipped');
    await page.waitForTimeout(300);
    const badge = page.locator('.badge-pass').first();
    await expect(badge).toBeVisible();
  });

  test('shows Fail badge when must-match rule does not match', async ({ page }) => {
    await page.fill('#rule-name', 'Has Numbers');
    await page.fill('#rule-pattern', '\\d+');
    await page.selectOption('#rule-condition', 'must-match');
    await page.click('button[type="submit"]');
    await page.fill('#raw-input', 'no numbers here');
    await page.waitForTimeout(300);
    await expect(page.locator('.badge-fail').first()).toBeVisible();
  });

  test('shows Error badge for rule with invalid regex', async ({ page }) => {
    await page.fill('#rule-name', 'Bad Regex');
    await page.fill('#rule-pattern', '[invalid');
    await page.selectOption('#rule-condition', 'must-match');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(300);
    await expect(page.locator('.badge-error').first()).toBeVisible();
  });

  test('badges update in real-time when input changes', async ({ page }) => {
    await page.fill('#rule-name', 'Must Match Digits');
    await page.fill('#rule-pattern', '\\d+');
    await page.selectOption('#rule-condition', 'must-match');
    await page.click('button[type="submit"]');

    await page.fill('#raw-input', 'abc 123');
    await page.waitForTimeout(300);
    await expect(page.locator('.badge-pass').first()).toBeVisible();

    await page.fill('#raw-input', 'no digits');
    await page.waitForTimeout(300);
    await expect(page.locator('.badge-fail').first()).toBeVisible();
  });

  test('can delete a DQ rule', async ({ page }) => {
    await page.fill('#rule-name', 'Temp Rule');
    await page.fill('#rule-pattern', '\\w+');
    await page.click('button[type="submit"]');
    await expect(page.locator('.dq-rule-item')).toHaveCount(1);
    await page.click('.btn-delete');
    await expect(page.locator('.dq-rule-item')).toHaveCount(0);
  });

  test('match-count-equals shows pass when count matches', async ({ page }) => {
    await page.fill('#rule-name', 'Exactly Two');
    await page.fill('#rule-pattern', '\\d+');
    await page.selectOption('#rule-condition', 'match-count-equals');
    await page.waitForTimeout(100);
    await page.fill('#rule-expected-count', '2');
    await page.click('button[type="submit"]');
    await page.fill('#raw-input', '10 20 abc');
    await page.waitForTimeout(300);
    await expect(page.locator('.badge-pass').first()).toBeVisible();
  });
});
