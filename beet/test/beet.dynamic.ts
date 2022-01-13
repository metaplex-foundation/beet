import spok from 'spok'
import test from 'tape'
import {
  dynamicSizeArray,
  dynamicSizeUtf8String,
  toFixed,
} from '../src/beet.dynamic'
import { coption } from '../src/beets/composites'
import {
  bool,
  i16,
  i32,
  i64,
  u128,
  u256,
  u32,
  u512,
  u64,
  u8,
} from '../src/beets/numbers'
import { Beet, bignum } from '../src/types'

test('toFixed: fixed primitives are already fixed', (t) => {
  const beets = <Beet<number | bignum>[]>[u8, u128, u256, u512, i16, i32, bool]
  for (const beet of beets) {
    const fixed = toFixed(beet, [])
    t.equal(fixed, beet, beet.description)
  }
  t.end()
})

test('toFixed: dynamicSizeArray<u8>(2)', (t) => {
  const beet = dynamicSizeArray(u8)
  const fixed = toFixed(beet, [2])
  spok(t, fixed, {
    byteSize: 4 + 2 * 1,
    description: 'Array<u8>(2)',
  })
  t.end()
})

test('toFixed: dynamicSizeArray<u32>(1)', (t) => {
  const beet = dynamicSizeArray(u32)
  const fixed = toFixed(beet, [1])
  spok(t, fixed, {
    byteSize: 4 + 4,
    description: 'Array<u32>(1)',
  })
  t.end()
})

test('toFixed: dynamicSizeArray<i64>(10)', (t) => {
  const beet = dynamicSizeArray(i64)
  const fixed = toFixed(beet, [10])
  spok(t, fixed, {
    byteSize: 4 + 10 * 8,
    description: 'Array<i64>(10)',
  })
  t.end()
})

test('toFixed: dynamicSizeArray<coption<u8>>(2)', (t) => {
  const beet = dynamicSizeArray(coption(u8))
  const fixed = toFixed(beet, [2])
  spok(t, fixed, {
    byteSize: 4 + (4 + 1) * 2,
    description: 'Array<COption<u8>>(2)',
  })
  t.end()
})

test('toFixed: coption<dynamicSizeArray<u8>>(2)', (t) => {
  const beet = coption(dynamicSizeArray(u8))
  const fixed = toFixed(beet, [2])
  spok(t, fixed, {
    byteSize: 4 + 4 + 2 * 1,
    description: 'COption<Array<u8>(2)>',
  })
  t.end()
})

test('toFixed: dynamicSizeArray<coption(dynamicSizeArray(u64))>([3, 4])', (t) => {
  // This means I have 3 elements which each contain an option of an array with 4 u8s each
  const innerArray: Beet<bignum[], bignum[]> = dynamicSizeArray<bignum>(u64)
  const beet = dynamicSizeArray(coption(innerArray))
  const fixed = toFixed(beet, [3, 4])
  spok(t, fixed, {
    byteSize:
      4 /* [] len */ +
      3 *
        /* Outer[] */ (4 /* Option Disc */ +
          4 /* [] len */ +
          4 * /* Inner [] */ 8) /* u64 */,
    description: 'Array<COption<Array<u64>(4)>>(3)',
  })
  t.end()
})

test('toFixed: string([12])', (t) => {
  const beet = dynamicSizeUtf8String()
  const fixed = toFixed(beet, [12])
  spok(t, fixed, {
    byteSize: 4 + 12,
    description: 'Utf8String(12)',
  })
  t.end()
})

test('toFixed: coption(string)([8])', (t) => {
  const beet = coption(dynamicSizeUtf8String())
  const fixed = toFixed(beet, [8])
  spok(t, fixed, {
    byteSize: 4 + 4 + 8,
    description: 'COption<Utf8String(8)>',
  })
  t.end()
})

test('toFixed: array(string)([10, 8])', (t) => {
  const beet = dynamicSizeArray(dynamicSizeUtf8String())
  const fixed = toFixed(beet, [10, 8])
  spok(t, fixed, {
    byteSize: 4 + 10 * (4 + 8),
    description: 'Array<Utf8String(8)>(10)',
  })
  t.end()
})

test('toFixed: array(coption(string))([10, 8])', (t) => {
  const beet = dynamicSizeArray(coption(dynamicSizeUtf8String()))
  const fixed = toFixed(beet, [10, 8])
  spok(t, fixed, {
    byteSize: 4 + 10 * (4 + 4 + 8),
    description: 'Array<COption<Utf8String(8)>>(10)',
  })
  t.end()
})

test('toFixed: array(coption(array(string)))([10, 3, 8])', (t) => {
  const beet = dynamicSizeArray(
    coption(dynamicSizeArray(dynamicSizeUtf8String()))
  )
  const fixed = toFixed(beet, [10, 3, 8])
  spok(t, fixed, {
    byteSize: 4 + 10 * (4 + 4 + 3 * (4 + 8)),
    description: 'Array<COption<Array<Utf8String(8)>(3)>>(10)',
  })
  t.end()
})

/*
test('toFixed: struct with top level vec', (t) => {
  const struct = new BeetArgsStruct(
    // @ts-ignore
    [['ids', dynamicSizeArray(u32)]],
    'VecStruct'
  )

  const fixed = toFixed(struct, [3])
  console.log(fixed)
  t.end()
})
*/
