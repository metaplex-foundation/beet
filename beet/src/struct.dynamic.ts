import { BeetStruct } from './struct'
import { isFixedRecursively, toFixed } from './beet.dynamic'
import {
  BeetField,
  DynamicSizeBeet,
  FixedBeetField,
  FixedSizeBeet,
} from './types'
import { beetBytes, bytes, logDebug } from './utils'
import { strict as assert } from 'assert'

// The below are used to provide element count of `1` wherever one is required in order
// to allow logging a dynamically sized struct before we know those counts
const LOG_LENGTHS = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
const LOG_ID = '___LOGGING___'
const LMAP = new Map().set(LOG_ID, LOG_LENGTHS.slice())
const LMAPS = [LMAP, LMAP, LMAP, LMAP, LMAP, LMAP, LMAP, LMAP, LMAP, LMAP, LMAP]

export class DynamicSizeBeetStruct<Class, Args = Partial<Class>>
  implements DynamicSizeBeet<Class, Args>
{
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
    readonly description = DynamicSizeBeetStruct.description
  ) {
    if (logDebug.enabled) {
      let byteSize = 0
      const flds = fields
        .map(([key, val]: BeetField<Args, any>) => {
          if (isFixedRecursively(val)) {
            byteSize += val.byteSize
            return `${key}: ${val.description} ${beetBytes(val)}`
          }
          val = toFixed(val, LOG_LENGTHS.slice(), LMAPS)
          byteSize += val.byteSize
          return `${key}: ${val.description} ${beetBytes(val)}`
        })
        .join('\n  ')
      logDebug(
        `struct ${description} {\n  ${flds}\n} ${bytes(byteSize)} (minimum)`
      )
    }
  }

  // TODO(thlorenz): fix types so we don't need this
  // @ts-ignore
  toFixed: (len: number) => FixedSizeBeet<Class, Args>

  toFixedStruct(
    beetLengths: number[],
    structMaps: Map<string, number[]>[] = []
  ): BeetStruct<Class, Args> {
    return toFixed(this, beetLengths, structMaps) as BeetStruct<Class, Args>
  }

  toFixedFromMap(
    lengthsMap: Map<keyof Args | typeof LOG_ID, number[]>
  ): BeetStruct<Class, Args> {
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
        // Only present when logging (see constructor)
        const logLengths = lengthsMap.get(LOG_ID)
        if (logLengths != null) {
          const fixedVal = toFixed(val, logLengths.slice(0))
          return [key, fixedVal]
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
 * Convenience wrapper around {@link DynamicSizeBeetStruct} which is used for plain JavasScript
 * objects, like are used for option args passed to functions.
 *
 * @category beet/struct
 */
export class DynamicBeetArgsStruct<Args> extends DynamicSizeBeetStruct<
  Args,
  Args
> {
  constructor(
    fields: BeetField<Args, any>[],
    description: string = DynamicBeetArgsStruct.description
  ) {
    super(fields, (args) => args, description)
  }

  static description = 'DynamicBeetArgsStruct'
}
