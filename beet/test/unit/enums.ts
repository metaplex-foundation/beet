import { Enum, FixedSizeBeet, fixedScalarEnum } from '../../src/beet'
import test from 'tape'

enum Color {
  red = 11,
  green = 22,
  blue = 33,
}

enum Seat {
  HU,
  Short,
  Full,
}

function checkCases<Kind>(
  offsets: number[],
  cases: Enum<Kind>[],
  beet: FixedSizeBeet<Enum<Kind>, Enum<Kind>>,
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
          `round trip Enum(${
            resolve[expected as number]
          }, ${expected}), offset ${offset} larger buffer`
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
          `round trip Enum(${
            resolve[expected as number]
          }, ${expected}), offset ${offset} exact buffer`
        )
      }
    }
  }
}

test('composites: Enum<Color> with assigned variants', (t) => {
  const cases = [Color.red, Color.green, Color.blue]

  const offsets = [0, 4]
  const beet: FixedSizeBeet<
    Enum<typeof Color>,
    Enum<typeof Color>
  > = fixedScalarEnum(Color)

  checkCases(offsets, cases, beet, Color, t)
  t.end()
})

test('composites: Enum<Seat> with default variants', (t) => {
  const cases = [Seat.HU, Seat.Full, Seat.Short]

  const offsets = [0, 4]
  const beet: FixedSizeBeet<
    Enum<typeof Seat>,
    Enum<typeof Seat>
  > = fixedScalarEnum(Seat)

  checkCases(offsets, cases, beet, Seat, t)
  t.end()
})
