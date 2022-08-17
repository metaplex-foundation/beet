import BN from 'bn.js'
import test from 'tape'
import {
  u8,
  map,
  utf8String,
  i8,
  array,
  i32,
  i64,
  bignum,
} from '../../src/beet'
import { checkFixedDeserialize, checkMapSerialize, deepInspect } from '../utils'
import fixture from './fixtures/maps.json'

function hashToMap<K extends keyof any, V>(
  hash: any,
  keyConverter: (k: string) => any = (k) => k
): Map<K, V> {
  const map = new Map()
  for (const [k, v] of Object.entries(hash)) {
    // NOTE: that the compat data is JSON and thus all keys are represented as strings
    // we fix that here
    map.set(keyConverter(k), v)
  }
  return map
}

test('compat maps top level: HashMap<u8, u8>', (t) => {
  const beet = map(u8, u8)
  for (const { value, data } of fixture.hash_map_u8_u8s) {
    const m: Map<number, number> = hashToMap(value, parseInt)

    const fixedBeetFromData = beet.toFixedFromData(Buffer.from(data), 0)
    checkFixedDeserialize(t, fixedBeetFromData, m, data)
    checkMapSerialize(t, m, fixedBeetFromData, u8, u8)

    const fixedBeetFromValue = beet.toFixedFromValue(m)
    checkFixedDeserialize(t, fixedBeetFromValue, m, data)
    checkMapSerialize(t, m, fixedBeetFromValue, u8, u8)
  }
  t.end()
})

// NOTE: this merely confirms that HashMap and BTreeMap data is layed out the same way when serialized
test('compat maps top level: BTreeMap<u8, u8>', (t) => {
  const beet = map(u8, u8)
  for (const { value, data } of fixture.btree_map_u8_u8s) {
    const m: Map<number, number> = hashToMap(value, parseInt)

    const fixedBeetFromData = beet.toFixedFromData(Buffer.from(data), 0)
    checkFixedDeserialize(t, fixedBeetFromData, m, data)
    checkMapSerialize(t, m, fixedBeetFromData, u8, u8)

    const fixedBeetFromValue = beet.toFixedFromValue(m)
    checkFixedDeserialize(t, fixedBeetFromValue, m, data)
    checkMapSerialize(t, m, fixedBeetFromValue, u8, u8)
  }
  t.end()
})

test('compat maps top level: HashMap<string, i32>', (t) => {
  const beet = map(utf8String, i32)
  for (const { value, data } of fixture.hash_map_string_i32s) {
    const m: Map<string, number> = hashToMap(value)
    const fixedBeetFromData = beet.toFixedFromData(Buffer.from(data), 0)
    checkFixedDeserialize(t, fixedBeetFromData, m, data)
    checkMapSerialize(t, m, fixedBeetFromData, utf8String, i32)

    const fixedBeetFromValue = beet.toFixedFromValue(m)
    checkFixedDeserialize(t, fixedBeetFromValue, m, data)
    checkMapSerialize(t, m, fixedBeetFromValue, utf8String, i32)
  }
  t.end()
})

test('compat maps top level: HashMap<string, i8[]>', (t) => {
  const beet = map(utf8String, array(i8))
  for (const { value, data } of fixture.hash_map_string_vec_i8s) {
    const fixedBeetFromData = beet.toFixedFromData(Buffer.from(data), 0)
    const m: Map<string, number[]> = hashToMap(value)
    checkFixedDeserialize(t, fixedBeetFromData, m, data)
    checkMapSerialize(t, m, fixedBeetFromData, utf8String, array(i8))

    const fixedBeetFromValue = beet.toFixedFromValue(m)
    checkFixedDeserialize(t, fixedBeetFromValue, m, data)
    checkMapSerialize(t, m, fixedBeetFromValue, utf8String, array(i8))
  }
  t.end()
})

test('compat maps top level: Vec<HashMap<string, i64>>', (t) => {
  // To properly compare we need to convert the map into a hash + convert the
  // BNs to numbers since that is how they are presented in the JSON fixture
  function unmapped(actual: Map<string, Partial<bignum>>[]) {
    return actual.map((x) => {
      const hash: Record<string, number> = {}
      for (const [k, v] of x) {
        hash[k] = new BN(v as bignum).toNumber()
      }
      return hash
    })
  }

  // In order to create a beet from value we need to first convert the hash
  // objects from the JSON fixture into proper maps
  function mapped(vals: Record<string, number | undefined>[]) {
    return vals.map((x) => {
      const map = new Map()
      for (const [k, v] of Object.entries(x)) {
        map.set(k, new BN(v as bignum))
      }
      return map
    })
  }

  // NOTE: this checks deserialization only as it turned out complex enough
  // already to set up this test
  const beet = array(map(utf8String, i64))
  for (const { value, data } of fixture.vec_hash_map_string_i64s) {
    {
      const fixedBeetFromData = beet.toFixedFromData(Buffer.from(data), 0)

      // Serialization
      const actual = fixedBeetFromData.read(Buffer.from(data), 0)
      t.deepEqual(
        unmapped(actual),
        value,
        `deserialize: '${deepInspect(value)}'`
      )

      // Deserialization
      const serialized = Buffer.alloc(fixedBeetFromData.byteSize)
      fixedBeetFromData.write(serialized, 0, actual)
      t.deepEqual(
        serialized.toJSON().data,
        data,
        `serialize: '${deepInspect(value)}'`
      )
    }

    {
      const fixedBeetFromValue = beet.toFixedFromValue(mapped(value))

      // Serialization
      const actual = fixedBeetFromValue.read(Buffer.from(data), 0)
      t.deepEqual(
        unmapped(actual),
        value,
        `deserialize: '${deepInspect(value)}'`
      )

      // Deserialization
      const serialized = Buffer.alloc(fixedBeetFromValue.byteSize)
      fixedBeetFromValue.write(serialized, 0, actual)
      t.deepEqual(
        serialized.toJSON().data,
        data,
        `serialize: '${deepInspect(value)}'`
      )
    }
  }
  t.end()
})
