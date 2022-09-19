import test from 'tape'
import { inspect } from 'util'
import {
  Beet,
  FixableBeet,
  FixedSizeBeet,
  isFixedSizeBeet,
} from '../../src/beet'

export function deepInspect(obj: any) {
  return inspect(obj, { depth: 15, colors: true, getters: true })
}

export function deepLog(obj: any) {
  console.log(deepInspect(obj))
}

export function deepLogBeet(struct: Beet<any, any>) {
  // @ts-ignore accessing private fields
  if (typeof struct.fields === 'undefined') {
    deepLog(struct)
    return
  }
  // @ts-ignore accessing private fields
  for (const field of struct.fields) {
    const [, beet] = field
    const { write, read, ...rest } = beet
    // @ts-ignore incomplete field on purpose
    field[1] = rest
  }
  // @ts-ignore construct not always present
  const { construct, ...rest } = struct
  deepLog(rest)
}

export function checkFixedSerialize<T>(
  t: test.Test,
  fixedBeet: FixedSizeBeet<T>,
  value: T,
  data: number[],
  description: string
) {
  const buf = Buffer.alloc(fixedBeet.byteSize)
  fixedBeet.write(buf, 0, value)
  t.deepEqual(buf.toJSON().data, data, `serialize: '${description}'`)
}

export function checkFixedDeserialize<T>(
  t: test.Test,
  fixedBeet: FixedSizeBeet<T>,
  value: T,
  data: number[],
  description = `${deepInspect(value)}`
) {
  const actual = fixedBeet.read(Buffer.from(data), 0)
  t.deepEqual(actual, value, `deserialize: '${description}'`)
}

export function checkFixedSerialization<T>(
  t: test.Test,
  fixedBeet: FixedSizeBeet<T>,
  value: T,
  data: number[],
  description = `${deepInspect(value)}`
) {
  checkFixedSerialize(t, fixedBeet, value, data, description)
  checkFixedDeserialize(t, fixedBeet, value, data, description)
}

export function checkFixableFromDataSerialization<T>(
  t: test.Test,
  fixabledBeet: FixableBeet<T>,
  value: T,
  data: number[],
  description = `${deepInspect(value)}`
) {
  const fixedBeet = fixabledBeet.toFixedFromData(Buffer.from(data), 0)
  checkFixedSerialize(t, fixedBeet, value, data, description)
  checkFixedDeserialize(t, fixedBeet, value, data, description)
}

export function checkFixableFromValueSerialization<T>(
  t: test.Test,
  fixabledBeet: FixableBeet<T>,
  value: T,
  data: number[],
  description = `${deepInspect(value)}`
) {
  const fixedBeet = fixabledBeet.toFixedFromValue(value)
  checkFixedSerialize(t, fixedBeet, value, data, description)
  checkFixedDeserialize(t, fixedBeet, value, data, description)
}

export function checkFixedCases<T>(
  offsets: number[],
  cases: T[][],
  beet: FixedSizeBeet<T[]>,
  t: test.Test
) {
  for (const offset of offsets) {
    for (const x of cases) {
      {
        // Larger buffer
        const buf = Buffer.alloc(offset + beet.byteSize + offset)
        beet.write(buf, offset, x)
        const y = beet.read(buf, offset)
        t.deepEqual(x, y, `round trip ${x}, offset ${offset} larger buffer`)
      }
      {
        // Exact buffer
        const buf = Buffer.alloc(offset + beet.byteSize)
        beet.write(buf, offset, x)
        const y = beet.read(buf, offset)
        t.deepEqual(x, y, `round trip ${x}, offset ${offset} exact buffer`)
      }
    }
  }
}

