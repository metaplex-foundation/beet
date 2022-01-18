import {
  bool,
  uniformFixedSizeArray,
  FixedSizeBeet,
  u8,
  fixedSizeUtf8String,
} from '../../src/beet'

import test from 'tape'

function checkCases<T>(
  offsets: number[],
  cases: T[][],
  beet: FixedSizeBeet<T[]>,
  t: test.Test
) {
  for (const offset of offsets) {
    for (const x of cases) {
      {
        // Larger buffer
        const buf = Buffer.alloc(offset + beet.byteSize + offset)
        beet.write(buf, offset, x)
        const y = beet.read(buf, offset)
        t.deepEqual(x, y, `round trip ${x}, offset ${offset} larger buffer`)
      }
      {
        // Exact buffer
        const buf = Buffer.alloc(offset + beet.byteSize)
        beet.write(buf, offset, x)
        const y = beet.read(buf, offset)
        t.deepEqual(x, y, `round trip ${x}, offset ${offset} exact buffer`)
      }
    }
  }
}

test('collections: fixed size array of u8, include size', (t) => {
  const cases = [
    [1, 2, 0xff],
    [0, 1, 2],
  ]
  const offsets = [0, 4]
  const beet = uniformFixedSizeArray(u8, 3, true)

  checkCases(offsets, cases, beet, t)
  t.end()
})

test('collections: fixed size array of u8, not including size', (t) => {
  const cases = [
    [1, 2, 0xff],
    [0, 1, 2],
  ]
  const offsets = [0, 4]
  const beet = uniformFixedSizeArray(u8, 3)

  checkCases(offsets, cases, beet, t)
  t.end()
})

test('collections: fixed size array of bool, include size', (t) => {
  const cases = [
    [true, true, false, true],
    [false, true, false, true],
  ]
  const offsets = [0, 4]
  const beet: FixedSizeBeet<boolean[]> = uniformFixedSizeArray(bool, 4, true)

  checkCases(offsets, cases, beet, t)
  t.end()
})

test('collections: fixed size array of string, include size', (t) => {
  const cases = [
    ['abc ', '*def', '😁'],
    ['aaaa', 'bbbb', '*&#@'],
  ]
  const offsets = [0, 3]
  const beet: FixedSizeBeet<string[]> = uniformFixedSizeArray(
    fixedSizeUtf8String(4),
    3,
    true
  )

  checkCases(offsets, cases, beet, t)
  t.end()
})

test('collections: fixed size array of string, not including size', (t) => {
  const cases = [
    ['abc ', '*def', '😁'],
    ['aaaa', 'bbbb', '*&#@'],
  ]
  const offsets = [0, 3]
  const beet: FixedSizeBeet<string[]> = uniformFixedSizeArray(
    fixedSizeUtf8String(4),
    3
  )

  checkCases(offsets, cases, beet, t)
  t.end()
})
