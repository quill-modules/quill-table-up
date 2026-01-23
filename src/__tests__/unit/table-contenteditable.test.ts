import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TableDomSelector, TableSelection } from '../../modules';
import { TableUp } from '../../table-up';
import { createQuillWithTableModule } from './utils';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('TableUp - contenteditable change', () => {
  describe('when contenteditable becomes false', () => {
    it('should destroy all table modules', async () => {
      const quill = createQuillWithTableModule(`<p><br></p>`, {
        modules: [{ module: TableSelection }],
      });

      const tableUp = quill.getModule(TableUp.moduleName) as TableUp;
      const module = tableUp.getModule<TableSelection>(TableSelection.moduleName);

      expect(module).toBeDefined();

      // Disable editor
      quill.enable(false);

      // Wait for MutationObserver callback
      await vi.runAllTimersAsync();

      // Verify modules are cleared
      expect(tableUp.modules).not.toBeNullable();
      expect(Object.keys(tableUp.modules).length).toEqual(0);
    });

    it('should handle modules without destroy method gracefully', async () => {
      // Create a module without destroy method
      class MockModuleWithoutDestroy extends TableDomSelector {
        static moduleName = 'mock-module-without-destroy';
      }

      const quill = createQuillWithTableModule(`<p><br></p>`, {
        modules: [{ module: MockModuleWithoutDestroy }],
      });

      const tableUp = quill.getModule(TableUp.moduleName) as TableUp;

      // Should not throw error
      await expect(() => quill.enable(false)).not.toThrow();

      // Modules should be cleared
      expect(tableUp.modules).not.toBeNullable();
      expect(Object.keys(tableUp.modules).length).toEqual(0);
    });
  });

  describe('when contenteditable becomes true', () => {
    it('should create new module instances', async () => {
      const quill = createQuillWithTableModule(`<p><br></p>`, {
        modules: [{ module: TableSelection }],
      });

      const tableUp = quill.getModule(TableUp.moduleName) as TableUp;
      const oldModule = tableUp.getModule<TableSelection>(TableSelection.moduleName);

      expect(oldModule).toBeDefined();

      // Disable editor
      quill.enable(false);
      await vi.runAllTimersAsync();

      // Re-enable editor
      quill.enable(true);
      await vi.runAllTimersAsync();

      // Get new module instance
      const newModule = tableUp.getModule<TableSelection>(TableSelection.moduleName);

      // Verify new instance is created
      expect(newModule).toBeDefined();
      expect(newModule).not.toBe(oldModule);
    });

    it('should work with multiple enable/disable cycles', async () => {
      const quill = createQuillWithTableModule(`<p><br></p>`, {
        modules: [{ module: TableSelection }],
      });

      const tableUp = quill.getModule(TableUp.moduleName) as TableUp;

      // Multiple toggle cycles
      quill.enable(false);
      await vi.runAllTimersAsync();

      quill.enable(true);
      await vi.runAllTimersAsync();

      quill.enable(false);
      await vi.runAllTimersAsync();

      quill.enable(true);
      await vi.runAllTimersAsync();

      // Verify modules still work
      const module = tableUp.getModule<TableSelection>(TableSelection.moduleName);
      expect(module).toBeDefined();
      expect(module).toBeInstanceOf(TableSelection);
    });
  });

  describe('error handling', () => {
    it('should continue working if module destroy throws error', async () => {
      // Create a module that throws error on destroy
      class BadModule extends TableDomSelector {
        static moduleName = 'bad-module';

        destroy() {
          throw new Error('Destroy failed');
        }
      }

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const quill = createQuillWithTableModule(`<p><br></p>`, {
        modules: [{ module: BadModule }],
      });

      const tableUp = quill.getModule(TableUp.moduleName) as TableUp;

      // Should not throw error
      await expect(() => quill.enable(false)).not.toThrow();

      // Should output warning
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to destroy module'),
        expect.any(Error),
      );

      consoleWarnSpy.mockRestore();

      // Modules should be cleared
      expect(tableUp.modules).toEqual({});
    });

    it('should handle partial destroy failures', async () => {
      class BadModule extends TableDomSelector {
        static moduleName = 'bad-module';

        destroy() {
          throw new Error('Bad module destroy failed');
        }
      }

      class GoodModule extends TableDomSelector {
        static moduleName = 'good-module';

        destroy() {
          // Normal destroy
        }
      }

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const quill = createQuillWithTableModule(`<p><br></p>`, {
        modules: [
          { module: BadModule },
          { module: GoodModule },
        ],
      });

      const tableUp = quill.getModule(TableUp.moduleName) as TableUp;

      quill.enable(false);
      await vi.runAllTimersAsync();

      // Should have warning
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();

      // All modules should be cleared
      expect(tableUp.modules).toEqual({});
    });
  });

  describe('MutationObserver behavior', () => {
    it('should only respond to contenteditable attribute changes', async () => {
      const quill = createQuillWithTableModule(`<p><br></p>`, {
        modules: [{ module: TableSelection }],
      });

      const tableUp = quill.getModule(TableUp.moduleName) as TableUp;
      const initialModuleCount = Object.keys(tableUp.modules).length;

      // Change other attributes, should not trigger destroy
      quill.root.setAttribute('data-test', 'value');
      await vi.runAllTimersAsync();

      expect(Object.keys(tableUp.modules).length).toBe(initialModuleCount);

      // Change contenteditable should trigger
      quill.enable(false);
      await vi.runAllTimersAsync();

      expect(tableUp.modules).toEqual({});
    });

    it('should handle direct contenteditable attribute changes', async () => {
      const quill = createQuillWithTableModule(`<p><br></p>`, {
        modules: [{ module: TableSelection }],
      });

      const tableUp = quill.getModule(TableUp.moduleName) as TableUp;

      // Directly set contenteditable attribute (instead of using enable method)
      quill.root.setAttribute('contenteditable', 'false');
      await vi.runAllTimersAsync();

      expect(Object.keys(tableUp.modules).length).toEqual(0);
    });
  });
});
