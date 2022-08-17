import {
  BEET_PACKAGE,
  FixableBeet,
  FixedSizeBeet,
  SupportedTypeDefinition,
} from '../types'
import { strict as assert } from 'assert'
import { fixBeetFromData, fixBeetFromValue } from '../beet.fixable'

// Tuples are a special kind of composite which can be understood as
// fixed length arrays where each tuple element can have a different data type.
// Since the Tuple type itself dictates the length, and buffer layout, no extra
// information is included in the serialized data.

/**
 * De/Serializes a tuple with all fixed size tuple elements .
 * Since each tuple element can be of a different type not much type safety can
 * be provided here.
 *
 * @param elements the De/Serializer for each tuple element type
 *
 * @category beet/composite
 */
export function fixedSizeTuple<T extends any[]>(
  elements: FixedSizeBeet<any>[]
): FixedSizeBeet<any> {
  const len = elements.length
  const elDescs = elements.map((x) => x.description)
  const byteSizes = elements.map((x) => x.byteSize)
  const byteSize = byteSizes.reduce((acc, x) => acc + x, 0)

  return {
    write: function (buf: Buffer, offset: number, value: T): void {
      assert.equal(
        value.length,
        len,
        `tuple value element size ${value.length} should match len ${len}`
      )
      let cursor = offset
      for (let i = 0; i < len; i++) {
        const v = value[i]
        const beetEl = elements[i]
        beetEl.write(buf, cursor, v)
        cursor += beetEl.byteSize
      }
    },

    read: function (buf: Buffer, offset: number): T {
      const els = []
      let cursor = offset
      for (let i = 0; i < len; i++) {
        const elBeet = elements[i]
        els[i] = elBeet.read(buf, cursor)
        cursor += elBeet.byteSize
      }
      return els as T
    },

    byteSize,
    length: len,
    description: `FixedSizeTuple<${elDescs.join(',')}>[ ${byteSizes.join(
      ', '
    )} ]`,
  }
}

/**
 * De/Serializes a tuple which contains some non-fixed size tuple elements.
 *
 * Since each tuple element can be of a different type not much type safety can
 * be provided here.
 *
 * @param elements the De/Serializer for each tuple element type
 * @category beet/composite
 */
export function tuple<T extends any[]>(
  elements: (FixedSizeBeet<any, any> | FixableBeet<any, any>)[]
): FixableBeet<T> {
  const len = elements.length
  const elDescs = elements.map((x) => x.description)

  return {
    toFixedFromData(buf: Buffer, offset: number): FixedSizeBeet<any> {
      let cursor = offset
      const fixedElements: FixedSizeBeet<T>[] = new Array(len)
      for (let i = 0; i < len; i++) {
        const fixedElement = fixBeetFromData(elements[i], buf, cursor)
        fixedElements[i] = fixedElement
        cursor += fixedElement.byteSize
      }
      return fixedSizeTuple(fixedElements)
    },

    toFixedFromValue(vals: any[]): FixedSizeBeet<any> {
      assert(Array.isArray(vals), `${vals} should be an array of tuple values`)
      assert.equal(
        vals.length,
        len,
        `There should be ${len} tuple values, but there are ${vals.length}`
      )

      const fixedElements: FixedSizeBeet<T>[] = new Array(len)
      for (let i = 0; i < vals.length; i++) {
        const fixedElement = fixBeetFromValue(elements[i], vals[i])
        fixedElements[i] = fixedElement
      }
      return fixedSizeTuple(fixedElements)
    },

    description: `Tuple<${elDescs.join(',')}>`,
  }
}

/**
 * @category TypeDefinition
 */
export type TuplesExports = keyof Omit<
  typeof import('./tuples'),
  'tuplesTypeMap'
>

/**
 * @category TypeDefinition
 */
export type TuplesTypeMapKey = 'FixedSizeTuple' | 'Tuple'

/**
 * @category TypeDefinition
 */
export type TuplesTypeMap = Record<
  TuplesTypeMapKey,
  SupportedTypeDefinition & { beet: TuplesExports }
>

/**
 * Maps tuples beet exports to metadata which describes in which package it
 * is defined as well as which TypeScript type is used to represent the
 * deserialized value in JavaScript.
 *
 * @category TypeDefinition
 */
export const tuplesTypeMap: TuplesTypeMap = {
  Tuple: {
    beet: 'tuple',
    isFixable: true,
    sourcePack: BEET_PACKAGE,
    ts: '[__tuple_elements__]',
  },
  FixedSizeTuple: {
    beet: 'fixedSizeTuple',
    isFixable: false,
    sourcePack: BEET_PACKAGE,
    ts: '[__tuple_elements__]',
  },
}
