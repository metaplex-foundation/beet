import { Borsh, fixedSizeUtf8String } from '../src/borsh'
import test from 'tape'

function checkCases(
  offsets: number[],
  cases: string[],
  borsh: Borsh<string>,
  t: test.Test
) {
  for (const offset of offsets) {
    for (const x of cases) {
      {
        // Larger buffer
        const buf = Buffer.alloc(offset + borsh.byteSize + offset)
        borsh.write(buf, offset, x)
        const y = borsh.read(buf, offset)
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

test('collections: fixed size utf8 strings size 1', (t) => {
  const cases = ['a', 'b', 'z']
  const offsets = [0, 4]
  const borsh = fixedSizeUtf8String(1)

  checkCases(offsets, cases, borsh, t)
  t.end()
})

test('collections: fixed size utf8 strings size 3', (t) => {
  const cases = ['abc', 'xYz']
  const offsets = [0, 4]
  const borsh = fixedSizeUtf8String(3)

  checkCases(offsets, cases, borsh, t)
  t.end()
})

test('collections: fixed size utf8 strings size 4', (t) => {
  const cases = ['abcd', '😁']
  const offsets = [0, 4]
  const borsh = fixedSizeUtf8String(4)

  checkCases(offsets, cases, borsh, t)
  t.end()
})

test('collections: fixed size utf8 incorrect size', (t) => {
  const s = '😁'
  const borsh = fixedSizeUtf8String(3)
  const buf = Buffer.alloc(4)
  t.throws(() => borsh.write(buf, 0, s), /invalid byte size/)

  t.end()
})
