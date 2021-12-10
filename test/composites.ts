import {
  Borsh,
  coption,
  COption,
  fixedSizeUtf8String,
  u32,
  u8,
} from '../src/borsh'
import test from 'tape'

function checkCases<T>(
  offsets: number[],
  cases: COption<T>[],
  borsh: Borsh<COption<T>>,
  t: test.Test
) {
  for (const offset of offsets) {
    for (const x of cases) {
      {
        // Larger buffer
        const buf = Buffer.alloc(offset + borsh.byteSize + offset)
        borsh.write(buf, 0, x)
        const y = borsh.read(buf, 0)
        t.equal(x, y, `round trip ${x}, offset ${offset} larger buffer`)
      }
      {
        // Exact buffer
        const buf = Buffer.alloc(offset + borsh.byteSize)
        borsh.write(buf, offset, x)
        const y = borsh.read(buf, offset)
        t.equal(x, y, `round trip ${x}, offset ${offset} exact buffer`)
      }
    }
  }
}

test('composites: COption<u8>', (t) => {
  const cases = [1, 2, null, 0xff]
  const offsets = [0, 4]
  const borsh: Borsh<COption<number>> = coption(u8)

  checkCases(offsets, cases, borsh, t)
  t.end()
})

test('composites: COption<u32>', (t) => {
  const cases = [1, null, 0xff, 0xffff, 0xffffffff]
  const offsets = [0, 4]
  const borsh: Borsh<COption<number>> = coption(u32)

  checkCases(offsets, cases, borsh, t)
  t.end()
})

test('composites: COption<string>', (t) => {
  const cases = ['abc', 'xyz', null]
  const offsets = [0, 2]
  const borsh: Borsh<COption<string>> = coption(fixedSizeUtf8String(3))

  checkCases(offsets, cases, borsh, t)
  t.end()
})
