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
export type Enum<T> =
  | { [key: number | string]: string | number | T }
  | number
  | T

function resolveEnumVariant<T>(value: T, isNumVariant: boolean): keyof Enum<T> {
  return (isNumVariant ? `${value}` : value) as keyof Enum<T>
}

/**
 * De/serializer for enums with up to 255 less variants which have no data.
 *
 * @param enumType type of enum to process, i.e. Color or Direction
 *
 * @category beet/enum
 */
export function fixedScalarEnum<T>(
  enumType: Enum<T>
): FixedSizeBeet<Enum<T>, Enum<T>> {
  const keys = Object.keys(enumType)
  return {
    write(buf: Buffer, offset: number, value: T) {
      const isNumVariant = typeof value === 'number'
      const variantKey = resolveEnumVariant(value, isNumVariant)

      if (!keys.includes(variantKey)) {
        assert.fail(
          `${value} should be a variant of the provided enum type, i.e. [ ${Object.values(
            enumType
          ).join(', ')} ], but isn't`
        )
      }

      if (isNumVariant) {
        u8.write(buf, offset, value)
      } else {
        const enumValue = enumType[variantKey] as number
        u8.write(buf, offset, enumValue)
      }
    },

    read(buf: Buffer, offset: number): T {
      const value = u8.read(buf, offset) as T | number
      const isNumVariant = typeof value === 'number'
      const variantKey = resolveEnumVariant(value, isNumVariant)

      if (!keys.includes(variantKey)) {
        assert.fail(
          `${value} should be a of a variant of the provided enum type, i.e. [ ${Object.values(
            enumType
          ).join(', ')} ], but isn't`
        )
      }
      return (isNumVariant ? value : enumType[variantKey]) as T
    },

    byteSize: u8.byteSize,
    description: 'Enum',
  }
}

/**
 * Represents an {@link Enum} type which contains fixed size data and whose
 * data is uniform across all variants.
 *
 * @template Kind the enum variant, i.e. `Color.Red`
 * @template Data the data value, i.e. '#f00'
 *
 * @category beet/composite
 */
export type UniformDataEnum<Kind, Data> = { kind: Kind & number; data: Data }
/**
 * De/Serializes an {@link Enum} that contains a type of data, i.e. a {@link Struct}.
 * The main difference to a Rust enum is that the type of data has to be the
 * same for all enum variants.
 *
 * @template T inner enum data type
 *
 * @param inner the De/Serializer for the data type
 *
 * @category beet/enum
 */
export function uniformDataEnum<Kind, Data>(
  inner: FixedSizeBeet<Data>
): FixedSizeBeet<UniformDataEnum<Kind, Data>> {
  return {
    write: function (
      buf: Buffer,
      offset: number,
      value: UniformDataEnum<Kind, Data>
    ) {
      u8.write(buf, offset, value.kind)
      inner.write(buf, offset + 1, value.data)
    },

    read: function (buf: Buffer, offset: number): UniformDataEnum<Kind, Data> {
      const kind = u8.read(buf, offset) as UniformDataEnum<Kind, Data>['kind']
      const data = inner.read(buf, offset + 1)
      return { kind, data }
    },
    byteSize: 1 + inner.byteSize,
    description: `UniformDataEnum<${inner.description}>`,
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
