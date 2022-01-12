import { Beet, fixedSizeUint8Array, StaticBeet } from '../src/beet'
import test from 'tape'

function checkCases(
  offsets: number[],
  cases: Uint8Array[],
  beet: StaticBeet<Uint8Array>,
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

test('collections: fixed size Uint8Array', (t) => {
  const cases = [Uint8Array.from([1, 2, 0xff]), Uint8Array.from([0, 10, 99])]
  const offsets = [0, 3]
  const beet: Beet<Uint8Array> = fixedSizeUint8Array(3)

  checkCases(offsets, cases, beet, t)
  t.end()
})
