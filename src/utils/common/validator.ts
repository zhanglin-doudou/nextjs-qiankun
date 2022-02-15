import { isEmpty } from 'lodash';

/**
 * 返回false：空对象、空数组、空字符串
 * false 和 0 返回true
 * @param value
 * @returns
 */
export function isValid(value: unknown) {
  return (
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    (typeof value === 'string' && value !== '') ||
    !isEmpty(value)
  );
}
