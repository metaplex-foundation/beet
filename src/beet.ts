import { Beet, BeetField } from './types'
import { strict as assert } from 'assert'
import colors from 'ansicolors'
import { logDebug, logTrace } from './utils'

const { brightBlack } = colors

export * from './collections'
export * from './composites'
export * from './numbers'
export * from './types'

// -----------------
// Writer
// -----------------
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

export class BeetStruct<Class, Args = Partial<Class>> implements Beet<Class> {
  readonly byteSize: number
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

  // TODO: support nested structs by implementing these methods
  read(_buf: Buffer, _offset: number): Class {
    throw new Error('Method not implemented.')
  }

  write(_buf: Buffer, _offset: number, _value: Class): void {
    throw new Error('Method not implemented.')
  }

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
