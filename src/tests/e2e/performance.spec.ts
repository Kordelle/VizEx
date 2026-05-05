import { test, expect } from '@playwright/test';

/**
 * T047 — Phase 8 performance e2e tests
 *
 * Validates that:
 * 1. The page stays interactive (no full freeze) while processing large CSV input
 * 2. Highlight marks appear within a reasonable time
 * 3. Scrolling remains functional after highlights are applied
 * 4. Truncation warning appears when match count exceeds 2 000
 */

// 500-row CSV with email addresses in column 3
const CSV_500 = Array.from({ length: 500 }, (_, i) =>
  `row${i},value${i},user${i}@example.com,extra${i}`
).join('\n');

// 2100-row input to trigger truncation (one email per line)
const CSV_2100 = Array.from({ length: 2_100 }, (_, i) =>
  `user${i}@corp.org`
).join('\n');

const EMAIL_PATTERN = '[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}';

test.describe('Phase 8 — performance & render fidelity', () => {

  test('page stays interactive and highlights appear within 2s on 500-row CSV', async ({ page }) => {
    await page.goto('/');

    // Paste the CSV into the contenteditable input
    await page.click('#raw-input');
    await page.evaluate((csv) => {
      const el = document.getElementById('raw-input')!;
      el.textContent = csv;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, CSV_500);

    // Type the email pattern
    await page.fill('#pattern-input', EMAIL_PATTERN);
    await page.dispatchEvent('#pattern-input', 'input');

    // Marks should appear within 2s — page must not be frozen
    await expect(page.locator('#highlight-layer mark').first()).toBeVisible({ timeout: 2_000 });
  });

  test('scroll position remains functional after highlights applied', async ({ page }) => {
    await page.goto('/');

    await page.evaluate((csv) => {
      const el = document.getElementById('raw-input')!;
      el.textContent = csv;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, CSV_500);

    await page.fill('#pattern-input', EMAIL_PATTERN);
    await page.dispatchEvent('#pattern-input', 'input');

    // Wait for marks to appear
    await page.locator('#highlight-layer mark').first().waitFor({ timeout: 2_000 });

    // Scroll raw-input to bottom
    await page.evaluate(() => {
      const el = document.getElementById('raw-input')!;
      el.scrollTop = el.scrollHeight;
    });

    // scrollTop should have moved — page was not frozen
    const scrollTop = await page.evaluate(() =>
      document.getElementById('raw-input')!.scrollTop
    );
    expect(scrollTop).toBeGreaterThan(0);
  });

  test('truncation warning appears when matches exceed 2000', async ({ page }) => {
    await page.goto('/');

    await page.evaluate((csv) => {
      const el = document.getElementById('raw-input')!;
      el.textContent = csv;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, CSV_2100);

    await page.fill('#pattern-input', EMAIL_PATTERN);
    await page.dispatchEvent('#pattern-input', 'input');

    // Truncation warning should become visible
    await expect(page.locator('#truncation-warning')).toBeVisible({ timeout: 3_000 });
    await expect(page.locator('#truncation-warning')).toContainText('2,000');
  });

  test('highlight layer scroll stays in sync with input scroll', async ({ page }) => {
    await page.goto('/');

    await page.evaluate((csv) => {
      const el = document.getElementById('raw-input')!;
      el.textContent = csv;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, CSV_500);

    await page.fill('#pattern-input', EMAIL_PATTERN);
    await page.dispatchEvent('#pattern-input', 'input');

    await page.locator('#highlight-layer mark').first().waitFor({ timeout: 2_000 });

    // Scroll to bottom and check both elements have the same scrollTop
    const diff = await page.evaluate(() => {
      const input = document.getElementById('raw-input')!;
      const layer = document.getElementById('highlight-layer')!;
      input.scrollTop = input.scrollHeight;
      input.dispatchEvent(new Event('scroll'));
      return Math.abs(input.scrollTop - layer.scrollTop);
    });

    expect(diff).toBeLessThanOrEqual(1); // allow 1px rounding
  });
});
