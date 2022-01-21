import { fixBeetFromData, fixBeetFromValue } from './beet'
import { BeetStruct } from './struct'
import { BeetField, FixableBeet, isFixedSizeBeet } from './types'
import { strict as assert } from 'assert'
import { beetBytes, logDebug } from './utils'
import colors from 'ansicolors'
const { brightBlack } = colors

export class FixableBeetStruct<Class, Args = Partial<Class>>
  implements FixableBeet<Class, Args>
{
  /**
   * Creates an instance of the {@link FixableBeetStruct}.
   *
   * @param fields fixed or fixable de/serializers for each field of the {@link Class}
   * @param construct the function that creates an instance of {@link Class}
   * from the args
   * @param description identifies this struct for diagnostics/debugging
   * purposes
   */
  constructor(
    private readonly fields: BeetField<Args, any>[],
    private readonly construct: (args: Args) => Class,
    readonly description = FixableBeetStruct.description
  ) {
    let minByteSize = 0
    if (logDebug.enabled) {
      const flds = fields
        .map(([key, val]: BeetField<Args>) => {
          if (isFixedSizeBeet(val)) {
            minByteSize += val.byteSize
          }
          return `${key}: ${val.description} ${beetBytes(val)}`
        })
        .join('\n  ')
      const bytes = `> ${minByteSize} B`
      logDebug(`struct ${description} {\n  ${flds}\n} ${brightBlack(bytes)}`)
    }
  }

  /**
   * Deserializes an instance of the Class from the provided buffer starting to
   * read at the provided offset.
   *
   * @returns `[instance of Class, offset into buffer after deserialization completed]`
   */
  deserialize(buffer: Buffer, offset: number = 0): [Class, number] {
    return this.toFixedFromData(buffer, offset).deserialize(buffer, offset)
  }

  /**
   * Serializes the provided instance into a new {@link Buffer}
   *
   * **NOTE:** that the `instance` is traversed and each of its fields accessed
   * twice, once to derive a _fixed size_ {@link BeetStruct} and then use it to
   * serialize the `instance`.
   * Therefore ensure that none of the properties that are part of the struct
   * have side effects, i.e. via `Getter`s.
   *
   * @param instance of the struct to serialize
   * @param byteSize allows to override the size fo the created Buffer and
   * defaults to the size of the struct to serialize
   */
  serialize(instance: Args, byteSize?: number): [Buffer, number] {
    return this.toFixedFromValue(instance).serialize(instance, byteSize)
  }

  toFixedFromData(buf: Buffer, offset: number): BeetStruct<Class, Args> {
    let cursor = offset
    const fixedFields = new Array(this.fields.length)

    for (let i = 0; i < this.fields.length; i++) {
      const [key, beet] = this.fields[i]
      const fixedBeet = fixBeetFromData(beet, buf, cursor)
      fixedFields[i] = [key, fixedBeet]
      cursor += fixedBeet.byteSize
    }

    return this.description !== FixableBeetStruct.description
      ? new BeetStruct(fixedFields, this.construct, this.description)
      : new BeetStruct(fixedFields, this.construct)
  }

  toFixedFromValue(args: Args): BeetStruct<Class, Args> {
    const argsKeys = Object.keys(args)
    const fixedFields = new Array(this.fields.length)

    for (let i = 0; i < this.fields.length; i++) {
      const [key, beet] = this.fields[i]
      assert(
        argsKeys.includes(key),
        `Value with keys [ ${argsKeys} ] should include struct key '${key}' but doesn't.`
      )
      const val = args[key]
      const fixedBeet = fixBeetFromValue(beet, val)
      fixedFields[i] = [key, fixedBeet]
    }

    return this.description !== FixableBeetStruct.description
      ? new BeetStruct(fixedFields, this.construct, this.description)
      : new BeetStruct(fixedFields, this.construct)
  }

  static description = 'FixableBeetStruct'
}

/**
 * Convenience wrapper around {@link FixableBeetStruct} which is used for plain JavasScript
 * objects, like are used for option args passed to functions.
 *
 * @category beet/struct
 */
export class FixableBeetArgsStruct<Args> extends FixableBeetStruct<Args, Args> {
  constructor(
    fields: BeetField<Args, any>[],
    description: string = FixableBeetArgsStruct.description
  ) {
    super(fields, (args) => args, description)
  }

  static description = 'FixableBeetArgsStruct'
}
