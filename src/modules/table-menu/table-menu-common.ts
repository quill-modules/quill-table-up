import type { TableUp } from '../../table-up';
import type { TableMenuOptions, ToolOption, TooltipInstance, ToolTipOptions } from '../../utils';
import type { TableSelection } from '../table-selection';
import Quill from 'quill';
import { createBEM, createColorPicker, createTooltip, debounce, defaultColorMap, isArray, isFunction, randomId, tableUpEvent, tableUpInternal } from '../../utils';
import { TableDomSelector } from '../table-dom-selector';
import { colorClassName, maxSaveColorCount, menuColorSelectClassName, tableMenuTools } from './constants';

export type TableMenuOptionsInput = Partial<Omit<TableMenuOptions, 'texts'>>;
export interface MenuTooltipInstance extends TooltipInstance {
  isColorPick?: boolean;
}
export class TableMenuCommon extends TableDomSelector {
  static moduleName = 'table-menu';

  usedColors = new Set<string>();
  options: TableMenuOptions;
  menu: HTMLElement | null = null;
  isMenuDisplay: boolean = false;
  isColorPicking: boolean = false;
  tooltipItem: MenuTooltipInstance[] = [];
  activeTooltip: MenuTooltipInstance | null = null;
  bem = createBEM('menu');
  colorItemClass = `color-${randomId()}`;
  colorChooseTooltipOption: ToolTipOptions = {
    direction: 'top',
  };

  constructor(public tableModule: TableUp, public quill: Quill, options: TableMenuOptionsInput) {
    super(tableModule, quill);

    this.options = this.resolveOptions(options);
    try {
      const storageValue = localStorage.getItem(this.options.localstorageKey) || '[]';
      let colorValue = JSON.parse(storageValue);
      if (!isArray(colorValue)) {
        colorValue = [];
      }
      colorValue.slice(-1 * maxSaveColorCount).map((c: string) => this.usedColors.add(c));
    }
    catch {}

    this.quill.on(Quill.events.EDITOR_CHANGE, this.updateWhenTextChange);
    this.quill.on(tableUpEvent.TABLE_SELECTION_DRAG_START, this.hideWhenSelectionDragStart);
  }

  updateUsedColor = debounce((color?: string) => {
    if (!color) return;
    this.usedColors.add(color);
    if (this.usedColors.size > maxSaveColorCount) {
      const saveColors = Array.from(this.usedColors).slice(-1 * maxSaveColorCount);
      this.usedColors.clear();
      saveColors.map(v => this.usedColors.add(v));
    }

    localStorage.setItem(this.options.localstorageKey, JSON.stringify(Array.from(this.usedColors)));
    const usedColorWrappers = Array.from(document.querySelectorAll(`.${this.colorItemClass}.${colorClassName.used}`));
    for (const usedColorWrapper of usedColorWrappers) {
      const newColorItem = document.createElement('div');
      newColorItem.classList.add(colorClassName.item);
      newColorItem.style.backgroundColor = String(color);
      // if already have same color item. doesn't need insert
      const sameColorItem = Array.from(usedColorWrapper.querySelectorAll(`.${colorClassName.item}[style*="background-color: ${newColorItem.style.backgroundColor}"]`));
      if (sameColorItem.length <= 0) {
        usedColorWrapper.appendChild(newColorItem);
      }

      const colorItem = Array.from(usedColorWrapper.querySelectorAll(`.${colorClassName.item}`)).slice(0, -1 * maxSaveColorCount);
      for (const item of colorItem) {
        item.remove();
      }
    }
  }, 1000);

  hideWhenSelectionDragStart = () => {
    this.hide();
  };

  updateWhenTextChange = (eventName: string) => {
    if (eventName === Quill.events.TEXT_CHANGE && this.isMenuDisplay) {
      this.update();
    }
  };