export function checkFixableCases<T, V = Partial<T>>(
  offsets: number[],
  cases: V[][],
  fixable: FixableBeet<T[], V[]>,
  t: test.Test
) {
  for (const offset of offsets) {
    for (const x of cases) {
      {
        const beetFromVal = fixable.toFixedFromValue(x)

        // Larger buffer
        const buf = Buffer.alloc(offset + beetFromVal.byteSize + offset)
        beetFromVal.write(buf, offset, x)

        const beetFromData = fixable.toFixedFromData(buf, offset)
        const y = beetFromData.read(buf, offset)
        t.deepEqual(x, y, `round trip ${x}, offset ${offset} larger buffer`)
      }
      {
        const beetFromVal = fixable.toFixedFromValue(x)

        // Exact buffer
        const buf = Buffer.alloc(offset + beetFromVal.byteSize)
        beetFromVal.write(buf, offset, x)

        const beetFromData = fixable.toFixedFromData(buf, offset)
        const y = beetFromData.read(buf, offset)
        t.deepEqual(x, y, `round trip ${x}, offset ${offset} exact buffer`)
      }
    }
  }
}

// -----------------
// Sets
// -----------------
export function checkSetSerialize<K extends keyof any>(
  t: test.Test,
  m: Set<K>,
  setBeet: FixedSizeBeet<Set<K>>,
  keyBeet: Beet<K, K>
) {
  const serializedSet = Buffer.alloc(setBeet.byteSize)
  setBeet.write(serializedSet, 0, m)

  serializedSetIncludesKeys(t, serializedSet, m, keyBeet)
}

/**
 * Verifies that each key of the provided set value {@link s} is contained in
 * the {@link serializedSet}.
 * Set keys aren't ordered and thus it is unknown how they are written to
 * the buffer when serialized.
 * Therefore we cannot compare the serialized buffers directly but have to look
 * each key up one by one.
 */
function serializedSetIncludesKeys<K extends keyof any>(
  t: test.Test,
  serializedSet: Buffer,
  s: Set<K>,
  keyBeet: Beet<K, K>
) {
  for (const k of s) {
    const fixedKey = fixFromValIfNeeded(keyBeet, k)

    const keyBuf = Buffer.alloc(fixedKey.byteSize)

    fixedKey.write(keyBuf, 0, k)

    const key = deepInspect(k)
    t.assert(
      bufferIncludes(serializedSet, keyBuf),
      `serialized set includes ${key}`
    )
  }
}

// -----------------
// Maps
// -----------------
export function checkMapSerialize<K extends keyof any, V>(
  t: test.Test,
  m: Map<K, V>,
  mapBeet: FixedSizeBeet<Map<K, V>>,
  keyBeet: Beet<K, K>,
  valBeet: Beet<V, V>
) {
  const serializedMap = Buffer.alloc(mapBeet.byteSize)
  mapBeet.write(serializedMap, 0, m)

  serializedMapIncludesKeyVals(t, serializedMap, m, keyBeet, valBeet)
}

/**
 * Verifies that each keyval of the provided map value {@link m} is contained in
 * the {@link serializedMap}.
 * Map key/vals aren't ordered and thus it is unknown how they are written to
 * the buffer when serialized.
 * Therefore we cannot compare the serialized buffers directly but have to look
 * each key/val up one by one.
 */
function serializedMapIncludesKeyVals<K extends keyof any, V>(
  t: test.Test,
  serializedMap: Buffer,
  m: Map<K, V>,
  keyBeet: Beet<K, K>,
  valBeet: Beet<V, V>
) {
  for (const [k, v] of m) {
    const fixedKey = fixFromValIfNeeded(keyBeet, k)
    const fixedVal = fixFromValIfNeeded(valBeet, v)

    const keyBuf = Buffer.alloc(fixedKey.byteSize)
    const valBuf = Buffer.alloc(fixedVal.byteSize)

    fixedKey.write(keyBuf, 0, k)
    fixedVal.write(valBuf, 0, v)

    const keyVal = deepInspect({ [k]: v })
    t.assert(
      bufferIncludes(serializedMap, Buffer.concat([keyBuf, valBuf])),
      `serialized map includes ${keyVal}`
    )
  }
}

function fixFromValIfNeeded<T, V>(beet: Beet<T, V>, v: V): FixedSizeBeet<T, V> {
  return isFixedSizeBeet(beet)
    ? beet
    : (beet as FixableBeet<T, V>).toFixedFromValue(v)
}

export function bufferIncludes(buf: Buffer, snippet: Buffer) {
  return buf.toString('hex').includes(snippet.toString('hex'))
}
