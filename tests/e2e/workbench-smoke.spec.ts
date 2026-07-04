import { expect, test } from '@playwright/test';

test('loads the codemap-ai workbench shell and navigates key pages', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/codemap-ai Workbench/);
  await expect(page.getByLabel('codemap-ai')).toBeVisible();
  await expect(page.getByRole('button', { name: '项目总览' })).toBeVisible();
  await expect(page.getByRole('button', { name: '代码图谱' })).toBeVisible();
  await expect(page.getByRole('button', { name: '接管文档' })).toBeVisible();

  await page.getByRole('button', { name: '代码图谱' }).click();
  await expect(page.getByRole('heading', { name: '代码图谱' })).toBeVisible();

  await page.getByRole('button', { name: '追问历史' }).click();
  await expect(page.getByRole('heading', { name: '阅读路线' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '追问历史' })).toBeVisible();
});
