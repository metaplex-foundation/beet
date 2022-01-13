import { strict as assert } from 'assert'
import { FixedSizeBeet, FixedBeetField } from './types'

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

  write<T>(beet: FixedSizeBeet<T>, value: T) {
    this.maybeResize(beet.byteSize)
    beet.write(this.buf, this._offset, value)
    this._offset += beet.byteSize
  }

  writeStruct<T>(instance: T, fields: FixedBeetField<T>[]) {
    for (const [key, beet] of fields) {
      const value = instance[key]
      this.write(beet, value)
    }
  }
}

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

  read<T>(beet: FixedSizeBeet<T>): T {
    const value = beet.read(this.buffer, this._offset)
    this._offset += beet.byteSize
    return value
  }

  readStruct<T>(fields: FixedBeetField<T>[]) {
    const acc: T = <T>{}
    for (const [key, beet] of fields) {
      acc[key] = this.read(beet)
    }
    return acc
  }
}
