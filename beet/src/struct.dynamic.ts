import { BeetStruct } from './struct'
import { isFixedRecursively, toFixed } from './beet.dynamic'
import { BeetField, FixedBeetField } from './types'
import { bytes, dynamicBytes, logDebug } from './utils'
import { strict as assert } from 'assert'

const LOG_LENGTHS = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]

export class DynamicBeetStruct<Class, Args = Partial<Class>> {
  /**
   * Creates an instance of the DynamicBeetStruct.
   *
   * @param fields de/serializers for each field of the {@link Class}
   * @param construct the function that creates an instance of {@link Class}
   * from the args
   * @param description identifies this struct for diagnostics/debugging
   * purposes
   */
  constructor(
    private readonly fields: BeetField<Args, any>[],
    private readonly construct: (args: Args) => Class,
    readonly description = DynamicBeetStruct.description
  ) {
    if (logDebug.enabled) {
      let byteSize = 0
      const flds = fields
        .map(([key, val]: BeetField<Args, any>) => {
          if (isFixedRecursively(val)) {
            byteSize += val.byteSize
            return `${key}: ${val.description} ${bytes(val)}`
          }
          val = toFixed(val, LOG_LENGTHS)
          byteSize += val.byteSize
          return `${key}: ${val.description} ${dynamicBytes(val)}`
        })
        .join('\n  ')
      logDebug(
        `struct ${description} {\n  ${flds}\n} ${bytes({ byteSize })} (minimum)`
      )
    }
  }

  toFixed(
    lengthsMap: Map<keyof Args, number[]>
  ): BeetStruct<Class, Args> | null {
    const fixedFields: FixedBeetField<Args>[] = this.fields.map(
      ([key, val]) => {
        const lengths = lengthsMap.get(key)
        if (lengths != null) {
          const fixedVal = toFixed(val, lengths)
          return [key, fixedVal]
        }
        if (isFixedRecursively(val)) {
          return [key, val]
        }
        assert.fail(
          `Field: ${key}: ${val.description} is not fixed but is missing a lengths entry in the map`
        )
      }
    )
    return new BeetStruct(
      fixedFields,
      this.construct,
      `Fixed${this.description}`
    )
  }

  static description = 'DynamicBeetStruct'
}

/**
 * Convenience wrapper around {@link DynamicBeetStruct} which is used for plain JavasScript
 * objects, like are used for option args passed to functions.
 *
 * @category beet/struct
 */
export class DynamicBeetArgsStruct<Args> extends DynamicBeetStruct<Args, Args> {
  constructor(
    fields: BeetField<Args, any>[],
    description: string = DynamicBeetArgsStruct.description
  ) {
    super(fields, (args) => args, description)
  }

  static description = 'DynamicBeetArgsStruct'
}
