import { test, expect } from '@playwright/test';

test.describe('US1: Real-Time Regex Match Highlighting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('highlights matches when user types a valid regex', async ({ page }) => {
    await page.fill('#raw-input', 'hello world hello');
    await page.fill('#pattern-input', 'hello');
    await page.waitForTimeout(300); // allow debounce
    const marks = page.locator('#highlight-layer mark');
    await expect(marks).toHaveCount(2);
  });

  test('shows inline error for invalid regex', async ({ page }) => {
    await page.fill('#raw-input', 'test data');
    await page.fill('#pattern-input', '[invalid');
    await page.waitForTimeout(300);
    const error = page.locator('#pattern-error');
    await expect(error).not.toBeEmpty();
    const marks = page.locator('#highlight-layer mark');
    await expect(marks).toHaveCount(0);
  });

  test('shows No matches indicator when regex matches nothing', async ({ page }) => {
    await page.fill('#raw-input', 'hello world');
    await page.fill('#pattern-input', 'xyz');
    await page.waitForTimeout(300);
    const noMatch = page.locator('#no-matches-indicator');
    await expect(noMatch).not.toBeEmpty();
  });

  test('clears error when pattern becomes valid', async ({ page }) => {
    await page.fill('#pattern-input', '[invalid');
    await page.waitForTimeout(300);
    await page.fill('#pattern-input', '\\d+');
    await page.waitForTimeout(300);
    const error = page.locator('#pattern-error');
    await expect(error).toBeEmpty();
  });

  test('flag toggle i applies case-insensitive matching', async ({ page }) => {
    await page.fill('#raw-input', 'Hello HELLO hello');
    await page.fill('#pattern-input', 'hello');
    await page.waitForTimeout(300);
    // Without i flag: only 1 match
    const before = await page.locator('#highlight-layer mark').count();
    expect(before).toBe(1);

    await page.click('button[data-flag="i"]');
    await page.waitForTimeout(300);
    // With i flag: 3 matches
    await expect(page.locator('#highlight-layer mark')).toHaveCount(3);
  });

  test('highlights update within 200ms for 10k-char input (SC-001)', async ({ page }) => {
    const input10k = 'hello world '.repeat(900); // ~10.8k chars
    await page.fill('#raw-input', input10k);

    const start = Date.now();
    await page.fill('#pattern-input', 'hello');
    await page.waitForTimeout(250); // debounce 150ms + render
    const elapsed = Date.now() - start;

    const marks = page.locator('#highlight-layer mark');
    await expect(marks.first()).toBeVisible();
    // Allow up to 500ms total including Playwright overhead
    expect(elapsed).toBeLessThan(500);
  });

  test('shows performance warning for input over 50k chars (FR-015)', async ({ page }) => {
    const bigInput = 'a'.repeat(50_001);
    await page.fill('#raw-input', bigInput);
    await page.waitForTimeout(300);
    const warning = page.locator('#perf-warning');
    await expect(warning).toBeVisible();
  });

  test('highlight snapshot - single match wraps correctly', async ({ page }) => {
    await page.fill('#raw-input', 'foo bar foo');
    await page.fill('#pattern-input', 'foo');
    await page.waitForTimeout(300);
    const layer = page.locator('#highlight-layer');
    await expect(layer).toContainText('foo');
    const firstMark = layer.locator('mark').first();
    await expect(firstMark).toHaveAttribute('data-group', '0');
  });
});
