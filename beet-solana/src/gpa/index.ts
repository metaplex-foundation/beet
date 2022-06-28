import {
  BeetField,
  BeetStruct,
  FixableBeet,
  FixableBeetStruct,
  FixedSizeBeet,
  isFixedSizeBeet,
} from '@metaplex-foundation/beet'
import {
  Connection,
  GetProgramAccountsConfig,
  GetProgramAccountsFilter,
  PublicKey,
} from '@solana/web3.js'
import { strict as assert } from 'assert'
import { logTrace } from '../utils'
import { encodeFixedBeet } from './util'

type FieldBeetType<T> =
  | FixedSizeBeet<T[keyof T]>
  | FixableBeet<T[keyof T], T[keyof T]>

export class GpaBuilder<T> {
  readonly config: GetProgramAccountsConfig = {}

  private constructor(
    private readonly programId: PublicKey,
    private readonly beets: Map<
      keyof T & string,
      {
        beet: FieldBeetType<T>
        offset: number
      }
    >,
    private readonly accountSize: number | undefined
  ) {}

  private _addFilter(filter: GetProgramAccountsFilter) {
    if (this.config.filters == null) {
      this.config.filters = []
    }

    this.config.filters.push(filter)

    return this
  }

  dataSize(size?: number) {
    size = size ?? this.accountSize
    assert(
      size != null,
      'for accounts of dynamic size the dataSize arg needs to be provided'
    )
    return this._addFilter({ dataSize: size })
  }

  private _addInnerFilter(
    key: keyof T & string,
    innerKey: string,
    val: T[keyof T]
  ) {
    logTrace(`gpa.addInnerFilter: ${key}.${innerKey}`)
    const outerBeetInfo = this.beets.get(key)
    assert(
      outerBeetInfo != null,
      'Outer filter key needs to be an existing field name'
    )

    const beetInfo = outerBeetInfo.beet as
      | BeetStruct<any>
      | FixableBeetStruct<any>

    let offset = outerBeetInfo.offset
    const outerBeet = isFixedSizeBeet(beetInfo)
      ? beetInfo
      : beetInfo.toFixedFromValue(val)

    let beet
    for (const [k, v] of outerBeet.fields) {
      if (k === innerKey) {
        beet = v
        break
      }
      offset += v.byteSize
    }
    assert(beet != null, `${innerKey} is not a field of the ${key} struct`)
    const bytes = encodeFixedBeet(beet, val)
    this._addFilter({ memcmp: { offset, bytes } })
    return this
  }

  /**
   * Adds a _memcmp_ filter for a field inside a field which is a struct value.
   * The provided keys need to be separated by a `.` and only one level of
   * nesting is supported at this point.
   *
   * The filter is applied to the inner value.
   *
   * ## Example
   *
   * ### Given:
   *
   * ```typescript
   * type Inner = {
   *   a: number
   * }
   * type Outer = {
   *   idx: number
   *   inner: Inner
   * }
   * ```
   * ### Apply a filter on `a` of the `Inner` type:
   *
   * ```typescript
   * gpaBuilder.addInnerFilter('inner.a', 2)
   * ```
   *
   * @param keys - the names of the fields by which to filter, i.e. `'outer.inner'`
   * @param val - the field value that the filter should match
   */
  addInnerFilter(keys: string, val: T[keyof T]) {
    const parts = keys.split('.')
    assert.equal(
      parts.length,
      2,
      `inner filters can go only one level deep, i.e. 'outer.inner' is ok, but 'outer.inner.deep' is not`
    )
    const [ka, kb] = parts as [keyof T & string, string]
    return this._addInnerFilter(ka, kb, val)
  }

  /**
   * Adds a _memcmp_ filter for the provided {@link key} of the struct.
   *
   * @param key - the name of the field by which to filter
   * @param val - the field value that the filter should match
   */
  addFilter(key: keyof T & string, val: T[keyof T]) {
    const beetInfo = this.beets.get(key)
    assert(beetInfo != null, 'Filter key needs to be an existing field name')

    const beet = isFixedSizeBeet(beetInfo.beet)
      ? beetInfo.beet
      : beetInfo.beet.toFixedFromValue(val)

    const bytes = encodeFixedBeet(beet, val)
    this._addFilter({ memcmp: { offset: beetInfo.offset, bytes } })
    return this
  }

  /**
   * Attempts to find the accounts matching the configured filters.
   *
   * @param connection used to query the program accounts on the cluster
   */
  run(connection: Connection) {
    return connection.getProgramAccounts(this.programId, this.config)
  }

  /**
   * Creates a GPA builder that supports adding up to four filters for
   * fixed size fields.
   * Once a non-fixed field is encountered, the remaining fields following it
   * will not be included as a filter option since it their position in the
   * bytes array will change depending on the content of the non-fixed field.
   *
   * @param programId the id of the program that owns the accounts we are querying
   * @param beetFields the beet fields that make up the structure of the account data
   */
  static fromBeetFields<T>(
    programId: PublicKey,
    beetFields: BeetField<T, T[keyof T]>[]
  ) {
    const map = new Map<
      keyof T & string,
      {
        beet: FieldBeetType<T>
        offset: number
      }
    >()

    let offset = 0
    let encounteredNonFixed = false
    for (const [k, v] of beetFields) {
      map.set(k, { beet: v as FieldBeetType<T>, offset })
      if (!isFixedSizeBeet(v)) {
        encounteredNonFixed = true
        break
      }
      offset += v.byteSize
    }
    const accountSize = encounteredNonFixed ? undefined : offset
    return new GpaBuilder<T>(programId, map, accountSize)
  }

  /**
   * Convenience wrapper around {@link GpaBuilder.fromBeetFields} that allows
   * providing a struct which contains the beet fields.
   */
  static fromStruct<T>(
    programId: PublicKey,
    struct: { fields: BeetField<T, T[keyof T]>[] }
  ) {
    return GpaBuilder.fromBeetFields(programId, struct.fields)
  }
}
