import test from 'tape'
import { inspect } from 'util'
import { Beet, FixableBeet, FixedSizeBeet } from '../../src/beet'

export function deepLog(obj: any) {
  console.log(inspect(obj, { depth: 15, colors: true, getters: true }))
}

export function deepLogBeet(struct: Beet<any, any>) {
  // @ts-ignore accessing private fields
  if (typeof struct.fields === 'undefined') {
    deepLog(struct)
    return
  }
  // @ts-ignore accessing private fields
  for (const field of struct.fields) {
    const [, beet] = field
    const { write, read, ...rest } = beet
    // @ts-ignore incomplete field on purpose
    field[1] = rest
  }
  // @ts-ignore construct not always present
  const { construct, ...rest } = struct
  deepLog(rest)
}

export function checkFixedSerialize<T>(
  t: test.Test,
  fixedBeet: FixedSizeBeet<T>,
  value: T,
  data: number[],

  description: string
) {
  const buf = Buffer.alloc(fixedBeet.byteSize)
  fixedBeet.write(buf, 0, value)
  t.deepEqual(buf.toJSON().data, data, `serialize: '${description}'`)
}

export function checkFixedDeserialize<T>(
  t: test.Test,
  fixedBeet: FixedSizeBeet<T>,
  value: T,
  data: number[],
  description: string
) {
  const actual = fixedBeet.read(Buffer.from(data), 0)
  t.deepEqual(actual, value, `deserialize: '${description}'`)
}

export function checkFixedSerialization<T>(
  t: test.Test,
  fixedBeet: FixedSizeBeet<T>,
  value: T,
  data: number[],
  description = `${value}`
) {
  checkFixedSerialize(t, fixedBeet, value, data, description)
  checkFixedDeserialize(t, fixedBeet, value, data, description)
}

export function checkFixableFromDataSerialization<T>(
  t: test.Test,
  fixabledBeet: FixableBeet<T>,
  value: T,
  data: number[],
  description = `${value}`
) {
  const fixedBeet = fixabledBeet.toFixedFromData(Buffer.from(data), 0)
  checkFixedSerialize(t, fixedBeet, value, data, description)
  checkFixedDeserialize(t, fixedBeet, value, data, description)
}

export function checkFixableFromValueSerialization<T>(
  t: test.Test,
  fixabledBeet: FixableBeet<T>,
  value: T,
  data: number[],
  description = `${value}`
) {
  const fixedBeet = fixabledBeet.toFixedFromValue(value)
  checkFixedSerialize(t, fixedBeet, value, data, description)
  checkFixedDeserialize(t, fixedBeet, value, data, description)
}
