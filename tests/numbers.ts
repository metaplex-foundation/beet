import BN from 'bn.js'
import test from 'tape'
import {
  bignum,
  Borsh,
  u128,
  u16,
  u256,
  u32,
  u512,
  u64,
  u8,
} from '../src/borsh'

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
  borsh: Borsh<bignum>,
  t: test.Test
) {
  for (const offset of offsets) {
    for (const x of cases) {
      {
        // Larger buffer
        const buf = Buffer.alloc(offset + borsh.byteSize + offset)
        borsh.write(buf, 0, x)
        const n = borsh.read(buf, 0)
        const [a, b] = oneType(x, n)
        t.equal(
          a.toString(),
          b.toString(),
          `round trip ${x}, offset ${offset} larger buffer`
        )
      }
      {
        // Exact buffer
        const buf = Buffer.alloc(offset + borsh.byteSize)
        borsh.write(buf, 0, x)
        const n = borsh.read(buf, 0)
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
  const borsh = u8

  checkCases(offsets, cases, borsh, t)
  t.end()
})

test('numbers: round trip u16', (t) => {
  const cases = [0, 1, 0xff, 0xffff]
  const offsets = [0, u16.byteSize, 2 * u16.byteSize]
  const borsh = u16

  checkCases(offsets, cases, borsh, t)
  t.end()
})

test('numbers: round trip u32', (t) => {
  const cases = [0, 0xff, 0xffff, 0xffffffff]
  const offsets = [0, u32.byteSize, 2 * u32.byteSize]
  const borsh = u32

  checkCases(offsets, cases, borsh, t)
  t.end()
})

test('numbers: round trip u64', (t) => {
  const cases = [0, 0xff, 0xffff, 0xffffffff, new BN('18446744073709551615')]
  const offsets = [0, u64.byteSize, 2 * u64.byteSize]
  const borsh = u64

  checkCases(offsets, cases, borsh, t)
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
  const borsh = u128

  checkCases(offsets, cases, borsh, t)
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
  const borsh = u256

  checkCases(offsets, cases, borsh, t)
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
  const borsh = u512

  checkCases(offsets, cases, borsh, t)
  t.end()
})
