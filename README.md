# quill-table-up

Enhancement of quill table module

[demo](https://quill-modules.github.io/quill-table-up/)

[quill@1.3.7 table module](https://github.com/quill-modules/quill-table)

- [x] complete UI operation process
- [x] insert/delete row/column/table; merge/split cells
- [x] support all origin quill formats
- [x] control cells width/height/border/background color
- [x] 100 percent table width or fixed pixel width
- [x] line break in cells
- [x] redo and undo
- [x] support whole table align left/center/right
- [x] `<caption>` `<th>` `<thead>` `<tfoot>` support

## Usage

```sh
npm install quill-table-up
```

> the registe module name is used internal. so if you want to change it, place use the function [`updateTableConstants`](https://github.com/quill-modules/quill-table-up?tab=readme-ov-file#change-internal-constants-variable)

```js
import Quill from 'quill';
import TableUp, { defaultCustomSelect, TableAlign, TableMenuContextmenu, TableResizeBox, TableResizeScale, TableSelection, TableVirtualScrollbar } from 'quill-table-up';
import 'quill/dist/quill.snow.css';
import 'quill-table-up/index.css';
// If using the default customSelect option. You need to import this css
import 'quill-table-up/table-creator.css';

Quill.register({ [`modules/${TableUp.moduleName}`]: TableUp }, true);
// or
// Quill.register({ 'modules/table-up': TableUp }, true);

const quill = new Quill('#editor', {
  // ...
  modules: {
    //  ...
    toolbar: [
      // ...
      [ // use picker to enable the customSelect option
        { [TableUp.toolName]: [] }
      ],
    ],
    [TableUp.moduleName]: {
      customSelect: defaultCustomSelect,
      modules: [
        { module: TableVirtualScrollbar },
        { module: TableAlign },
        { module: TableResizeLine },
        { module: TableResizeScale },
        { module: TableSelection },
        { module: TableMenuContextmenu, },
      ],
    },
  },
});
```

## Options

**Full options usage see [demo](https://github.com/quill-modules/quill-table-up/blob/master/docs/index.js#L38)**

| Attribute     | Description                                                                                                                 | Type                                                                            | Default                                    |
| ------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------ |
| full          | if set `true`. width max will be 100%                                                                                       | `boolean`                                                                       | `false`                                    |
| fullSwitch    | enable to choose insert a full width table                                                                                  | `boolean`                                                                       | `true`                                     |
| texts         | the text used to create the table                                                                                           | `TableTextOptions \| ((key: string) => string)`                                 | `defaultTexts`                             |
| customSelect  | display a custom select to custom row and column number add a table. module provides default selector `defaultCustomSelect` | `(tableModule: TableUp, picker: Picker) => Promise<HTMLElement> \| HTMLElement` | -                                          |
| customBtn     | display a custom button to custom row and column number add a table. it only when use `defaultCustomSelect` will effect     | `boolean`                                                                       | `false`                                    |
| icon          | picker svg icon string. it will set with `innerHTML`                                                                        | `string`                                                                        | `origin table icon`                        |
| autoMergeCell | empty row or column will auto merge to one                                                                                  | `boolean`                                                                       | `true`                                     |
| modules       | the module plugin to help user control about table operate. see [`Export Internal Module`](#export-internal-module)         | `[]`                                                                            | `{ module: Contstructor, options: any }[]` |

> I'm not suggest to use `TableVirtualScrollbar` and `TableResizeLine` at same time, because it have a little conflict when user hover on it. Just like the first editor in [demo](https://quill-modules.github.io/quill-table-up/)

> If you doesn't use `TableVirtualScrollbar`, you may need to set css `.ql-editor .ql-table-wrapper { scrollbar-width: auto; }` to display the browser origin scrollbar.

<details>
  <summary> default value </summary>

```ts
const defaultTexts = {
  fullCheckboxText: 'Insert full width table',
  customBtnText: 'Custom',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  rowText: 'Row',
  colText: 'Column',
  notPositiveNumberError: 'Please enter a positive integer',
  custom: 'Custom',
  clear: 'Clear',
  transparent: 'Transparent',
  perWidthInsufficient: 'The percentage width is insufficient. To complete the operation, the table needs to be converted to a fixed width. Do you want to continue?',

  InsertTop: 'Insert a row above',
  InsertRight: 'Insert a column right',
  InsertBottom: 'Insert a row below',
  InsertLeft: 'Insert a column Left',
  MergeCell: 'Merge Cell',
  SplitCell: 'Split Cell',
  DeleteRow: 'Delete Row',
  DeleteColumn: 'Delete Column',
  DeleteTable: 'Delete table',
  BackgroundColor: 'Set background color',
  BorderColor: 'Set border color',
  SwitchWidth: 'Switch table width',
  InsertCaption: 'Insert table caption',
  ToggleTdBetweenTh: 'Toggle td between th',
};
```

</details>

### `texts` Dynamic Usage

You can pass `texts` as a function.\
When internal UI reads a text, it will call `texts(key)` and use the returned string.

```ts
let locale: 'en' | 'zh' = 'en';

const textMap = {
  en: {
    customBtnText: 'Custom',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
  },
  zh: {
    customBtnText: '自定义',
    confirmText: '确认',
    cancelText: '取消',
  },
} as const;

const quill = new Quill('#editor', {
  modules: {
    [TableUp.moduleName]: {
      customSelect: defaultCustomSelect,
      customBtn: true,
      texts: key => textMap[locale][key as keyof typeof textMap.en] || '',
      modules: [
        { module: TableSelection },
        { module: TableMenuContextmenu },
      ],
    },
  },
});

// switch language
locale = 'zh';
await quill.getModule(TableUp.moduleName).refreshUI();
```

`refreshUI()` will rebuild table-up UI and read latest text values.

## Export Internal Module

### TableSelection

The table cell selection handler

#### Options

| Attribute   | Description           | Type     | Default   |
| ----------- | --------------------- | -------- | --------- |
| selectColor | selector border color | `string` | `#0589f3` |

### TableResizeLine / TableResizeBox

The table cell resize handler

#### TableResizeBox Options

| Attribute | Description                                       | Type      | Default |
| --------- | ------------------------------------------------- | --------- | ------- |
| size      | bounding box size(px)                             | `number`  | `12`    |
| draggable | allow drag bounding box head to sort content cell | `boolean` | `true`  |

### TableMenuContextmenu / TableMenuSelect

The table operate menu

> This module needs to be used together with `TableSelection`

#### Options

| Attribute       | Description                                                                                                                                                                  | Type         | Default                 |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------------------- |
| tipText         | when `tableMenuClass` set `TableUp.TableMenuSelect`, display tip text when hover icon. when `tableMenuClass` set `TableUp.TableMenuContextmenu`, display tip text after icon | `boolean`    | `true`                  |
| localstorageKey | used color save localstorage key                                                                                                                                             | `string`     | `__table-bg-used-color` |
| tools           | menu items                                                                                                                                                                   | `Tool[]`     | `defaultTools`          |
| defaultColorMap | color map                                                                                                                                                                    | `string[][]` | in source code          |

<details>
  <summary> types and default value </summary>

```ts
interface ToolOption {
  name: string;
  icon: string | ((tableModule: TableUp) => HTMLElement);
  tip?: string;
  isColorChoose?: boolean; // trigger a color picker first. need set `key`
  key?: string; // the style name to set on td.
  handle: (this: TableMenu, tableModule: TableUp, selectedTds: TableCellInnerFormat[], e: Event | string) => void;
}
interface ToolOptionBreak {
  name: 'break';
}
type Tool = ToolOption | ToolOptionBreak;

const tableMenuTools: Record<string, Tool> = {
  Break: {
    name: 'break',
  },
  CopyCell: {
    name: 'CopyCell',
    tip: 'Copy cell',
    icon: Copy,
    handle: (tableModule, selectedTds) => {},
  },
  CutCell: {
    name: 'CutCell',
    tip: 'Cut cell',
    icon: Cut,
    handle: (tableModule, selectedTds) => {},
  },
  InsertTop: {
    name: 'InsertTop',
    icon: InsertTop,
    tip: 'Insert row above',
    handle: (tableModule, selectedTds) => {},
  },
  InsertRight: {
    name: 'InsertRight',
    icon: InsertRight,
    tip: 'Insert column right',
    handle: (tableModule, selectedTds) => {},
  },
  InsertBottom: {
    name: 'InsertBottom',
    icon: InsertBottom,
    tip: 'Insert row below',
    handle: (tableModule, selectedTds) => {},
  },
  InsertLeft: {
    name: 'InsertLeft',
    icon: InsertLeft,
    tip: 'Insert column Left',
    handle: (tableModule, selectedTds) => {},
  },
  MergeCell: {
    name: 'MergeCell',
    icon: MergeCell,
    tip: 'Merge Cell',
    handle: (tableModule, selectedTds) => {},
  },
  SplitCell: {
    name: 'SplitCell',
    icon: SplitCell,
    tip: 'Split Cell',
    handle: (tableModule, selectedTds) => {},
  },
  DeleteRow: {
    name: 'DeleteRow',
    icon: RemoveRow,
    tip: 'Delete Row',
    handle: (tableModule, selectedTds) => {},
  },
  DeleteColumn: {
    name: 'DeleteColumn',
    icon: RemoveColumn,
    tip: 'Delete Column',
    handle: (tableModule, selectedTds) => {},
  },
  DeleteTable: {
    name: 'DeleteTable',
    icon: RemoveTable,
    tip: 'Delete table',
    handle: (tableModule, selectedTds) => {},
  },
  BackgroundColor: {
    name: 'BackgroundColor',
    icon: Background,
    isColorChoose: true,
    tip: 'Set background color',
    key: 'background-color',
    handle: (tableModule, selectedTds, color) => {},
  },
  BorderColor: {
    name: 'BorderColor',
    icon: Border,
    isColorChoose: true,
    tip: 'Set border color',
    key: 'border-color',
    handle: (tableModule, selectedTds, color) => {},
  },
  SwitchWidth: {
    name: 'SwitchWidth',
    icon: AutoFull,
    tip: 'Switch table width',
    handle: (tableModule) => {},
  },
  InsertCaption: {
    name: 'InsertCaption',
    icon: TableHead,
    tip: 'Insert table caption',
    handle: (tableModule) => {},
  },
  ToggleTdBetweenTh: {
    name: 'ToggleTdBetweenTh',
    icon: ConvertCell,
    tip: 'Toggle td between th',
    handle: (tableModule, selectedTds) => {},
  },
  ConvertTothead: {
    name: 'ConvertTothead',
    icon: ConvertCell,
    tip: 'Convert to thead',
    handle: (tableModule, selectedTds) => {},
  },
  ConvertTotfoot: {
    name: 'ConvertTotfoot',
    icon: ConvertCell,
    tip: 'Convert to tfoot',
    handle: (tableModule, selectedTds) => {},
  },
};
const defaultTools = [
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
];
```

</details>

### TableResizeScale

Equal scale table cell handler

#### Options

| Attribute | Description                   | Type     | Default |
| --------- | ----------------------------- | -------- | ------- |
| blockSize | resize handle block size      | `number` | `12`    |
| offset    | resize handle offset to table | `number` | `6`     |

### TableAlign

The table alignment tool

### TableVirtualScrollbar

The table virtual scrollbar

## Migrate to 3.x

In version 3.x, only changed the way options are passed in, the relevant additional modules are used in the `modules` option. e.g.

```ts
new Quill('#editor', {
  theme: 'snow',
  modules: {
    toolbar: toolbarConfig,
    [TableUp.moduleName]: {
      customSelect: defaultCustomSelect,
      customBtn: true,
      modules: [
        { module: TableVirtualScrollbar },
        { module: TableAlign },
        { module: TableResizeLine },
        { module: TableResizeScale, options: { blockSize: 12, }, },
        { module: TableSelection, options: { selectColor: '#00ff8b4d', }, },
        {
          module: TableMenuContextmenu,
          options: {
            localstorageKey: 'used-color',
            tipText: true,
            tools: [],
            defaultColorMap: [],
          },
        },
      ],
    },
  },
});
```

You can use `quill.getModule(TableUp.moduleName).getModule(TableSelection.moduleName)` to get the TableSelection instance in the TableUp

### Other

- add new attributes `tag` and `wrap-tag` in `table-up-cell-inner` which to represent parent label types

## Overrides

If you need to rewrite extends from quill `Block` or `Scroll` blot. you need to use `Quill.import()` after `TableUp` registed. beacuse module internal rewrite some functions, but those change only effect formats about table.

`Header`, `List'`, `Blockquote` and `CodeBlock` have been overrides. If you need to rewrite them, you need to rewrite them before `TableUp` registed.

Please read [source code](https://github.com/quill-modules/quill-table-up/tree/master/src/formats/overrides) to know those change.

```ts
import { BlockOverride, ScrollOverride, } from 'quill-table-up';

class ScrollBlot extends ScrollOverride {
  // ...
}
```

## Other

### Change Internal Constants Variable

If it's not necessary, you should import constants variable from `quill-table-up` directly but not edit it.

```ts
import { blotName, tableUpEvent, tableUpInternal, tableUpSize, } from 'quill-table-up';
```

<hr>

You can change internal constants variable by importing `updateTableConstants` from `quill-table-up` and call it before `TableUp` registed.

It helps to migrate from other table modules with the same data structure.

- [full variable demo](https://github.com/quill-modules/quill-table-up/blob/master/docs/update-constants.js)
- [change blot name that in delta demo](https://github.com/quill-modules/quill-table-up/blob/master/docs/update-formats-value.js)

If you change the `TableWrapperFormat` blot name, you also need to add new css style to make toolbar icon have correct style.

```css
/* change 'table-up' to your new blot name */
.ql-toolbar .ql-picker:not(.ql-color-picker):not(.ql-icon-picker).ql-table-up {
  width: 28px;
}
.ql-toolbar .ql-picker:not(.ql-color-picker):not(.ql-icon-picker).ql-table-up .ql-picker-label {
  padding: 2px 4px;
}
.ql-toolbar .ql-picker:not(.ql-color-picker):not(.ql-icon-picker).ql-table-up .ql-picker-label svg {
  position: static;
  margin-top: 0;
}
```
