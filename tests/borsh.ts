import { BorshStruct, u16, u8 } from '../src/borsh'

class GameScore {
  constructor(readonly win: number, readonly totalWin: number) {}

  static readonly struct = new BorshStruct<GameScore>(
    [
      ['win', u8],
      ['totalWin', u16],
    ],
    (args) => new GameScore(args.win, args.totalWin)
  )
}

const score = new GameScore(1, 10)
const buffer = GameScore.struct.serialize(score)

const [deserialized, _offset] = GameScore.struct.deserialize(buffer)
console.log(deserialized)
