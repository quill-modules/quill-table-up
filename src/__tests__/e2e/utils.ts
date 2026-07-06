import type { Page, PlaywrightWorkerOptions } from '@playwright/test';
import { test } from '@playwright/test';
import MCR from 'monocart-coverage-reports';
import { coverageOptions } from './coverage-options';
import { EditorPage } from './editor-page';

declare global {
  interface Window {
    pasteEventTriggered: boolean;
  }
}

export async function createTableBySelect(page: Page, container: string, row: number, col: number) {
  await page.locator(`#${container} .ql-toolbar .ql-table-up.ql-picker`).click();
  await page.locator(`#${container} .ql-toolbar .ql-custom-select .table-up-select-box__item[data-row="${row}"][data-col="${col}"]`).click();
}

export async function pasteHTML(page: Page, html: string, { browserName = 'chromium' }: { browserName: PlaywrightWorkerOptions['browserName'] }) {
  await page.evaluate(() => {
    window.pasteEventTriggered = false;
    document.addEventListener('paste', () => {
      window.pasteEventTriggered = true;
    });
  });

  await page.evaluate(async ({ html, browserName }) => {
    if (browserName === 'firefox') {
      const clipboardItem = new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }) });
      await navigator.clipboard.write([clipboardItem]);
    }
    else {
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/html', html);
      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData,
      });
      document.dispatchEvent(pasteEvent);
    }
  }, { html, browserName });
  if (browserName === 'firefox') {
    await page.keyboard.press('Control+v');
  }
  await page.waitForFunction(() => window.pasteEventTriggered);
}

export const extendTest = test.extend<{
  editorPage: EditorPage;
  // no return value - this fixture's only job is to wrap every test in
  // start/stop V8 coverage collection, so it's requested by nothing and
  // must be `auto: true` to run regardless
  autoCoverage: void;
}>({
  editorPage: ({ page }, use) => {
    use(new EditorPage(page));
  },
  // `page.coverage` (V8 JS coverage) is Chromium-only; Firefox has no
  // equivalent Playwright API, so this is a no-op there
  autoCoverage: [
    async ({ page, browserName }, use) => {
      const collectsCoverage = browserName === 'chromium';
      if (collectsCoverage) {
        await page.coverage.startJSCoverage({ resetOnNavigation: false });
      }

      await use();

      if (collectsCoverage) {
        const jsCoverage = await page.coverage.stopJSCoverage();
        const mcr = MCR(coverageOptions);
        await mcr.add(jsCoverage);
      }
    },
    { auto: true },
  ],
});
