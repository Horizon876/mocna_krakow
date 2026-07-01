import { test, expect } from '@playwright/test';

test.describe('Strona Główna', () => {
  test('powinna się wczytać i wyświetlić odpowiedni tytuł', async ({ page }) => {
    await page.goto('/');
    
    // Sprawdzenie czy tytuł strony zawiera "MOCna"
    await expect(page).toHaveTitle(/MOCna/);
    
    // Sprawdzenie czy główny nagłówek istnieje (np. kawa specialty itp.)
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });
  
  test('nawigacja powinna działać', async ({ page }) => {
    await page.goto('/');
    
    // Znalezienie linku do wsparcia
    const supportLink = page.getByRole('link', { name: /Wesprzyj|Zostań Patronem/i }).first();
    
    if (await supportLink.isVisible()) {
      await expect(supportLink).toHaveAttribute('href', /^\/wesprzyj/);
    }
  });
});
