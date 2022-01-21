import { FixedSizeBeet } from '../types'
import { u8 } from './numbers'
import { strict as assert } from 'assert'

type Enum = { [key: number]: string | number } | string | number

/**
 * De/serializer for enums with up to 255 data less variants.
 *
 * @param enumType type of enum to process, i.e. Color or Direction
 */
export function simpleEnum<T extends Enum, V = T>(
  enumType: T
): FixedSizeBeet<T, V> {
  return {
    write(buf: Buffer, offset: number, value: V) {
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
