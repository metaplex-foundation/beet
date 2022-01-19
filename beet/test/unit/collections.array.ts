import {
  array,
  utf8String,
  FixableBeet,
  u8,
  COption,
  coption,
} from '../../src/beet'

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

test('collections: non-uniform size array of option(u8)', (t) => {
  const cases: COption<number>[][] = [
    [],
    [1, 2, 3],
    [null, null, null],
    [1, null, 255],
  ]

  const offsets = [0, 3]
  const beet = array(coption(u8))
  checkCases(offsets, cases, beet, t)
  t.end()
})

test('collections: non-uniform size array of option(string)', (t) => {
  const cases = [
    [],
    [null, null],
    ['a ', 'abcdef', '😁'],
    ['aa', null, 'bbb', null, '*&#@!!'],
  ]
  const offsets = [0, 3]
  const beet = array(coption(utf8String))

  checkCases(offsets, cases, beet, t)
  t.end()
})

test('collections: non-uniform size array of option(array(string))', (t) => {
  const cases = [
    [],
    [null, null],
    [['a '], ['abcdef', '😁']],
    [['aa', 'bbb'], null, ['*&#@!!', 'abcdef', '😁', 'aa', 'bb', 'ccccc']],
  ]
  const offsets = [0, 3]
  const beet = array(coption(array(utf8String)))

  checkCases(offsets, cases, beet, t)
  t.end()
})
