import { isValidCellspan } from '../utils';

export const getValidCellspan = (value: unknown) => isValidCellspan(value) ? value : 1;
export function isSameCellValue(value1: Record<string, any>, value2: Record<string, any>) {
  return Object.keys(value1).every(key => JSON.stringify(value1[key]) === JSON.stringify(value2[key]));
}
export function fixedValueValidate(value?: string | null) {
  return !!(value && ['left', 'right'].includes(value));
}
