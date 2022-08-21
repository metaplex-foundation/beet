import { BEET_PACKAGE, FixedSizeBeet, SupportedTypeDefinition } from '../types'

/**
 * De/Serializer for non-values, i.e. `void`, `()`, `undefined` aka the _unit_ type .
 *
 * @category beet/primitive
 */
export const unit: FixedSizeBeet<void> = {
  write: function (_buf: Buffer, _offset: number, _value: void) {},
  read: function (_buf: Buffer, _offset: number): void {
    return undefined
  },
  byteSize: 0,
  description: 'unit',
}

/**
 * @category TypeDefinition
 */
export type UnitExports = keyof typeof import('./unit')
/**
 * @category TypeDefinition
 */
export type UnitTypeMapKey = 'unit'
/**
 * @category TypeDefinition
 */
export type UnitTypeMap = Record<
  UnitTypeMapKey,
  SupportedTypeDefinition & { beet: UnitExports }
>

/**
 * Maps unit beet exports to metadata which describes in which package it
 * is defined as well as which TypeScript type is used to represent the
 * deserialized value in JavaScript.
 *
 * @category TypeDefinition
 */
export const unitTypeMap: UnitTypeMap = {
  unit: {
    beet: 'unit',
    isFixable: false,
    sourcePack: BEET_PACKAGE,
    ts: 'void',
  },
}
