import test from 'tape'
import { u8, fixedSizeTuple, i16, u32 } from '../../src/beet'
import { checkFixedSerialization } from '../utils'
import fixture from './fixtures/tuples.json'

test('compat fixed size tuples top level: (u8, u8)', (t) => {
  const beet = fixedSizeTuple([u8, u8])
  for (const { value, data } of fixture.u8_u8s) {
    checkFixedSerialization(t, beet, value, data)
  }
  t.end()
})

test('compat fixed size tuples top level: (u8, i16, u32)', (t) => {
  const beet = fixedSizeTuple([u8, i16, u32])
  for (const { value, data } of fixture.u8_i16_u32s) {
    checkFixedSerialization(t, beet, value, data)
  }
  t.end()
})
