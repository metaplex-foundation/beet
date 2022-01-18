import test from 'tape'
import spok from 'spok'
import { BeetStruct, fixedSizeUtf8String, i32, u16, u8 } from '../../src/beet'

class Results {
  constructor(
    readonly win: number,
    readonly totalWin: number,
    readonly losses: number
  ) {}

  static readonly struct = new BeetStruct<Results>(
    [
      ['win', u8],
      ['totalWin', u16],
      ['losses', i32],
    ],
    (args) => new Results(args.win!, args.totalWin!, args.losses!),
    'Results'
  )
}

class Trader {
  constructor(
    readonly name: string,
    readonly results: Results,
    readonly age: number
  ) {}

  static readonly struct = new BeetStruct<Trader>(
    [
      ['name', fixedSizeUtf8String(4)],
      ['results', Results.struct],
      ['age', u8],
    ],
    (args) => new Trader(args.name!, args.results!, args.age!),
    'Trader'
  )
}

test('struct: roundtrip nested struct', (t) => {
  const trader = new Trader('bob ', new Results(20, 1200, -455), 22)
  const extraBytes = [0, 8]
  for (const extra of extraBytes) {
    const [buf, _] = Trader.struct.serialize(
      trader,
      Trader.struct.byteSize + extra
    )
    const [deserialized, offset] = Trader.struct.deserialize(buf)
    t.equal(offset, Trader.struct.byteSize, 'deserialize reads struct bytesize')

    spok(t, deserialized, trader)
  }
  t.end()
})
