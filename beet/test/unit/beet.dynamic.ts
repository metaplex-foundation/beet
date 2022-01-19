import spok, { Specifications } from 'spok'
import test from 'tape'
import { array, utf8String } from '../../src/beet'
import { coption } from '../../src/beets/composites'
import { i64, u32, u8 } from '../../src/beets/numbers'
import { bignum, FixableBeet } from '../../src/types'
import { deepLogBeet } from '../utils'
import { strict as assert } from 'assert'

function stringifyElements(arr: any[]) {
  for (let i = 0; i < arr.length; i++) {
    arr[i] = `${arr[i]}`
  }
}
function verify<T, V>(
  t: test.Test,
  beet: FixableBeet<T, V>,
  args: V,
  expected: Specifications<FixableBeet<T, V>>,
  log = false
) {
  // 1. Derive fixed struct or beet from provided args and check it
  const fixedFromArgs = beet.toFixedFromValue(args)
  if (log) {
    deepLogBeet(fixedFromArgs)
    return
  }
  spok(t, fixedFromArgs, expected, 'fixedFromArgs: ')

  // 2. Serialize args using the fixed struct or beet
  const data = Buffer.alloc(fixedFromArgs.byteSize)
  fixedFromArgs.write(data, 0, args)

  // 3. Derive fixed struct or beet from serialized data
  const fixedFromData = beet.toFixedFromData(data, 0)
  spok(t, fixedFromData, expected, 'fixedFromData: ')

  // 4. Deserialize args from data via the beet or struct derived from data
  const deserializedArgs = fixedFromData.read(data, 0)
  if (Array.isArray(args) && args.length > 0 && typeof args[0] === 'number') {
    stringifyElements(args)
    assert(
      Array.isArray(deserializedArgs),
      `Assumed when args is array then ${deserializedArgs} is as well`
    )
    stringifyElements(deserializedArgs)
    t.deepEqual(deserializedArgs, args, 'round-tripped')
  } else {
    spok(t, deserializedArgs, { ...args, $topic: 'round-tripped' })
  }
}

test('fixable: from value array<u8>(2)', (t) => {
  const beet = array(u8)
  verify(t, beet, [1, 2], <Specifications<typeof beet>>{
    byteSize: 4 + 2 * 1,
    description: 'Array<u8>(2)[ 4 + 2 ]',
  })
  t.end()
})

test('fixable: array<u32>(1)', (t) => {
  const beet = array(u32)
  verify(t, beet, [1], <Specifications<typeof beet>>{
    byteSize: 4 + 4,
    description: 'Array<u32>(1)[ 4 + 4 ]',
  })
  t.end()
})

test('fixable: array<i64>(10)', (t) => {
  const beet = array(i64)
  verify(t, beet, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], <
    Specifications<typeof beet>
  >{
    byteSize: 4 + 10 * 8,
    description: 'Array<i64>(10)[ 4 + 80 ]',
  })
  t.end()
})

test('fixable: array<coption<u8>>(2)', (t) => {
  const beet = array(coption(u8))
  verify(t, beet, [null, 2], <Specifications<typeof beet>>{
    byteSize: 4 + 1 + 1 + 1,
    length: 2,
    description: 'Array<COption<None(u8)>>(2)[ 4 + 3 ]',
  })
  t.end()
})

test('fixable: coption<array<u8>>(2)', (t) => {
  const beet = coption(array(u8))
  verify(t, beet, [1, 2], <Specifications<typeof beet>>{
    byteSize: 1 + 4 + 2 * 1,
    description: 'COption<Array<u8>(2)[ 4 + 2 ]>[1 + 6]',
  })
  t.end()
})

test('fixable: array<coption(array(u32))>([3, 4])', (t) => {
  // This means I have 3 elements which each contain an option of an array with 4 u8s each
  const innerArray = array<bignum>(u32)
  const beet = array(coption(innerArray))
  verify(
    t,
    beet,
    [
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 0, 1, 2],
    ],
    <Specifications<typeof beet>>{
      byteSize:
        4 /* [] len */ +
        3 *
          /* Outer[] */ (1 /* Option Disc */ +
            4 /* [] len */ +
            4 * /* Inner [] */ 4) /* u32 */,
      description:
        'Array<COption<Array<u32>(4)[ 4 + 16 ]>[1 + 20]>(3)[ 4 + 63 ]',
    }
  )
  t.end()
})

test('fixable: coption(string)([4])', (t) => {
  const beet = coption(utf8String)
  verify(t, beet, '88888888', <Specifications<typeof beet>>{
    byteSize: 1 + 4 + 8,
    description: 'COption<Utf8String(4 + 8)>[1 + 12]',
  })
  t.end()
})

test('fixable: array(string)([4, 1-4])', (t) => {
  const beet = array(utf8String)
  verify(t, beet, ['1', '22', '333', '4444'], <Specifications<typeof beet>>{
    length: 4,
    byteSize: 4 + (4 + 1) + (4 + 2) + (4 + 3) + (4 + 4),
    description: 'Array<Utf8String(4 + 1)>(4)[ 4 + 26 ]',
  })
  t.end()
})

test('fixable: array(coption(string))([3, 1-2])', (t) => {
  const beet = array(coption(utf8String))
  verify(t, beet, ['1', null, '22'], <Specifications<typeof beet>>{
    length: 3,
    byteSize: 4 + (1 + 4 + 1) + 1 + (1 + 4 + 2),
    description: 'Array<COption<Utf8String(4 + 1)>[1 + 5]>(3)[ 4 + 14 ]',
  })
  t.end()
})

test('fixable: array(coption(array(string)))([2, 3, 1-2])', (t) => {
  const beet = array(coption(array(utf8String)))
  verify(t, beet, [['1', '22'], null, ['333', '4444']], <
    Specifications<typeof beet>
  >{
    length: 3,
    byteSize:
      4 + (1 + (4 + (4 + 1) + (4 + 2)) + 1 + (1 + (4 + (4 + 3) + (4 + 4)))),
    description:
      'Array<COption<Array<Utf8String(4 + 1)>(2)[ 4 + 11 ]>[1 + 15]>(3)[ 4 + 37 ]',
  })
  t.end()
})
