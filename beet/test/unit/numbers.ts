import BN from 'bn.js'
import test from 'tape'
import {
  bignum,
  i16,
  i32,
  i8,
  u128,
  u16,
  u256,
  u32,
  u512,
  u64,
  u8,
  bool,
  i64,
  i128,
  i256,
  FixedSizeBeet,
} from '../../src/beet'

function oneType(
  x: bignum,
  y: bignum
): [x: number, y: number] | [x: BN, y: BN] {
  const bigx = BN.isBN(x)
  const bigy = BN.isBN(y)
  if (bigx && bigy) return [x, y]
  if (!bigx && !bigy) return [x, y]
  if (bigx) return [x, new BN(y.toString())]
  return [new BN(x.toString()), <BN>y]
}

function checkCases(
  offsets: number[],
  cases: bignum[],
  beet: FixedSizeBeet<bignum>,
  t: test.Test
) {
  for (const offset of offsets) {
    for (const x of cases) {
      {
        // Larger buffer
        const buf = Buffer.alloc(offset + beet.byteSize + offset)
        beet.write(buf, offset, x)
        const n = beet.read(buf, offset)
        const [a, b] = oneType(x, n)
        t.equal(
          a.toString(),
          b.toString(),
          `round trip ${x}, offset ${offset} larger buffer`
        )
      }
      {
        // Exact buffer
        const buf = Buffer.alloc(offset + beet.byteSize)
        beet.write(buf, offset, x)
        const n = beet.read(buf, offset)
        const [a, b] = oneType(x, n)
        t.equal(
          a.toString(),
          b.toString(),
          `round trip ${x}, offset ${offset} exact buffer`
        )
      }
    }
  }
}

// -----------------
// Unsigned Ints
// -----------------
test('numbers: round trip u8', (t) => {
  const cases = [0, 1, 100, 0xff]
  const offsets = [0, u8.byteSize, 2 * u8.byteSize]
  const beet = u8

  checkCases(offsets, cases, beet, t)
  t.end()
})

test('numbers: round trip u16', (t) => {
  const cases = [0, 1, 0xff, 0xffff]
  const offsets = [0, u16.byteSize, 2 * u16.byteSize]
  const beet = u16

  checkCases(offsets, cases, beet, t)
  t.end()
})

test('numbers: round trip u32', (t) => {
  const cases = [0, 0xff, 0xffff, 0xffffffff]
  const offsets = [0, u32.byteSize, 2 * u32.byteSize]
  const beet = u32

  checkCases(offsets, cases, beet, t)
  t.end()
})

test('numbers: round trip u64', (t) => {
  const cases = [0, 0xff, 0xffff, 0xffffffff, new BN('18446744073709551615')]
  const offsets = [0, u64.byteSize, 2 * u64.byteSize]
  const beet = u64

  checkCases(offsets, cases, beet, t)
  t.end()
})

test('numbers: round trip u128', (t) => {
  const cases = [
    0,
    0xff,
    0xffff,
    0xffffffff,
    new BN('18446744073709551615'),
    new BN('340282366920938463463374607431768211455'),
  ]
  const offsets = [0, u128.byteSize, 2 * u128.byteSize]
  const beet = u128

  checkCases(offsets, cases, beet, t)
  t.end()
})

test('numbers: round trip u256', (t) => {
  const cases = [
    0,
    0xff,
    0xffff,
    0xffffffff,
    new BN('18446744073709551615'),
    new BN('340282366920938463463374607431768211455'),
    new BN(
      '115792089237316195423570985008687907853269984665640564039457584007913129639935'
    ),
  ]
  const offsets = [0, u256.byteSize, 2 * u256.byteSize]
  const beet = u256

  checkCases(offsets, cases, beet, t)
  t.end()
})

