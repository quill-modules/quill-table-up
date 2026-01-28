import type Quill from 'quill';
import type BaseTheme from 'quill/themes/base';
import type Picker from 'quill/ui/picker';
import type { TableCellInnerFormat } from '../formats';
import type { MenuTooltipInstance, TableMenuCommon } from '../modules';
import type { TableUp } from '../table-up';
import type { blotName, tableUpEvent, tableUpInternal, tableUpSize } from './constants';

export type QuillThemePicker = (Picker & { options: HTMLElement });
export interface QuillTheme extends BaseTheme {
  pickers: QuillThemePicker[];
}
export interface ToolOption {
  name: string;
  icon: string | ((tableModule: TableUp) => HTMLElement);
  tip?: string;
  isColorChoose?: boolean;
  key?: string;
  handle: (this: TableMenuCommon, tableModule: TableUp, selectedTds: TableCellInnerFormat[], e: Event | string | null) => void;
}
export interface ToolOptionBreak {
  name: 'break';
}
export type Tool = ToolOption | ToolOptionBreak;

export interface TableMenuOptions {
  tipText: boolean;
  tools: Tool[];
  localstorageKey: string;
  defaultColorMap: string[];
}
export interface TableSelectionOptions {
  selectColor: string;
}
export interface TableResizeScaleOptions {
  blockSize: number;
  offset: number;
}
export interface TableResizeBoxOptions {
  size: number;
  draggable: boolean;
}
export interface TableCreatorTextOptions {
  fullCheckboxText: string;
  customBtnText: string;
  confirmText: string;
  cancelText: string;
  rowText: string;
  colText: string;
  notPositiveNumberError: string;
  perWidthInsufficient: string;
}
export type TableMenuTexts = Record<string, string>;
export interface TableTextOptions extends TableCreatorTextOptions, TableMenuTexts {
  custom: string;
  clear: string;
  transparent: string;
  perWidthInsufficient: string;
}
export interface TableUpExtraModule extends Constructor<any, [TableUp, Quill, any]> {
  moduleName: string;
}
export interface TableUpModule {
  module: TableUpExtraModule;
  options?: any;
}
export interface TableUpOptions {
  customSelect?: (tableModule: TableUp, picker: QuillThemePicker) => Promise<HTMLElement> | HTMLElement;
  full: boolean;
  fullSwitch: boolean;
  customBtn: boolean;
  texts: TableTextOptions;
  icon: string;
  autoMergeCell: boolean;
  modules: TableUpModule[];
}
export interface TableColValue {
  tableId: string;
  colId: string;
  width: number;
  full?: boolean;
  align?: string;
}
export type TableBodyTag = 'thead' | 'tbody' | 'tfoot';
export interface TableCellValue {
  tableId: string;
  rowId: string;
  colId: string;
  rowspan: number;
  colspan: number;
  style?: string;
  emptyRow?: string[];
  tag?: 'td' | 'th';
  wrapTag?: TableBodyTag;
  fixed?: 'left' | 'right';
}
export interface TableRowValue {
  tableId: string;
  rowId: string;
  wrapTag?: TableBodyTag;
}
export interface TableCaptionValue {
  tableId: string;
  side: 'top' | 'bottom';
}
export interface TableValue {
  tableId: string;
  full?: boolean;
  align?: string;
}

export interface Position { x: number; y: number }
export interface RelactiveRect {
  x: number;
  y: number;
  x1: number;
  y1: number;
  width: number;
  height: number;
}

export interface InternalModule {
  table?: HTMLElement;
  show: () => void;
  hide: () => void;
  update: () => void;
  destroy: () => void;
}
export type Constructor<T = any, U extends Array<any> = any[]> = new (...args: U) => T;
export interface InternalTableSelectionModule extends InternalModule {
  dragging: boolean;
  boundary: RelactiveRect | null;
  selectedTds: TableCellInnerFormat[];
  cellSelect: HTMLElement;
  isDisplaySelection: boolean;
  tableMenu?: InternalModule;
  computeSelectedTds: (
    startPoint: Position,
    endPoint: Position,
  ) => TableCellInnerFormat[];
  setSelectedTds: (tds: TableCellInnerFormat[]) => void;
  updateWithSelectedTds: () => void;
  showDisplay: () => void;
  hideDisplay: () => void;
}
export interface InternalTableMenuModule extends InternalModule {
  isMenuDisplay: boolean;
  activeTooltip: MenuTooltipInstance | null;
}
export type Writable<T> = {
  -readonly [P in keyof T]: T[P];
};
export interface TableConstantsData {
  blotName: Partial<Record<keyof Writable<typeof blotName>, string>>;
  tableUpSize: Partial<typeof tableUpSize>;
  tableUpEvent: Partial<typeof tableUpEvent>;
  tableUpInternal: Partial<typeof tableUpInternal>;
}
