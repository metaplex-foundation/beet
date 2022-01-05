import { Beet, BeetField, SupportedTypeDefinition } from './types'
import { strict as assert } from 'assert'
import colors from 'ansicolors'
import { logDebug, logTrace } from './utils'
import {
  CollectionsExports,
  collectionsTypeMap,
  CollectionsTypeMapKey,
} from './collections'
import {
  CompositesExports,
  compositesTypeMap,
  CompositesTypeMapKey,
} from './composites'
import { NumbersExports, numbersTypeMap, NumbersTypeMapKey } from './numbers'

const { brightBlack } = colors

export * from './collections'
export * from './composites'
export * from './numbers'
export * from './types'

/**
 * @category TypeDefinition
 */
export type BeetTypeMapKey =
  | CollectionsTypeMapKey
  | CompositesTypeMapKey
  | NumbersTypeMapKey

/**
 * @category TypeDefinition
 */
export type BeetExports =
  | CollectionsExports
  | CompositesExports
  | NumbersExports

/**
 * Maps all {@link Beet} de/serializers to metadata which describes in which
 * package it is defined as well as which TypeScript type is used to represent
 * the deserialized value in JavaScript.
 *
 * @category TypeDefinition
 */
export const supportedTypeMap: Record<
  BeetTypeMapKey,
  SupportedTypeDefinition & {
    beet: BeetExports
  }
> = {
  ...collectionsTypeMap,
  ...compositesTypeMap,
  ...numbersTypeMap,
}

// -----------------
// Writer
// -----------------
/**
 * Underlying writer used to serialize structs.
 *
 * @private
 * @category beet/struct
 */
export class BeetWriter {
  private buf: Buffer
  private _offset: number
  constructor(byteSize: number) {
    this.buf = Buffer.alloc(byteSize)
    this._offset = 0
  }

  get buffer() {
    return this.buf
  }

  get offset() {
    return this._offset
  }

  private maybeResize(bytesNeeded: number) {
    if (this._offset + bytesNeeded > this.buf.length) {
      assert.fail(
        `We shouldn't ever need to resize, but ${
          this._offset + bytesNeeded
        } > ${this.buf.length}`
      )
      // this.buf = Buffer.concat([this.buf, Buffer.alloc(this.allocateBytes)])
    }
  }

  write<T>(beet: Beet<T>, value: T) {
    this.maybeResize(beet.byteSize)
    beet.write(this.buf, this._offset, value)
    this._offset += beet.byteSize
  }

  writeStruct<T>(instance: T, fields: BeetField<T>[]) {
    for (const [key, beet] of fields) {
      const value = instance[key]
      this.write(beet, value)
    }
  }
}

// -----------------
// Reader
// -----------------
/**
 * Underlying reader used to deserialize structs.
 *
 * @private
 * @category beet/struct
 */
export class BeetReader {
  constructor(private readonly buffer: Buffer, private _offset: number = 0) {}

  get offset() {
    return this._offset
  }

  read<T>(beet: Beet<T>): T {
    const value = beet.read(this.buffer, this._offset)
    this._offset += beet.byteSize
    return value
  }

  readStruct<T>(fields: BeetField<T>[]) {
    const acc: T = <T>{}
    for (const [key, beet] of fields) {
      acc[key] = this.read(beet)
    }
    return acc
  }
}

function bytes(val: { byteSize: number }) {
  return brightBlack(`${val.byteSize} B`)
}

/**
 * Configures a class or any JavaScript object type for de/serialization aka
 * read/write.
 *
 * @template Class the type to produce when deserializing
 * @template Args contains all fields, is typically a subset of Class and is
 * used to construct an instance of it
 *
 * @category beet/struct
 */
export class BeetStruct<Class, Args = Partial<Class>> implements Beet<Class> {
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
    private readonly fields: BeetField<Args>[],
    private readonly construct: (args: Args) => Class,
    readonly description = BeetStruct.description
  ) {
    this.byteSize = this.getByteSize()
    if (logDebug.enabled) {
      const flds = fields
        .map(
          ([key, val]: BeetField<Args>) =>
            `${key}: ${val.description} ${bytes(val)}`
        )
        .join('\n  ')
      logDebug(`struct ${description} {\n  ${flds}\n} ${bytes(this)}`)
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
      this.byteSize
    )
    const writer = new BeetWriter(byteSize)
    writer.writeStruct(instance, this.fields)
    return [writer.buffer, writer.offset]
  }

  private getByteSize() {
    return this.fields.reduce((acc, [_, beet]) => acc + beet.byteSize, 0)
  }

  static description = 'BeetStruct'
}

/**
 * Convenience wrapper around {@link BeetStruct} which is used for plain JavasScript
 * objects, like are used for option args passed to functions.
 *
 * @category beet/struct
 */
export class BeetArgsStruct<Args> extends BeetStruct<Args, Args> {
  constructor(
    fields: BeetField<Args>[],
    description: string = BeetArgsStruct.description
  ) {
    super(fields, (args) => args, description)
  }

  static description = 'BeetArgsStruct'
}
