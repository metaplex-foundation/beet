import { Beet, fixedSizeBuffer, FixedSizeBeet } from '../../src/beet'
import test from 'tape'

function checkCases(
  offsets: number[],
  cases: Buffer[],
  beet: FixedSizeBeet<Buffer>,
  t: test.Test
) {
  for (const offset of offsets) {
    for (const x of cases) {
      {
        // Larger buffer
        const buf = Buffer.alloc(offset + beet.byteSize + offset)
        beet.write(buf, offset, x)
        const y = beet.read(buf, offset)
        t.equal(
          Buffer.compare(x, y),
          0,
          `round trip ${x}, offset ${offset} larger buffer`
        )
      }
      {
        // Exact buffer
        const buf = Buffer.alloc(offset + beet.byteSize)
        beet.write(buf, offset, x)
        const y = beet.read(buf, offset)
        t.equal(
          Buffer.compare(x, y),
          0,
          `round trip ${x}, offset ${offset} exact buffer`
        )
      }
    }
  }
}

test('collections: fixed size buffer', (t) => {
  const cases = [
    Buffer.concat(['abc ', '*def', '😁'].map(Buffer.from)),
    Buffer.concat(['aaaa', 'bbbb', '*&#@'].map(Buffer.from)),
  ]
  const offsets = [0, 3]
  const beet: Beet<Buffer> = fixedSizeBuffer(3 * 4)

  checkCases(offsets, cases, beet, t)
  t.end()
})
