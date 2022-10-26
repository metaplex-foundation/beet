import { BeetReader, BeetWriter } from './read-write'
import { FixedBeetField, ScalarFixedSizeBeet } from './types'
import { beetBytes, logDebug, logTrace } from './utils'

/**
 * Configures a class or any JavaScript object type for de/serialization aka
 * read/write. All fields of that class have to be of fixed size.
 * If a field requires a {@link FixableBeet} use the {@link FixableBeetStruct}
 * instead.
 *
 * @template Class the type to produce when deserializing
 * @template Args contains all fields, is typically a subset of Class and is
 * used to construct an instance of it
 *
 * @category beet/struct
 */
export class BeetStruct<Class, Args = Partial<Class>>
  implements ScalarFixedSizeBeet<Class, Args>
{
  readonly byteSize: number
  /**
   * Creates an instance of the BeetStruct.
   *
   * @param fields de/serializers for each field of the {@link Class}
   * @param construct the function that creates an instance of {@link Class}
   * from the args
   * @param description identifies this struct for diagnostics/debugging
   * purposes
   */
  constructor(
    readonly fields: FixedBeetField<Args>[],
    private readonly construct: (args: Args) => Class,
    readonly description = BeetStruct.description
  ) {
    this.byteSize = this.getByteSize()
    if (logDebug.enabled) {
      const flds = fields
        .map(
          ([key, val]: FixedBeetField<Args>) =>
            `${String(key)}: ${val.description} ${beetBytes(val)}`
        )
        .join('\n  ')
      logDebug(`struct ${description} {\n  ${flds}\n} ${beetBytes(this)}`)
    }
  }

  /**
   * Along with `write` this allows structs to be treated as {@link Beet}s and
   * thus supports composing/nesting them the same way.
   * @private
   */
  read(buf: Buffer, offset: number): Class {
    const [value] = this.deserialize(buf, offset)
    return value
  }

  /**
   * Along with `read` this allows structs to be treated as {@link Beet}s and
   * thus supports composing/nesting them the same way.
   * @private
   */
  write(buf: Buffer, offset: number, value: Args): void {
    const [innerBuf, innerOffset] = this.serialize(value)
    innerBuf.copy(buf, offset, 0, innerOffset)
  }

  /**
   * Deserializes an instance of the Class from the provided buffer starting to
   * read at the provided offset.
   *
   * @returns `[instance of Class, offset into buffer after deserialization completed]`
   */
  deserialize(buffer: Buffer, offset: number = 0): [Class, number] {
    if (logTrace.enabled) {
      logTrace(
        'deserializing [%s] from %d bytes buffer',
        this.description,
        buffer.byteLength
      )
      logTrace(buffer)
      logTrace(buffer.toJSON().data)
    }
    const reader = new BeetReader(buffer, offset)
    const args = reader.readStruct(this.fields)
    return [this.construct(args), reader.offset]
  }

  /**
   * Serializes the provided instance into a new {@link Buffer}
   *
   * @param instance of the struct to serialize
   * @param byteSize allows to override the size fo the created Buffer and
   * defaults to the size of the struct to serialize
   */
  serialize(instance: Args, byteSize = this.byteSize): [Buffer, number] {
    logTrace(
      'serializing [%s] %o to %d bytes buffer',
      this.description,
      instance,
      byteSize
    )
    const writer = new BeetWriter(byteSize)
    writer.writeStruct(instance, this.fields)
    return [writer.buffer, writer.offset]
  }

  /**
   * Get the offset of a structure field.
   *
   * @param fieldName the structure field name of interest.
   * @returns the offset in bytes to the start of `fieldName`
   * within the structure. Throw an error if `fieldName` is not a field
   * within the structure.
   */
  offsetOf(fieldName: string): number  {
    let offset = 0;
    for (const fd of this.fields) {
      if (fd[0] === fieldName) {
        return offset;
      }
      offset += fd[1].byteSize;
    }
    throw new Error(`The field is missing: ${fieldName}`)
  }
  
  private getByteSize() {
    return this.fields.reduce((acc, [_, beet]) => acc + beet.byteSize, 0)
  }

  static description = 'BeetStruct'

  static TYPE = 'BeetStruct'

  get type() {
    return BeetStruct.TYPE
  }
}

export function isBeetStruct(beet: any): beet is BeetStruct<any, any> {
  return beet.type === BeetStruct.TYPE
}

/**
 * Convenience wrapper around {@link BeetStruct} which is used for plain JavasScript
 * objects, like are used for option args passed to functions.
 *
 * @category beet/struct
 */
export class BeetArgsStruct<Args> extends BeetStruct<Args, Args> {
  constructor(
    fields: FixedBeetField<Args>[],
    description: string = BeetArgsStruct.description
  ) {
    super(fields, (args) => args, description)
  }

  static description = 'BeetArgsStruct'
}
