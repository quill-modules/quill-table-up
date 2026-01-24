import type Quill from 'quill';
import type { TableUp } from '../../table-up';
import type { InternalTableSelectionModule, Position, TableMenuOptions } from '../../utils';
import type { TableSelection } from '../table-selection';
import { addScrollEvent, clearScrollEvent, limitDomInViewPort, tableUpEvent, tableUpInternal } from '../../utils';
import { menuColorSelectClassName } from './constants';
import { TableMenuCommon } from './table-menu-common';

type TableMenuOptionsInput = Partial<Omit<TableMenuOptions, 'texts'>>;
export class TableMenuContextmenu extends TableMenuCommon {
  static moduleName = 'table-menu-contextmenu';

  scrollHandler: [HTMLElement, (e: Event) => void][] = [];

  constructor(public tableModule: TableUp, public quill: Quill, options: TableMenuOptionsInput) {
    super(tableModule, quill, options);

    this.quill.root.addEventListener('contextmenu', this.listenContextmenu);
    this.quill.on(tableUpEvent.TABLE_SELECTION_CHANGE, this.tableSelectioChange);
    this.quill.on(tableUpEvent.TABLE_SELECTION_DISPLAY_CHANGE, this.tableSelectioChange);
  }

  tableSelectioChange = (tableSelection: InternalTableSelectionModule) => {
    if (tableSelection.selectedTds.length <= 0) {
      this.hide();
    }
  };

  listenContextmenu = (e: MouseEvent) => {
    const path = e.composedPath() as HTMLElement[];
    if (!path || path.length <= 0) return;

    const tableNode = path.find(node => node.tagName?.toUpperCase() === 'TABLE' && node.classList.contains('ql-table'));

    const tableSelection = this.tableModule.getModule<TableSelection>(tableUpInternal.tableSelectionName);
    if (tableNode && tableSelection?.selectedTds?.length) {
      e.preventDefault();
      if (!this.menu) {
        this.menu = this.buildTools();
      }
      // manual call menu show
      this.isMenuDisplay = true;
      this.update({ x: e.clientX, y: e.clientY });
      const tempHide = () => {
        this.hide();
        clearScrollEvent.call(this);
      };
      addScrollEvent.call(this, this.quill.root, tempHide);
      document.addEventListener('click', tempHide, { once: true });
    }
    else {
      this.hide();
    }
  };

  buildTools(): HTMLElement {
    const menu = super.buildTools();
    menu.classList.add(this.bem.is('contextmenu'));
    const items = menu.getElementsByClassName(menuColorSelectClassName);
    for (const item of Array.from(items)) {
      item.addEventListener('click', e => e.stopPropagation());
    }
    this.quill.container.appendChild(menu);
    return menu;
  }

  createTipText(item: HTMLElement, text: string): void {
    const tipTextDom = document.createElement('span');
    tipTextDom.textContent = text;
    item.appendChild(tipTextDom);
  }

  // override show. because TableSelection will call tableMenu.show() after select td
  show() {}

  update(position?: Position) {
    super.update();
    const tableSelection = this.tableModule.getModule<TableSelection>(tableUpInternal.tableSelectionName);
    if (!this.table || !this.isMenuDisplay || !this.menu) {
      this.hide();
      return;
    }
    if (!position || !tableSelection?.isDisplaySelection) {
      return;
    }

    const rootRect = this.quill.container.getBoundingClientRect();
    Object.assign(this.menu.style, {
      left: `${position.x - rootRect.x}px`,
      top: `${position.y - rootRect.y}px`,
    });

    // limit menu in viewport
    const menuRect = this.menu.getBoundingClientRect();
    const { left: limitLeft, top: limitTop } = limitDomInViewPort(menuRect);
    const diffX = menuRect.left - limitLeft;
    const diffY = menuRect.top - limitTop;
    Object.assign(this.menu.style, {
      left: `${position.x - rootRect.x - diffX}px`,
      top: `${position.y - rootRect.y - diffY}px`,
    });
  }

  destroy() {
    this.quill.root.removeEventListener('contextmenu', this.listenContextmenu);
    super.destroy();
    this.quill.off(tableUpEvent.TABLE_SELECTION_CHANGE, this.tableSelectioChange);
    this.quill.off(tableUpEvent.TABLE_SELECTION_DISPLAY_CHANGE, this.tableSelectioChange);
  }
}
