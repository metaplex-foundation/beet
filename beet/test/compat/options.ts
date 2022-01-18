import test from 'tape'
import { coption, u8, utf8String } from '../../src/beet'
import { checkFixedSerialization } from '../utils'
import fixture from './fixtures/options.json'

test('compat options: u8s', (t) => {
  const beet = coption(u8)
  for (const { value, data } of fixture.u8s) {
    const fixedBeet = beet.toFixedFromData(Buffer.from(data), 0)
    checkFixedSerialization(t, fixedBeet, value, data)
  }
  t.end()
})

test('compat options: strings', (t) => {
  const beet = coption(utf8String)
  for (const { value, data } of fixture.strings) {
    const fixedBeet = beet.toFixedFromData(Buffer.from(data), 0)
    checkFixedSerialization(t, fixedBeet, value, data)
  }
  t.end()
})
