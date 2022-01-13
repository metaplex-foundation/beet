import test from 'tape'
import spok from 'spok'
import {
  Beet,
  BeetStruct,
  COption,
  coption,
  dataEnum,
  DataEnum,
  fixedSizeArray,
  i32,
  FixedBeetCollection,
  u16,
  u8,
} from '../src/beet'

class Result {
  constructor(
    readonly win: number,
    readonly totalWin: number,
    readonly losses: number
  ) {}

  static readonly struct = new BeetStruct<Result>(
    [
      ['win', u8],
      ['totalWin', u16],
      ['losses', i32],
    ],
    (args) => new Result(args.win!, args.totalWin!, args.losses!),
    'Results'
  )
}
const result1 = () => new Result(20, 1200, -455)
const result2 = () => new Result(30, 100, -3)
const result3 = () => new Result(3, 999, 0)

test('struct: roundtrip COption<struct>', (t) => {
  const beet: Beet<COption<Result>> = coption(Result.struct)
  const offsets = [0, 8]

  for (const offset of offsets) {
    const buf = Buffer.alloc(offset + beet.byteSize + offset)
    beet.write(buf, offset, result1())
    const deserialized = beet.read(buf, offset)

    spok(t, deserialized, result1())
  }
  t.end()
})

test('struct: roundtrip Array<struct>', (t) => {
  const beet: FixedBeetCollection<Result> = fixedSizeArray(Result.struct, 3)
  const offsets = [0, 8]

  for (const offset of offsets) {
    const buf = Buffer.alloc(offset + beet.byteSize + offset)
    beet.write(buf, offset, [result1(), result2(), result3()])
    const deserialized = beet.read(buf, offset)

    spok(t, deserialized, [result1(), result2(), result3()])
  }
  t.end()
})

enum ResultKind {
  Good,
  Bad,
}

test('struct: roundtrip enum<struct>', (t) => {
  const goodResult: DataEnum<ResultKind, Result> = {
    kind: ResultKind.Good,
    data: result3(),
  }
  const badResult: DataEnum<ResultKind, Result> = {
    kind: ResultKind.Bad,
    data: result2(),
  }
  const beet: Beet<DataEnum<ResultKind, Result>> = dataEnum(Result.struct)

  const offsets = [0, 8]

  for (const offset of offsets) {
    const buf = Buffer.alloc(offset + beet.byteSize + offset)
    beet.write(buf, offset, goodResult)
    const deserialized = beet.read(buf, offset)

    spok(t, deserialized, goodResult)
  }

  for (const offset of offsets) {
    const buf = Buffer.alloc(offset + beet.byteSize + offset)
    beet.write(buf, offset, badResult)
    const deserialized = beet.read(buf, offset)

    spok(t, deserialized, badResult)
  }
  t.end()
})
