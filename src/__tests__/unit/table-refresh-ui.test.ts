import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TableUp } from '../../table-up';
import { createQuillWithTableModule } from './utils';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('TableUp - refreshUI', () => {
  it('should call texts function with key and use returned text', async () => {
    let locale = 'en';
    const keyCalls: string[] = [];
    const quill = createQuillWithTableModule('<p><br></p>', {
      texts: (key) => {
        keyCalls.push(key);
        if (key === 'customBtnText') return locale === 'en' ? 'Custom' : '自定义';
        if (key === 'fullCheckboxText') return locale === 'en' ? 'Insert full width table' : '插入满宽表格';
        return '';
      },
    });

    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    expect(tableModule.options.texts.customBtnText).toBe('Custom');
    expect(tableModule.options.texts.fullCheckboxText).toBe('Insert full width table');
    expect(keyCalls).toContain('customBtnText');
    expect(keyCalls).toContain('fullCheckboxText');
    locale = 'zh';
    await tableModule.refreshUI();
    expect(tableModule.options.texts.customBtnText).toBe('自定义');
    expect(tableModule.options.texts.fullCheckboxText).toBe('插入满宽表格');
  });

  it('should bind this to TableUp instance when calling texts function', () => {
    let boundThis: TableUp | undefined;
    const quill = createQuillWithTableModule('<p><br></p>', {
      texts(key) {
        boundThis = this;
        if (key === 'customBtnText') return 'Custom';
        return '';
      },
    });

    const tableModule = quill.getModule(TableUp.moduleName) as TableUp;
    expect(tableModule.options.texts.customBtnText).toBe('Custom');
    expect(boundThis).toBe(tableModule);
  });
});
