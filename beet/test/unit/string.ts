import {
  fixedSizeUtf8String,
  FixedSizeBeet,
  utf8String,
  FixableBeet,
} from '../../src/beet'
import test from 'tape'

function checkFixedCases(
  offsets: number[],
  cases: string[],
  beet: FixedSizeBeet<string>,
  t: test.Test
) {
  for (const offset of offsets) {
    for (const x of cases) {
      {
        // Larger buffer
        const buf = Buffer.alloc(offset + beet.byteSize + offset)
        beet.write(buf, offset, x)
        const y = beet.read(buf, offset)
        t.equal(x, y, `round trip ${x}, offset ${offset} larger buffer`)
      }
      {
        // Exact buffer
        const buf = Buffer.alloc(offset + beet.byteSize)
        beet.write(buf, offset, x)
        const y = beet.read(buf, offset)
        t.equal(x, y, `round trip ${x}, offset ${offset} exact buffer`)
      }
    }
  }
}

// -----------------
// Fixed Size Utf8 String
// -----------------
test('collections: fixed size utf8 strings size 1', (t) => {
  const cases = ['a', 'b', 'z']
  const offsets = [0, 4]
  const beet = fixedSizeUtf8String(1)

  checkFixedCases(offsets, cases, beet, t)
  t.end()
})

test('collections: fixed size utf8 strings size 3', (t) => {
  const cases = ['abc', 'xYz']
  const offsets = [0, 4]
  const beet = fixedSizeUtf8String(3)

  checkFixedCases(offsets, cases, beet, t)
  t.end()
})

test('collections: fixed size utf8 strings size 4', (t) => {
  const cases = ['abcd', '😁']
  const offsets = [0, 4]
  const beet = fixedSizeUtf8String(4)

  checkFixedCases(offsets, cases, beet, t)
  t.end()
})

test('collections: fixed size utf8 incorrect size', (t) => {
  const s = '😁'
  const beet = fixedSizeUtf8String(3)
  const buf = Buffer.alloc(4)
  t.throws(() => beet.write(buf, 0, s), /invalid byte size/)

  t.end()
})

// -----------------
// Utf8 String
// -----------------
function checkCases(
  offsets: number[],
  cases: string[],
  fixableBeet: FixableBeet<string>,
  t: test.Test
) {
  for (const offset of offsets) {
    for (const x of cases) {
      const beet = fixableBeet.toFixedFromValue(x)
      {
        // Larger buffer
        const buf = Buffer.alloc(offset + beet.byteSize + offset)
        beet.write(buf, offset, x)
        const y = beet.read(buf, offset)
        t.equal(x, y, `round trip ${x}, offset ${offset} larger buffer`)
      }
      {
        // Exact buffer
        const buf = Buffer.alloc(offset + beet.byteSize)
        beet.write(buf, offset, x)
        const y = beet.read(buf, offset)
        t.equal(x, y, `round trip ${x}, offset ${offset} exact buffer`)
      }
    }
  }
}
test('collections: utf8 strings', (t) => {
  const cases = ['abcdefg', '😁', '😁😁😁', '']
  const offsets = [0, 4]
  const beet = utf8String

  checkCases(offsets, cases, beet, t)
  t.end()
})
