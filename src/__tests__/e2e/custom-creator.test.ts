import { expect } from '@playwright/test';
import { createTableBySelect, extendTest as test } from './utils';

test.beforeEach(async ({ page }) => {
  await page.goto('http://127.0.0.1:5500/docs/test.html');
  page.locator('#editor1.ql-container.ql-snow');
});

test('custom selecor should work', async ({ page }) => {
  await createTableBySelect(page, 'container1', 3, 3);

  const isVisible = await page.locator('#editor1.ql-container .ql-table-wrapper').isVisible();
  expect(isVisible).toBe(true);
  const colCount = await page.locator('#editor1.ql-container .ql-table-wrapper col').count();
  expect(colCount).toBe(3);
  const rowCount = await page.locator('#editor1.ql-container .ql-table-wrapper tr').count();
  expect(rowCount).toBe(3);
  const cellCount = await page.locator('#editor1.ql-container .ql-table-wrapper td').count();
  expect(cellCount).toBe(9);
});

test('custom button should work', async ({ page }) => {
  await page.locator('#container1 .ql-toolbar .ql-table-up > .ql-picker-label').first().click();
  await page.locator('#container1 .ql-toolbar .ql-table-up .ql-custom-select').getByText('Custom').click();

  await page.locator('.table-up-dialog .table-up-button.confirm').click();
  const rowInput = page.locator('.table-up-dialog .table-up-input__input').first();
  expect(rowInput).toHaveClass(/error/);
  const errorText = await page.locator('.table-up-dialog .table-up-input__input').first().locator('.table-up-input__error-tip').textContent();
  expect(errorText).toBe('Please enter a positive integer');

  await page.locator('.table-up-input__item').nth(0).locator('input').fill('3');
  await page.locator('.table-up-input__item').nth(1).locator('input').fill('3');
  await page.getByRole('button', { name: 'Confirm' }).click();

  const isVisible = await page.locator('#editor1.ql-container .ql-table-wrapper').isVisible();
  expect(isVisible).toBe(true);
  const colCount = await page.locator('#editor1.ql-container .ql-table-wrapper col').count();
  expect(colCount).toBe(3);
  const rowCount = await page.locator('#editor1.ql-container .ql-table-wrapper tr').count();
  expect(rowCount).toBe(3);
  const cellCount = await page.locator('#editor1.ql-container .ql-table-wrapper td').count();
  expect(cellCount).toBe(9);
});
