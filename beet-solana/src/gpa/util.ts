import { FixedSizeBeet } from '@metaplex-foundation/beet'
import base58 from 'bs58'

export function encodeFixedBeet<T>(beet: FixedSizeBeet<T>, val: T) {
  const buf = Buffer.alloc(beet.byteSize)
  beet.write(buf, 0, val)
  return base58.encode(buf)
}