test('numbers: round trip u512', (t) => {
  const cases = [
    0,
    0xff,
    0xffff,
    0xffffffff,
    new BN('18446744073709551615'),
    new BN('340282366920938463463374607431768211455'),
    new BN(
      '115792089237316195423570985008687907853269984665640564039457584007913129639935'
    ),
    new BN(
      '13407807929942597099574024998205846127479365820592393377723561443721764030073546976801874298166903427690031858186486050853753882811946569946433649006084095'
    ),
  ]
  const offsets = [0, u512.byteSize, 2 * u512.byteSize]
  const beet = u512

  checkCases(offsets, cases, beet, t)
  t.end()
})

// -----------------
// Signed Ints
// -----------------
test('numbers: round trip i8', (t) => {
  const beet = i8
  const cases = [0, 1, -1, 100, -100, 0x7f, -0x80]
  const offsets = [0, beet.byteSize, 2 * beet.byteSize]

  checkCases(offsets, cases, beet, t)
  t.end()
})

test('numbers: round trip i16', (t) => {
  const beet = i16
  const cases = [0, 1, -1, 0x7f, -0x80, 0x7fff, -0x8000]
  const offsets = [0, beet.byteSize, 2 * beet.byteSize]

  checkCases(offsets, cases, beet, t)
  t.end()
})

test('numbers: round trip i32', (t) => {
  const beet = i32
  const cases = [0, 1, -1, 0x7f, -0x80, 0x7fff, -0x8000, 0x7fffff, -0x800000]
  const offsets = [0, beet.byteSize, 2 * beet.byteSize]

  checkCases(offsets, cases, beet, t)
  t.end()
})

test('numbers: round trip i64', (t) => {
  const cases = [
    0,
    -0xff,
    0xff,
    0xffff,
    -0xffff,
    0xffffffff,
    -0xffffffff,
    new BN('9223372036854775807'),
    new BN('-9223372036854775808'),
  ]

  const offsets = [0, i64.byteSize, 2 * i64.byteSize]
  const beet = i64

  checkCases(offsets, cases, beet, t)
  t.end()
})

test('numbers: round trip i128', (t) => {
  const cases = [
    0,
    -0xff,
    0xff,
    0xffff,
    -0xffff,
    0xffffffff,
    -0xffffffff,
    new BN('9223372036854775807'),
    new BN('-9223372036854775808'),
    new BN('170141183460469231731687303715884105727'),
    new BN('-170141183460469231731687303715884105728'),
  ]

  const offsets = [0, i64.byteSize, 2 * i64.byteSize]
  const beet = i128

  checkCases(offsets, cases, beet, t)
  t.end()
})

test('numbers: round trip i256', (t) => {
  const cases = [
    0,
    -0xff,
    0xff,
    0xffff,
    -0xffff,
    0xffffffff,
    -0xffffffff,
    new BN('9223372036854775807'),
    new BN('-9223372036854775808'),
    new BN('170141183460469231731687303715884105727'),
    new BN('-170141183460469231731687303715884105728'),
    new BN('170141183460469231731687303715884105727').mul(
      new BN('170141183460469231731687303715884105727')
    ),
    new BN('-170141183460469231731687303715884105728').mul(
      new BN('170141183460469231731687303715884105727')
    ),
  ]

  const offsets = [0, i64.byteSize, 2 * i64.byteSize]
  const beet = i256

  checkCases(offsets, cases, beet, t)
  t.end()
})

// -----------------
// Boolean
// -----------------
test('numbers: round trip bool', (t) => {
  const beet = bool
  const cases = [true, false]
  const offsets = [0, beet.byteSize]

  for (const offset of offsets) {
    for (const x of cases) {
      {
        // Larger buffer
        const buf = Buffer.alloc(offset + beet.byteSize + offset)
        beet.write(buf, offset, x)
        const y = beet.read(buf, offset)
        t.equal(y, x, `round trip ${x}, offset ${offset} larger buffer`)
      }
      {
        // Exact buffer
        const buf = Buffer.alloc(offset + beet.byteSize)
        beet.write(buf, offset, x)
        const y = beet.read(buf, offset)
        t.equal(y, x, `round trip ${x}, offset ${offset} larger buffer`)
      }
    }
  }

  t.end()
})
