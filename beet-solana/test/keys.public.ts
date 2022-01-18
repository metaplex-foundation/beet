import { FixedSizeBeet } from '@metaplex-foundation/beet'
import { PublicKey, Keypair } from '@solana/web3.js'
import { publicKey } from '../src/beet-solana'
import test from 'tape'

function checkCases(
  offsets: number[],
  cases: PublicKey[],
  beet: FixedSizeBeet<PublicKey>,
  t: test.Test
) {
  for (const offset of offsets) {
    for (const x of cases) {
      {
        // Larger buffer
        const buf = Buffer.alloc(offset + beet.byteSize + offset)
        beet.write(buf, offset, x)
        const n = beet.read(buf, offset)
        t.ok(x.equals(n), `round trip ${x}, offset ${offset} larger buffer`)
      }
      {
        // Exact buffer
        const buf = Buffer.alloc(offset + beet.byteSize)
        beet.write(buf, offset, x)
        const n = beet.read(buf, offset)
        t.ok(x.equals(n), `round trip ${x}, offset ${offset} exact buffer`)
      }
    }
  }
}

test('publicKey: roundtrip', (t) => {
  const cases = [
    PublicKey.default,
    Keypair.generate().publicKey,
    new PublicKey('p1exdMJcjVao65QdewkaZRUnU6VPSXhus9n2GzWfh98'),
  ]
  const offsets = [0, 4, 20]
  const beet = publicKey

  checkCases(offsets, cases, beet, t)
  t.end()
})
