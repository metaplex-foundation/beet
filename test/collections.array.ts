import {
  Beet,
  bool,
  fixedSizeArray,
  fixedSizeUtf8String,
  u8,
} from '../src/beet'
import test from 'tape'

function checkCases<T>(
  offsets: number[],
  cases: T[][],
  beet: Beet<T[]>,
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

test('collections: fixed size array of u8', (t) => {
  const cases = [
    [1, 2, 0xff],
    [0, 1, 2],
  ]
  const offsets = [0, 4]
  const beet = fixedSizeArray(u8, 3)

  checkCases(offsets, cases, beet, t)
  t.end()
})

test('collections: fixed size array of bool', (t) => {
  const cases = [
    [true, true, false, true],
    [false, true, false, true],
  ]
  const offsets = [0, 4]
  const beet: Beet<boolean[]> = fixedSizeArray(bool, 4)

  checkCases(offsets, cases, beet, t)
  t.end()
})

test('collections: fixed size array of string', (t) => {
  const cases = [
    ['abc ', '*def', '😁'],
    ['aaaa', 'bbbb', '*&#@'],
  ]
  const offsets = [0, 3]
  const beet: Beet<string[]> = fixedSizeArray(fixedSizeUtf8String(4), 3)

  checkCases(offsets, cases, beet, t)
  t.end()
})
