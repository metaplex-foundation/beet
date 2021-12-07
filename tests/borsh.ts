import { BorshField, BorshReader, BorshWriter, u16, u8 } from '../src/borsh'

class GameScore {
  constructor(readonly win: number, readonly totalWin: number) {}

  static fields: BorshField<GameScore>[] = [
    ['win', u8],
    ['totalWin', u16],
  ]

  static deserialize(buffer: Buffer, offset: number = 0): [GameScore, number] {
    const reader = new BorshReader(buffer, offset)
    const args = reader.readStruct(this.fields)
    return [new GameScore(args.win, args.totalWin), reader.offset]
  }

  static serialize(instance: GameScore): Buffer {
    const writer = new BorshWriter()
    writer.writeStruct(instance, this.fields)
    return writer.buffer
  }
}

const score = new GameScore(1, 10)
const buffer = GameScore.serialize(score)
console.log(buffer.slice(0, u8.byteSize + u16.byteSize).toString('hex'))

const [deserialized] = GameScore.deserialize(buffer)
console.log(deserialized)
