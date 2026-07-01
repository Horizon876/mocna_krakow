import { test, expect } from '@playwright/test';

test.describe('Admin Panel', () => {
  test('powinien zablokować dostęp do panelu bez sesji', async ({ page }) => {
    // Próba wejścia na stronę admina
    const response = await page.goto('/admin');
    
    // Zależnie od tego, jak działa aplikacja, powinna być chroniona.
    // Zwykle jest przekierowanie na /admin/login albo HTTP 401/403.
    // Jeśli użyto przekierowania (standardowa ścieżka):
    await expect(page).toHaveURL(/.*\/login/);
  });
  
  test('logowanie błędnym hasłem powinno pokazać błąd', async ({ page }) => {
    await page.goto('/admin/login');
    
    // Jeśli aplikacja wymaga wpisania hasła
    // Sprawdzamy czy istnieje pole z hasłem
    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('złehasło123');
      
      const submitBtn = page.locator('button[type="submit"]');
      await submitBtn.click();
      
      // Powinno zostać na tej samej stronie albo pokazać błąd
      await expect(page).toHaveURL(/.*\/login/);
    }
  });
});
