import { array, utf8String, FixableBeet } from '../../src/beet'

import test from 'tape'

function checkCases<T, V = Partial<T>>(
  offsets: number[],
  cases: V[][],
  fixable: FixableBeet<T[], V[]>,
  t: test.Test
) {
  for (const offset of offsets) {
    for (const x of cases) {
      {
        const beetFromVal = fixable.toFixedFromValue(x)

        // Larger buffer
        const buf = Buffer.alloc(offset + beetFromVal.byteSize + offset)
        beetFromVal.write(buf, offset, x)

        const beetFromData = fixable.toFixedFromData(buf, offset)
        const y = beetFromData.read(buf, offset)
        t.deepEqual(x, y, `round trip ${x}, offset ${offset} larger buffer`)
      }
      {
        const beetFromVal = fixable.toFixedFromValue(x)

        // Exact buffer
        const buf = Buffer.alloc(offset + beetFromVal.byteSize)
        beetFromVal.write(buf, offset, x)

        const beetFromData = fixable.toFixedFromData(buf, offset)
        const y = beetFromData.read(buf, offset)
        t.deepEqual(x, y, `round trip ${x}, offset ${offset} exact buffer`)
      }
    }
  }
}

test('collections: non-uniform size array of strings', (t) => {
  const cases = [
    ['a ', 'abcdef', '😁'],
    ['aa', 'bbb', '*&#@!!'],
  ]
  const offsets = [0, 3]
  const beet = array(utf8String)

  checkCases(offsets, cases, beet, t)
  t.end()
})
