import type Quill from 'quill';
import type { TableUp } from '../table-up';

export interface TableModuleLifecycle {
  hide: () => void;
  show: () => void;
  update: () => void;
  destroy: () => void;
}

export class TableDomSelector implements TableModuleLifecycle {
  table?: HTMLTableElement;

  constructor(public tableModule: TableUp, public quill: Quill) {
    this.quill.root.addEventListener('mousedown', this.tableSelectHandler.bind(this));
  }

  tableSelectHandler(event: MouseEvent) {
    const path = event.composedPath() as HTMLElement[];
    if (event.button !== 0 || !path || path.length <= 0) return;
    const tableNode = path.find(node => node.tagName && node.tagName.toUpperCase() === 'TABLE');
    this.setSelectionTable(tableNode as HTMLTableElement);
  }

  setSelectionTable(table: HTMLTableElement | undefined) {
    if (this.table === table) return;
    this.hide();
    this.table = table;
    if (this.table) {
      this.show();
    }
    this.update();
  }

  hide() {}

  show() {}

  update() {}

  destroy() {
    this.hide();
    this.table = undefined;
  }
}
