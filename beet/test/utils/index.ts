import test from 'tape'
import { inspect } from 'util'
import { FixedSizeBeet } from '../../src/beet'

export function deepLog(obj: any) {
  console.log(inspect(obj, { depth: 15, colors: true, getters: true }))
}

function checkFixedSerialize<T>(
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

function checkFixedDeserialize<T>(
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
