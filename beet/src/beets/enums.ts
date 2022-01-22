import {
  BEET_PACKAGE,
  BEET_TYPE_ARG_INNER,
  FixedSizeBeet,
  SupportedTypeDefinition,
} from '../types'
import { u8 } from './numbers'
import { strict as assert } from 'assert'

// TypeScript enum type support isn't that great since it really ends up being an Object hash
// when transpiled.
// Therefore we have to jump through some hoops to make all types check out
type Enum<T> = { [key: number | string]: string | number | T } | number | T

/**
 * De/serializer for enums with up to 255 less variants which have no data.
 *
 * @param enumType type of enum to process, i.e. Color or Direction
 */
export function fixedScalarEnum<T>(
  enumType: Enum<T>
): FixedSizeBeet<Enum<T>, Enum<T>> {
  return {
    write(buf: Buffer, offset: number, value: T) {
      const idx = Object.values(enumType).indexOf(value)
      if (idx < 0) {
        assert.fail(
          `${value} should be a variant of the provided enum type, i.e. [ ${Object.values(
            enumType
          ).join(', ')} ], but isn't`
        )
      }

      u8.write(buf, offset, idx)
    },

    read(buf: Buffer, offset: number): T {
      const idx = u8.read(buf, offset)
      const item = Object.values(enumType)[idx]
      if (item == null) {
        assert.fail(
          `${idx} should be a of a variant of the provided enum type, i.e. [ ${Object.values(
            enumType
          ).join(', ')} ], but isn't`
        )
      }
      return item
    },

    byteSize: u8.byteSize,
    description: 'Enum',
  }
}

/**
 * Represents an {@link Enum} type which contains fixed size data.
 *
 * @template Kind the enum variant, i.e. `Color.Red`
 * @template Data the data value, i.e. '#f00'
 *
 * @category beet/composite
 */
export type DataEnum<Kind, Data> = { kind: Kind & number; data: Data }
/**
 * De/Serializes an {@link Enum} that contains a type of data, i.e. a {@link Struct}.
 * The main difference to a Rust enum is that the type of data has to be the
 * same for all enum variants.
 *
 * @template T inner enum data type
 *
 * @param inner the De/Serializer for the data type
 *
 * @category beet/composite
 */
export function dataEnum<Kind, Data>(
  inner: FixedSizeBeet<Data>
): FixedSizeBeet<DataEnum<Kind, Data>> {
  return {
    write: function (buf: Buffer, offset: number, value: DataEnum<Kind, Data>) {
      u8.write(buf, offset, value.kind)
      inner.write(buf, offset + 1, value.data)
    },

    read: function (buf: Buffer, offset: number): DataEnum<Kind, Data> {
      const kind = u8.read(buf, offset) as DataEnum<Kind, Data>['kind']
      const data = inner.read(buf, offset + 1)
      return { kind, data }
    },
    byteSize: 1 + inner.byteSize,
    description: `DataEnum<${inner.description}>`,
  }
}

/**
 * @category TypeDefinition
 */
export type EnumsExports = keyof typeof import('./enums')
/**
 * @category TypeDefinition
 */
export type EnumsTypeMapKey = 'fixedScalarEnum' | 'dataEnum'
/**
 * @category TypeDefinition
 */
export type EnumsTypeMap = Record<
  EnumsTypeMapKey,
  SupportedTypeDefinition & { beet: EnumsExports }
>

/**
 * Maps composite beet exports to metadata which describes in which package it
 * is defined as well as which TypeScript type is used to represent the
 * deserialized value in JavaScript.
 *
 * @category TypeDefinition
 */
export const enumsTypeMap: EnumsTypeMap = {
  fixedScalarEnum: {
    beet: 'fixedScalarEnum',
    isFixable: false,
    sourcePack: BEET_PACKAGE,
    ts: '<TypeName>',
    arg: BEET_TYPE_ARG_INNER,
    pack: BEET_PACKAGE,
  },
  dataEnum: {
    beet: 'dataEnum',
    isFixable: false,
    sourcePack: BEET_PACKAGE,
    ts: 'DataEnum<Kind, Inner>',
    arg: BEET_TYPE_ARG_INNER,
    pack: BEET_PACKAGE,
  },
}
