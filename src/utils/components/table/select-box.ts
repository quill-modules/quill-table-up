import type { TableCreatorTextOptions } from '../../types';
import { createBEM } from '../../bem';
import { showTableCreator } from './creator';

interface TableSelectOptions {
  row: number;
  col: number;
  onSelect: (row: number, col: number) => void;
  customBtn: boolean;
  texts: Partial<TableCreatorTextOptions>;
}
export function createSelectBox(options: Partial<TableSelectOptions> = {}) {
  const bem = createBEM('select-box');
  const selectDom = document.createElement('span');
  selectDom.classList.add(bem.b());

  const selectBlock = document.createElement('span');
  selectBlock.classList.add(bem.be('block'));
  for (let r = 0; r < (options.row || 8); r++) {
    for (let c = 0; c < (options.col || 8); c++) {
      const selectItem = document.createElement('span');
      selectItem.classList.add(bem.be('item'));
      selectItem.dataset.row = String(r + 1);
      selectItem.dataset.col = String(c + 1);
      selectBlock.appendChild(selectItem);
    }
  }
  const updateSelectBlockItems = () => {
    const { row, col } = selectDom.dataset;
    for (const item of Array.from(selectBlock.querySelectorAll('.active'))) {
      item.classList.remove('active');
    }
    if (!row || !col) return;
    const childs = Array.from(selectBlock.children) as HTMLElement[];
    for (const child of childs) {
      const { row: childRow, col: childCol } = child.dataset;
      if (childRow! > row && childCol! > col) {
        return;
      }
      child.classList.toggle('active', childRow! <= row && childCol! <= col);
    }
  };
  selectBlock.addEventListener('mousemove', (e) => {
    if (!e.target) return;
    const { row, col } = (e.target as HTMLElement).dataset;
    if (!row || !col) return;
    selectDom.dataset.row = row;
    selectDom.dataset.col = col;
    updateSelectBlockItems();
  });
  selectBlock.addEventListener('mouseleave', () => {
    selectDom.removeAttribute('data-row');
    selectDom.removeAttribute('data-col');
    updateSelectBlockItems();
  });
  selectBlock.addEventListener('click', () => {
    const { row, col } = selectDom.dataset;
    if (!row || !col) return;
    options.onSelect?.(Number(row), Number(col));
  });
  selectDom.appendChild(selectBlock);

  if (options.customBtn) {
    const texts = options.texts || {};
    const selectCustom = document.createElement('span');
    selectCustom.classList.add(bem.be('custom'));
    selectCustom.textContent = texts.customBtnText || 'Custom';
    selectCustom.addEventListener('click', async () => {
      const res = await showTableCreator(texts);
      if (res) {
        options.onSelect?.(res.row, res.col);
      }
    });
    selectDom.appendChild(selectCustom);
  }

  return selectDom;
}
