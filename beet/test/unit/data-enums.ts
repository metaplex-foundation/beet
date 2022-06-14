import test from 'tape'
import {
  array,
  BeetArgsStruct,
  dataEnum,
  FixableBeet,
  FixableBeetArgsStruct,
  FixedSizeBeet,
  isFixableBeet,
  u8,
  uniformFixedSizeArray,
  utf8String,
} from '../../src/beet'

function convertToKindData(value: any) {
  const [key, val] = Object.entries(value)[0]
  return { __kind: key, ...(val as object) }
}

function checkCase(
  t: test.Test,
  maybeFixable: FixableBeet<any> | FixedSizeBeet<any>,
  expected: any
) {
  expected = convertToKindData(expected)
  const offset = 100

  let largerBuf
  {
    const beet = isFixableBeet(maybeFixable)
      ? maybeFixable.toFixedFromValue(expected)
      : maybeFixable
    const buf = Buffer.alloc(offset + beet.byteSize + offset)
    largerBuf = buf

    // Larger buffer
    beet.write(buf, offset, expected)
    const actual = beet.read(buf, offset)
    t.deepEqual(
      actual,
      expected,
      `round trip DataEnum(${expected.__kind}) larger buffer`
    )
  }
  {
    // Exact buffer
    const beet = isFixableBeet(maybeFixable)
      ? maybeFixable.toFixedFromData(largerBuf, offset)
      : maybeFixable
    const buf = Buffer.alloc(offset + beet.byteSize)
    beet.write(buf, offset, expected)
    const actual = beet.read(buf, offset)
    t.deepEqual(
      actual,
      expected,
      `round trip DataEnum(${expected.__kind}) exact buffer`
    )
  }
}

test('data-enums: fixable + fixed data structs', (t) => {
  type Ty = {
    Fixable: { s: string }
    Fixed: { n: number }
  }
  const beet = dataEnum<Ty>([
    ['Fixable', new FixableBeetArgsStruct<Ty['Fixable']>([['s', utf8String]])],
    ['Fixed', new BeetArgsStruct([['n', u8]])],
  ])
  checkCase(t, beet, { Fixable: { s: 'hello' } })
  checkCase(t, beet, { Fixed: { n: 1 } })
  t.end()
})

test('data-enums: fixed only data structs', (t) => {
  type Ty = {
    FixedOne: { n1: number }
    FixedTwo: { n2: number; array: number[] /* 2 */ }
  }
  const beet = dataEnum<Ty>([
    ['FixedOne', new BeetArgsStruct<Ty['FixedOne']>([['n1', u8]])],
    [
      'FixedTwo',
      new BeetArgsStruct<Ty['FixedTwo']>([
        ['n2', u8],
        ['array', uniformFixedSizeArray(u8, 2)],
      ]),
    ],
  ])
  checkCase(t, beet, { FixedOne: { n1: 1 } })
  checkCase(t, beet, { FixedTwo: { n2: 11, array: [3, 4] } })
  t.end()
})

test('data-enums: fixable only data structs', (t) => {
  type Ty = {
    FixableOne: { n1: string }
    FixableTwo: { n2: string; array: number[] /* 2 */ }
  }
  const beet = dataEnum<Ty>([
    ['FixableOne', new FixableBeetArgsStruct([['n1', utf8String]])],
    [
      'FixableTwo',
      new FixableBeetArgsStruct([
        ['n2', utf8String],
        ['array', array(u8)],
      ]),
    ],
  ])
  checkCase(t, beet, { FixableOne: { n1: '1' } })
  checkCase(t, beet, { FixableTwo: { n2: '11', array: [3, 4, 5] } })
  t.end()
})

test('data-enums: direct fixed data', (t) => {
  type Ty = {
    Data: number
  }
  try {
    dataEnum<Ty>([['Data', u8]])
    t.fail('should throw')
  } catch (err: any) {
    t.match(err.toString(), /beet must be a struct/)
  }
  t.end()
})

test('data-enums: direct fixable data', (t) => {
  type Ty = {
    Data: string
  }
  try {
    dataEnum<Ty>([['Data', utf8String]])
    t.fail('should throw')
  } catch (err: any) {
    t.match(err.toString(), /beet must be a struct/)
  }
  t.end()
})