  resolveOptions(options: TableMenuOptionsInput) {
    const value = Object.assign({
      tipText: true,
      tools: [
        tableMenuTools.InsertTop,
        tableMenuTools.InsertRight,
        tableMenuTools.InsertBottom,
        tableMenuTools.InsertLeft,
        tableMenuTools.Break,
        tableMenuTools.MergeCell,
        tableMenuTools.SplitCell,
        tableMenuTools.Break,
        tableMenuTools.DeleteRow,
        tableMenuTools.DeleteColumn,
        tableMenuTools.DeleteTable,
        tableMenuTools.Break,
        tableMenuTools.BackgroundColor,
        tableMenuTools.BorderColor,
      ],
      localstorageKey: '__table-bg-used-color',
      defaultColorMap,
    }, options);
    return value as TableMenuOptions;
  }

  buildTools(): HTMLElement {
    const toolBox = document.createElement('div');
    toolBox.classList.add(this.bem.b());
    Object.assign(toolBox.style, { display: 'flex' });
    for (const tool of this.options.tools) {
      const { name, icon, handle, isColorChoose, key: attrKey, tip = '' } = tool as ToolOption;
      const item = document.createElement('span');
      item.classList.add(this.bem.be('item'));
      if (name === 'break') {
        item.classList.add(this.bem.is('break'));
      }
      else {
        // add icon
        const iconDom = document.createElement('i');
        iconDom.classList.add('icon');
        if (isFunction(icon)) {
          iconDom.appendChild(icon(this.tableModule));
        }
        else {
          iconDom.innerHTML = icon;
        }
        item.appendChild(iconDom);

        if (isColorChoose && attrKey) {
          const tooltipItem = this.createColorChoose(item, { name, icon, handle, isColorChoose, key: attrKey, tip });
          this.tooltipItem.push(tooltipItem);
          item.classList.add(menuColorSelectClassName);
        }
        else {
          isFunction(handle) && item.addEventListener('click', (e) => {
            this.quill.focus();
            handle.call(this, this.tableModule, this.getSelectedTds(), e);
          }, false);
        }

        // add text
        const tipText = this.tableModule.options.texts[name] || tip;
        if (this.options.tipText && tipText && tip) {
          this.createTipText(item, tipText);
        }
      }
      toolBox.appendChild(item);
    }
    return toolBox;
  }

