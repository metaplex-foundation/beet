import test from 'tape'
import { FixedSizeBeet, unit } from '../../src/beet'

function checkCases(
  offsets: number[],
  cases: void[],
  beet: FixedSizeBeet<void>,
  t: test.Test
) {
  for (const offset of offsets) {
    for (const expected of cases) {
      {
        // Larger buffer
        const buf = Buffer.alloc(offset + beet.byteSize + offset)
        beet.write(buf, offset, expected)
        const actual = beet.read(buf, offset)
        t.deepEqual(
          actual,
          expected,
          `round trip unit (${expected}), offset ${offset} larger buffer`
        )
      }
      {
        // Exact buffer
        const buf = Buffer.alloc(offset + beet.byteSize)
        beet.write(buf, offset, expected)
        const actual = beet.read(buf, offset)
        t.deepEqual(
          actual,
          expected,
          `round trip unit (${expected}), offset ${offset} larger buffer`
        )
      }
    }
  }
}

test('unit: round trip', (t) => {
  const offsets = [0, 4]
  const cases: void[] = [void 0, undefined]
  const beet = unit

  checkCases(offsets, cases, beet, t)
  t.end()
})
