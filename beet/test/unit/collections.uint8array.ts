import {
  Beet,
  fixedSizeUint8Array,
  FixedSizeBeet,
  uint8Array,
  FixableBeet,
} from '../../src/beet'
import test from 'tape'

function checkFixedCases(
  offsets: number[],
  cases: Uint8Array[],
  beet: FixedSizeBeet<Uint8Array>,
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

function checkFixableCases(
  offsets: number[],
  cases: Uint8Array[],
  fixable: FixableBeet<Uint8Array, Uint8Array>,
  t: test.Test
) {
  for (const offset of offsets) {
    for (const x of cases) {
      const beet = fixable.toFixedFromValue(x)
      {
        // Larger buffer
        const buf = Buffer.alloc(offset + beet.byteSize + offset)
        beet.write(buf, offset, x)
        const y = beet.read(buf, offset)
        t.deepEqual(
          x,
          y,
          `round trip ${x} == ${y}, offset ${offset} larger buffer`
        )
      }
      {
        // Exact buffer
        const buf = Buffer.alloc(offset + beet.byteSize)
        beet.write(buf, offset, x)
        const y = beet.read(buf, offset)
        t.deepEqual(
          x,
          y,
          `round trip ${x} == ${y}, offset ${offset} exact buffer`
        )
      }
    }
  }
}

test('collections: fixed size Uint8Array', (t) => {
  const cases = [Uint8Array.from([1, 2, 0xff]), Uint8Array.from([0, 10, 99])]
  const offsets = [0, 3]
  const beet: Beet<Uint8Array> = fixedSizeUint8Array(3)

  checkFixedCases(offsets, cases, beet, t)
  t.end()
})

test('collections: fixable size Uint8Array', (t) => {
  const cases = [
    Uint8Array.from([1, 2, 0xff]),
    Uint8Array.from([0, 10, 99, 999, 9999]),
  ]
  const offsets = [0, 3]
  const beet: FixableBeet<Uint8Array, Uint8Array> = uint8Array
  checkFixableCases(offsets, cases, beet, t)

  // Ensure from data fixing (first four bytes indicate len)
  t.equal(
    beet.toFixedFromData(Buffer.from([3, 0, 0, 0, 1, 2, 3]), 0).byteSize,
    4 + 3
  )
  t.equal(
    beet.toFixedFromData(Buffer.from([0, 5, 0, 0, 0, 1, 2, 3, 4, 5]), 1)
      .byteSize,
    4 + 5
  )
  t.end()
})
