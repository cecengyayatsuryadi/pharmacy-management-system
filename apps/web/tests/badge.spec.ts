import { test, expect } from '@playwright/test';

test('verify badge variants in light and dark mode', async ({ page }) => {
  // Navigate to the test page
  await page.goto('/badge-test');

  // Verify Light Mode Badges
  const lightBadges = page.locator('section').first().locator('[data-slot="badge"]');
  await expect(lightBadges.filter({ hasText: 'Success' })).toBeVisible();
  await expect(lightBadges.filter({ hasText: 'Warning' })).toBeVisible();
  await expect(lightBadges.filter({ hasText: 'Destructive' })).toBeVisible();

  // Verify Dark Mode Badges
  const darkBadges = page.locator('section.dark').locator('[data-slot="badge"]');
  await expect(darkBadges.filter({ hasText: 'Success' })).toBeVisible();
  await expect(darkBadges.filter({ hasText: 'Warning' })).toBeVisible();
  await expect(darkBadges.filter({ hasText: 'Destructive' })).toBeVisible();

  // Visual snapshot (if enabled)
  // await expect(page).toHaveScreenshot('badges-all-modes.png');
  
  console.log('✅ All badge variants are visible in both light and dark modes.');
});
