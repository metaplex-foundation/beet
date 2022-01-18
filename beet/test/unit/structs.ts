import BN from 'bn.js'
import test from 'tape'
import spok, { Specifications } from 'spok'
import { BeetStruct, i32, u128, u16, u8 } from '../../src/beet'

class GameScore {
  constructor(
    readonly win: number,
    readonly totalWin: number,
    readonly whaleAccount: BN,
    readonly losses: number
  ) {}

  static readonly struct = new BeetStruct<GameScore>(
    [
      ['win', u8],
      ['totalWin', u16],
      ['whaleAccount', u128],
      ['losses', i32],
    ],
    (args) =>
      new GameScore(
        args.win!,
        args.totalWin!,
        args.whaleAccount!,
        args.losses!
      ),
    'GameStruct'
  )
}

function eqBN(x: BN): Specifications<BN> {
  const check = (y: BN) => y.eq(x)
  check.$spec = 'eqBN(' + x + ')'
  check.$description = 'BN is equal to ' + x
  return check
}

const gs1 = new GameScore(
  1,
  100,
  new BN('340282366920938463463374607431768211451'),
  -234
)

const gs2 = new GameScore(
  10,
  200,
  new BN('340282366920938463463374607431768211400'),
  -500
)

test('struct: static properties', (t) => {
  t.equal(GameScore.struct.byteSize, 23, 'byte size')
  t.end()
})

test('struct: roundtrip one numbers only struct', (t) => {
  const [buf, _] = GameScore.struct.serialize(gs1)
  const [deserialized, offset] = GameScore.struct.deserialize(buf)
  t.equal(
    offset,
    GameScore.struct.byteSize,
    'deserialize reads struct bytesize'
  )
  spok(t, deserialized, {
    win: gs1.win,
    totalWin: gs1.totalWin,
    whaleAccount: eqBN(gs1.whaleAccount),
  })
  t.end()
})

test('struct: roundtrip two numbers only structs', (t) => {
  const buf = Buffer.concat([
    GameScore.struct.serialize(gs1)[0],
    GameScore.struct.serialize(gs2)[0],
  ])
  const [first, firstOffset] = GameScore.struct.deserialize(buf)
  const [second, secondOffset] = GameScore.struct.deserialize(buf, firstOffset)

  t.equal(
    firstOffset,
    GameScore.struct.byteSize,
    'deserialize reads first struct bytesize'
  )
  t.equal(
    secondOffset,
    GameScore.struct.byteSize * 2,
    'deserialize reads second struct bytesize'
  )

  spok(t, first, {
    win: gs1.win,
    totalWin: gs1.totalWin,
    whaleAccount: eqBN(gs1.whaleAccount),
  })

  spok(t, second, {
    win: gs2.win,
    totalWin: gs2.totalWin,
    whaleAccount: eqBN(gs2.whaleAccount),
  })
  t.end()
})