  createColorChoose(item: HTMLElement, { handle, key }: ToolOption) {
    const colorSelectWrapper = document.createElement('div');
    colorSelectWrapper.classList.add(colorClassName.selectWrapper);

    if (this.options.defaultColorMap.length > 0) {
      const colorMap = document.createElement('div');
      colorMap.classList.add(colorClassName.map);
      for (const colors of this.options.defaultColorMap) {
        const colorMapRow = document.createElement('div');
        colorMapRow.classList.add(colorClassName.mapRow);
        for (const color of colors) {
          const colorItem = document.createElement('div');
          colorItem.classList.add(colorClassName.item);
          colorItem.style.backgroundColor = color;
          colorMapRow.appendChild(colorItem);
        }
        colorMap.appendChild(colorMapRow);
      }
      colorSelectWrapper.appendChild(colorMap);
    }

    const colorMapRow = document.createElement('div');
    colorMapRow.classList.add(colorClassName.mapRow);
    Object.assign(colorMapRow.style, {
      marginTop: '4px',
    });
    const transparentColor = document.createElement('div');
    transparentColor.classList.add(colorClassName.btn, 'transparent');
    transparentColor.textContent = this.tableModule.options.texts.transparent;
    transparentColor.addEventListener('click', () => {
      handle.call(this, this.tableModule, this.getSelectedTds(), 'transparent');
    });
    const clearColor = document.createElement('div');
    clearColor.classList.add(colorClassName.btn, 'clear');
    clearColor.textContent = this.tableModule.options.texts.clear;
    clearColor.addEventListener('click', () => {
      handle.call(this, this.tableModule, this.getSelectedTds(), null);
    });
    const customColor = document.createElement('div');
    customColor.classList.add(colorClassName.btn, 'custom');
    customColor.textContent = this.tableModule.options.texts.custom;
    const colorPicker = createColorPicker({
      onChange: (color) => {
        handle.call(this, this.tableModule, this.getSelectedTds(), color);
        this.updateUsedColor(color);
      },
    });
    const { hide: hideColorPicker, destroy: destroyColorPicker } = createTooltip(customColor, {
      direction: 'right',
      type: 'click',
      content: colorPicker,
      container: customColor,
    })!;

    colorMapRow.appendChild(transparentColor);
    colorMapRow.appendChild(clearColor);
    colorMapRow.appendChild(customColor);
    colorSelectWrapper.appendChild(colorMapRow);

    const usedColorWrap = document.createElement('div');
    usedColorWrap.classList.add(colorClassName.used, this.colorItemClass);
    for (const recordColor of this.usedColors) {
      const colorItem = document.createElement('div');
      colorItem.classList.add(colorClassName.item);
      colorItem.style.backgroundColor = recordColor;
      usedColorWrap.appendChild(colorItem);
    }
    colorSelectWrapper.appendChild(usedColorWrap);

    colorSelectWrapper.addEventListener('click', (e) => {
      e.stopPropagation();
      hideColorPicker();
      const item = e.target as HTMLElement;
      const color = item.style.backgroundColor;
      const selectedTds = this.getSelectedTds();
      if (item && color && selectedTds.length > 0) {
        this.tableModule.setCellAttrs(selectedTds, key!, color, true);
        if (!item.closest(`.${colorClassName.item}`)) return;
        this.updateUsedColor(color);
      }
    });

    // get tooltip instance. makesure color picker only display one at time
    const tooltip: MenuTooltipInstance = createTooltip(item, {
      ...this.colorChooseTooltipOption,
      type: 'click',
      content: colorSelectWrapper,
      container: this.quill.container,
      onOpen: () => {
        const tableSelection = this.tableModule.getModule<TableSelection>(tableUpInternal.tableSelectionName);
        if (this.isMenuDisplay && tableSelection) {
          tableSelection.hideDisplay();
        }
        this.setActiveTooltip(tooltip);
        return false;
      },
      onClose: () => {
        const tableSelection = this.tableModule.getModule<TableSelection>(tableUpInternal.tableSelectionName);
        if (this.isMenuDisplay && tableSelection) {
          tableSelection.updateWithSelectedTds();
          tableSelection.showDisplay();
        }
        const isChild = colorSelectWrapper.contains(colorPicker);
        if (isChild) {
          hideColorPicker();
        }
        if (this.activeTooltip === tooltip) {
          this.activeTooltip = null;
        }
        return false;
      },
      onDestroy: () => {
        destroyColorPicker();
        if (this.activeTooltip === tooltip) {
          this.activeTooltip = null;
        }
      },
    })!;
    tooltip.isColorPick = true;
    return tooltip;
  }

  setActiveTooltip(tooltip: MenuTooltipInstance | null) {
    if (this.activeTooltip && this.activeTooltip !== tooltip) {
      this.activeTooltip.hide(true);
    }
    this.activeTooltip = tooltip;
  }

  getSelectedTds() {
    const tableSelection = this.tableModule.getModule<TableSelection>(tableUpInternal.tableSelectionName);
    return tableSelection?.selectedTds || [];
  }

  createTipText(item: HTMLElement, text: string) {
    const tipTextDom = createTooltip(item, { msg: text, container: this.quill.container });
    tipTextDom && this.tooltipItem.push(tipTextDom);
  }

  show() {
    if (!this.table) return;
    if (this.menu) {
      this.hide();
    }
    this.menu = this.buildTools();
  }

  update() {
    if (this.table && !this.quill.root.contains(this.table)) {
      this.setSelectionTable(undefined);
    }
  }

  hide() {
    if (this.menu) {
      this.menu.remove();
      this.menu = null;
    }
    for (const tooltip of this.tooltipItem) {
      tooltip.hide(true);
    }
    this.isMenuDisplay = false;
  }

  destroy() {
    super.destroy();
    this.quill.off(Quill.events.TEXT_CHANGE, this.updateWhenTextChange);
    this.quill.off(tableUpEvent.TABLE_SELECTION_DRAG_START, this.hideWhenSelectionDragStart);
    this.activeTooltip = null;
    for (const tooltip of this.tooltipItem) {
      tooltip.destroy();
    }
    this.tooltipItem = [];
    this.hide();
  }
}
