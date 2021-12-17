import { PublicKey } from '@solana/web3.js'
import { Beet, fixedSizeUint8Array } from '@metaplex-foundation/beet'

const uint8Array32 = fixedSizeUint8Array(32)

export const publicKey: Beet<PublicKey> = {
  write: function (buf: Buffer, offset: number, value: PublicKey): void {
    const arr = value.toBytes()
    uint8Array32.write(buf, offset, arr)
  },
  read: function (buf: Buffer, offset: number): PublicKey {
    const bytes = uint8Array32.read(buf, offset)
    return new PublicKey(bytes)
  },

  byteSize: uint8Array32.byteSize,
  description: 'PublicKey',
}
