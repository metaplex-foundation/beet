import test from 'tape'
import {
  u8,
  array,
  i32,
  fixedSizeTuple,
  i16,
  u32,
  tuple,
  utf8String,
  i8,
  u16,
} from '../../src/beet'
import { checkFixedSerialization } from '../utils'
import fixture from './fixtures/tuples.json'

// -----------------
// Fixed Size
// -----------------
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

// -----------------
// Fixable Size
// -----------------
test('compat fixable tuples top level: (u8, string)', (t) => {
  const beet = tuple([u8, utf8String])
  for (const { value, data } of fixture.u8_strings) {
    const fixedBeetFromData = beet.toFixedFromData(Buffer.from(data), 0)
    checkFixedSerialization(t, fixedBeetFromData, value, data)

    const fixedBeetFromValue = beet.toFixedFromValue(value)
    checkFixedSerialization(t, fixedBeetFromValue, value, data)
  }
  t.end()
})

test('compat fixable tuples top level: (string, u16)', (t) => {
  const beet = tuple([utf8String, u16])
  for (const { value, data } of fixture.string_u16s) {
    const fixedBeetFromData = beet.toFixedFromData(Buffer.from(data), 0)
    checkFixedSerialization(t, fixedBeetFromData, value, data)

    const fixedBeetFromValue = beet.toFixedFromValue(value)
    checkFixedSerialization(t, fixedBeetFromValue, value, data)
  }
  t.end()
})

test('compat fixable tuples top level: (u8, i32[] ,i8)', (t) => {
  const beet = tuple([u8, array(i32), i8])
  for (const { value, data } of fixture.u8_vec_i32s_i8) {
    const fixedBeetFromData = beet.toFixedFromData(Buffer.from(data), 0)
    checkFixedSerialization(t, fixedBeetFromData, value, data)

    const fixedBeetFromValue = beet.toFixedFromValue(value)
    checkFixedSerialization(t, fixedBeetFromValue, value, data)
  }
  t.end()
})

// -----------------
// Nested
// -----------------
test('compat nested tuples: Vec<(u8, u8)>', (t) => {
  const beet = array(fixedSizeTuple([u8, u8]))
  for (const { value, data } of fixture.vec_u8_u8s) {
    const fixedBeetFromData = beet.toFixedFromData(Buffer.from(data), 0)
    checkFixedSerialization(t, fixedBeetFromData, value, data)

    const fixedBeetFromValue = beet.toFixedFromValue(value)
    checkFixedSerialization(t, fixedBeetFromValue, value, data)
  }
  t.end()
})

test('compat nested tuples: Vec<(u8, string)>', (t) => {
  const beet = array(tuple([u8, utf8String]))
  for (const { value, data } of fixture.vec_u8_strings) {
    const fixedBeetFromData = beet.toFixedFromData(Buffer.from(data), 0)
    checkFixedSerialization(t, fixedBeetFromData, value, data)

    const fixedBeetFromValue = beet.toFixedFromValue(value)
    checkFixedSerialization(t, fixedBeetFromValue, value, data)
  }
  t.end()
})
