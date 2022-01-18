import {
  Beet,
  coption,
  COption,
  fixedSizeUtf8String,
  FixedSizeBeet,
  u32,
  u8,
} from '../../src/beet'
import test from 'tape'

function checkCases<T>(
  offsets: number[],
  cases: COption<T>[],
  beet: FixedSizeBeet<COption<T>>,
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

test('composites: COption<u8>', (t) => {
  const cases = [1, 2, null, 0xff]
  const offsets = [0, 4]
  const beet: Beet<COption<number>> = coption(u8)

  checkCases(offsets, cases, beet, t)
  t.end()
})

test('composites: COption<u32>', (t) => {
  const cases = [1, null, 0xff, 0xffff, 0xffffffff]
  const offsets = [0, 4]
  const beet: Beet<COption<number>> = coption(u32)

  checkCases(offsets, cases, beet, t)
  t.end()
})

test('composites: COption<string>', (t) => {
  const cases = ['abc', 'xyz', null]
  const offsets = [0, 2]
  const beet: Beet<COption<string>> = coption(fixedSizeUtf8String(3))

  checkCases(offsets, cases, beet, t)
  t.end()
})
