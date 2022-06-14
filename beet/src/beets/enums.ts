import {
  BEET_PACKAGE,
  BEET_TYPE_ARG_INNER,
  DataEnumBeet,
  Enum,
  FixedSizeBeet,
  isFixedSizeBeet,
  SupportedTypeDefinition,
} from '../types'
import { u8 } from './numbers'
import { strict as assert } from 'assert'
import { isBeetStruct } from '../struct'
import { isFixableBeetStruct } from '../struct.fixable'

// -----------------
// Fixed Scalar Enum
// -----------------

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

// -----------------
// Uniform Data Enum
// -----------------

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

// -----------------
// Data Enum
// -----------------
type EnumDataVariant<Kind, Data> = {
  __kind: Kind
} & Data

function enumDataVariantBeet<Kind, T>(
  inner: FixedSizeBeet<T>,
  discriminant: number,
  kind: Kind
): FixedSizeBeet<EnumDataVariant<Kind, T>> {
  return {
    write(buf: Buffer, offset: number, value: T) {
      u8.write(buf, offset, discriminant)
      inner.write(buf, offset + u8.byteSize, value)
    },

    read(buf: Buffer, offset: number) {
      const val: T = inner.read(buf, offset + u8.byteSize)
      return { __kind: kind, ...val }
    },

    byteSize: inner.byteSize + u8.byteSize,
    description: `EnumData<${inner.description}>`,
  }
}

/**
 * De/serializes Data Enums.
 * They are represented as a discriminated unions in TypeScript.
 *
 * NOTE: only structs, i.e. {@link BeetArgsStruct} and
 * {@link FixableBeetArgsStruct} are supported as the data of each enum variant.
 *
 * ## Example
 *
 * ```ts
 * type Simple = {
 *   First: { n1: number }
 *   Second: { n2: number }
 * }
 *
 * const beet = dataEnum<Simple>([
 *   ['First', new BeetArgsStruct<Simple['First']>([['n1', u32]])],
 *   ['Second', new BeetArgsStruct<Simple['Second']>([['n2', u32]])],
 * ])
 * ```
 *
 * @category beet/enum
 * @param variants an array of {@link DataEnumBeet}s each a tuple of `[ kind, data ]`
 */
export function dataEnum<T, Key extends keyof T = keyof T>(
  variants: DataEnumBeet<T, Key>[]
) {
  for (const [_, beet] of variants) {
    // NOTE: tried to enforce this with types but failed to do so for now
    assert(
      isBeetStruct(beet) || isFixableBeetStruct(beet),
      'dataEnum: data beet must be a struct'
    )
  }

  return {
    toFixedFromData(buf: Buffer, offset: number) {
      const discriminant = u8.read(buf, offset)
      const variant = variants[discriminant]
      assert(
        variant != null,
        `Discriminant ${discriminant} out of range for ${variants.length} variants`
      )
      const [__kind, dataBeet] = variant
      const fixed = isFixedSizeBeet(dataBeet)
        ? dataBeet
        : dataBeet.toFixedFromData(buf, offset + 1)

      return enumDataVariantBeet(fixed, discriminant, __kind)
    },

    toFixedFromValue(val: any) {
      if (val.__kind == null) {
        const keys = Object.keys(val).join(', ')
        const validKinds = variants.map(([__kind]) => __kind).join(', ')
        assert.fail(
          `Value with fields [ ${keys} ] is missing __kind, ` +
            `which needs to be set to one of [ ${validKinds} ]`
        )
      }

      const discriminant = variants.findIndex(
        ([__kind]) => __kind === val.__kind
      )
      if (discriminant < 0) {
        const validKinds = variants.map(([__kind]) => __kind).join(', ')
        assert.fail(
          `${val.__kind} is not a valid kind, needs to be one of [ ${validKinds} ]`
        )
      }
      const variant = variants[discriminant]

      const { __kind, ...dataValue } = val
      const [__variantKind, dataBeet] = variant
      const fixed = isFixedSizeBeet(dataBeet)
        ? dataBeet
        : dataBeet.toFixedFromValue(dataValue)
      return enumDataVariantBeet(fixed, discriminant, __variantKind)
    },

    description: `DataEnum<${variants.length} variants>`,
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
