import {
  Beet,
  uniformDataEnum,
  UniformDataEnum,
  uniformFixedSizeArray,
  fixedSizeUtf8String,
  FixedSizeBeet,
  u8,
} from '../../src/beet'
import test from 'tape'

enum Color {
  red = 0,
  green = 1,
  blue = 2,
}

enum Seats {
  HU,
  Short,
  Full,
}

function checkCases<Kind, Data>(
  offsets: number[],
  cases: UniformDataEnum<Kind, Data>[],
  beet: FixedSizeBeet<UniformDataEnum<Kind, Data>>,
  resolve: Record<number, string>,
  t: test.Test
) {
  for (const offset of offsets) {
    for (const expected of cases) {
      {
        // Larger buffer
        const buf = Buffer.alloc(offset + beet.byteSize + offset)
        beet.write(buf, offset, expected)
        const actual = beet.read(buf, offset)
        t.deepEqual(
          actual,
          expected,
          `round trip dataEnum(${resolve[expected.kind]}, ${
            expected.data
          }), offset ${offset} larger buffer`
        )
      }
      {
        // Exact buffer
        const buf = Buffer.alloc(offset + beet.byteSize)
        beet.write(buf, offset, expected)
        const actual = beet.read(buf, offset)
        t.deepEqual(
          actual,
          expected,
          `round trip dataEnum(${resolve[expected.kind]}, ${
            expected.data
          }), offset ${offset} exact buffer`
        )
      }
    }
  }
}

test('composites: DataEnum<Color, string>', (t) => {
  const cases = [
    { kind: Color.red, data: 'red++' },
    { kind: Color.green, data: 'green' },
    { kind: Color.blue, data: 'blue+' },
  ]

  const offsets = [0, 4]
  const beet: FixedSizeBeet<UniformDataEnum<Color, string>> = uniformDataEnum(
    fixedSizeUtf8String(5)
  )

  checkCases(offsets, cases, beet, Color, t)
  t.end()
})

test('composites: DataEnum<Seats, u8>', (t) => {
  const cases = [
    { kind: Seats.HU, data: 2 },
    { kind: Seats.Short, data: 6 },
    { kind: Seats.Full, data: 9 },
  ]

  const offsets = [0, 4]
  const beet: Beet<UniformDataEnum<Seats, number>> = uniformDataEnum(u8)

  checkCases(offsets, cases, beet, Seats, t)
  t.end()
})

test('composites: DataEnum<Seats, u8[]>', (t) => {
  const cases = [
    { kind: Seats.HU, data: [1, 2, 0, 0, 0, 0, 0, 0, 0] },
    { kind: Seats.Short, data: [1, 2, 3, 4, 5, 6, 0, 0, 0] },
    { kind: Seats.Full, data: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  ]

  const offsets = [0, 4]
  const beet: Beet<UniformDataEnum<Seats, number[]>> = uniformDataEnum(
    uniformFixedSizeArray(u8, 9)
  )

  checkCases(offsets, cases, beet, Seats, t)
  t.end()
})
