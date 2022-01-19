import BN from 'bn.js'
import test from 'tape'
import { u128, u8, utf8String } from '../../src/beet'
import { checkFixedSerialization } from '../utils'
import fixture from './fixtures/simple.json'

test('compat simple: strings', (t) => {
  const beet = utf8String
  for (const { value, data } of fixture.strings) {
    checkFixedSerialization(t, beet.toFixedFromValue(value), value, data)
    checkFixedSerialization(
      t,
      beet.toFixedFromData(Buffer.from(data), 0),
      value,
      data
    )
  }
  t.end()
})

test('compat simple: u8s', (t) => {
  const fixedBeet = u8
  for (const { value, data } of fixture.u8s) {
    checkFixedSerialization(t, fixedBeet, value, data)
  }
  t.end()
})

test('compat simple: u128s', (t) => {
  const fixedBeet = u128
  for (const { value, data } of fixture.u128s) {
    const bnVal = new BN(value)
    const buf = Buffer.alloc(fixedBeet.byteSize)
    fixedBeet.write(buf, 0, bnVal)
    t.deepEqual(buf.toJSON().data, data, `serialize: '${value}'`)

    const actual: BN = fixedBeet.read(Buffer.from(data), 0) as BN
    t.ok(actual.eq(bnVal), `deserialize: '${value}'`)
  }
  t.end()
})
