import { test, expect } from '@playwright/test';

test('is render parent and child', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    const tochildBtn = await page.getByRole('link', { name: 'to child' });
    await expect(tochildBtn).toBeVisible();
    await tochildBtn.click();
    await expect(page.getByRole('heading',{name:'Location Tests'})).toBeVisible();
});
// test('is render child', async ({ page }) => {
//     await page.goto('http://localhost:5173/');
//     const tochildBtn = await page.getByRole('link', { name: 'to child' });
//     await expect(tochildBtn).toBeVisible();
//     await tochildBtn.click();
//     await expect(tochildBtn).toBeVisible();
// });
