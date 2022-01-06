# @metaplex-foundation/beet

Strict borsh compatible de/serializer.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Features](#features)
- [Non-Features](#non-features)
- [API](#api)
- [Examples](#examples)
  - [Single Struct Configuration](#single-struct-configuration)
  - [Nested Struct Configuration](#nested-struct-configuration)
  - [Struct with non-primitive fields](#struct-with-non-primitive-fields)
  - [Using Beet Primitives Directly](#using-beet-primitives-directly)
  - [Using Beet Composites Directly](#using-beet-composites-directly)
    - [Option](#option)
    - [Array](#array)
    - [Enum with Data Variants](#enum-with-data-variants)
- [LICENSE](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


## Features

- fully composable, i.e. `coption(fixedSizeArray(fixedSizeUtf8String(4), 8))` is handled
correctly
- structs can be nested and composed
- pre-computes `byteSize` of any type, no matter how deeply nested or composed it is
- logs struct configs including byte sizes as well as de/serialization tasks for easy
diagnostics

```
beet:debug struct GameStruct {
beet:debug   win: u8 1 B
beet:debug   totalWin: u16 2 B
beet:debug   whaleAccount: u128 16 B
beet:debug   losses: i32 4 B
beet:debug } 23 B +0ms
beet:trace serializing [GameStruct] _GameScore { win: 1, totalWin: 100, whaleAccount: <BN: fffffffffffffffffffffffffffffffb>, losses: -234 } to 23 bytes buffer +0ms
beet:trace deserializing [GameStruct] from 23 bytes buffer +2ms
beet:trace <Buffer 01 64 00 fb ff ff ff ff ff ff ff ff ff ff ff ff ff ff ff 16 ff ff ff> +0ms
beet:trace [
beet:trace     1, 100,   0, 251, 255, 255,
beet:trace   255, 255, 255, 255, 255, 255,
beet:trace   255, 255, 255, 255, 255, 255,
beet:trace   255,  22, 255, 255, 255
beet:trace ] +0ms
```

## Non-Features

Beet does not support dynamically sized data types as this would make it impossible to
precompute byte sizes and would make it necessary to resize buffers which negatively affects
performance.

If you need dynamically sized data types please use borsh implementation that implements the
entire [borsh spec](https://borsh.io/) instead, i.e. [borsh-js](https://github.com/near/borsh-js).

## API

Please find the [API docs here](https://metaplex-foundation.github.io/beet/docs/beet).

## Examples

### Single Struct Configuration

```ts
import { BeetStruct, i32, u16, u8 } from '@metaplex-foundation/beet'

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
```

### Nested Struct Configuration

**NOTE:** uses `Result` struct from the above example for the `results` field of `Trader`

```ts
import { BeetStruct, fixedSizeUtf8String } from '@metaplex-foundation/beet'
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
  
const trader = new Trader('bob ', new Results(20, 1200, -455), 22)
const [buf] = Trader.struct.serialize(trader)
const [deserializedTrader] = Trader.struct.deserialize(buf)
```

### Struct with non-primitive fields

**NOTE:** depends on `beet-solana` extension package for the `PublicKey` implementation

```ts
import * as web3 from '@solana/web3.js'
import * as beet from '@metaplex-foundation/beet'
import * as beetSolana from '@metaplex-foundation/beet-solana'

type InstructionArgs = {
  instructionDiscriminator: number[]
  authority: web3.PublicKey
  maybePublickKey: beet.COption<web3.PublicKey>
}

// Uses the BeetArgsStruct wrapper around BeetStruct
const createStruct = new beet.BeetArgsStruct<InstructionArgs>(
  [
    ['instructionDiscriminator', beet.fixedSizeArray(beet.u8, 8)],
    ['authority', beetSolana.publicKey],
    ['maybePublickKey', beet.coption(beetSolana.publicKey)],
  ],
  'InstructionArgs'
)
```

### Using Beet Primitives Directly

```ts
import { u8 } from '@metaplex-foundation/beet'
const n = 1
const buf = Buffer.alloc(u8.byteSize)
u8.write(buf, 0, n)
u8.read(buf, 0) // === 1
```

### Using Beet Composites Directly

**NOTE:** use `Result` struct from the above example to wrap in a _Composite_ type 

#### Option

```ts
const resultOption: Beet<COption<Result>> = coption(Result.struct)

const result = new Result(20, 1200, -455)
const buf = Buffer.alloc(resultOption.byteSize)
resultOption.write(buf, 0, result)
beet.read(buf, 0) // same  as result
```

#### Array

```ts
const resultArray: Beet<Array<Result>> = fixedSizeArray(Result.struct, 3)
const results =[ new Result(20, 1200, -455), new Result(3, 999, 0), new Result(30, 100, -3) ]
const buf = Buffer.alloc(resultArray.byteSize)
beet.write(buf, 0, results)
beet.read(buf, 0) // same  as results
```

#### Enum with Data Variants

```ts
enum ResultKind {
  Good,
  Bad,
}

const goodResult: DataEnum<ResultKind, Result> = {
  kind: ResultKind.Good,
  data: new Result(20, 1200, -455),
}
const resultEnum: Beet<DataEnum<ResultKind, Result>> = dataEnum(Result.struct)

const buf = Buffer.alloc(resultEnum.byteSize)
beet.write(buf, 0, goodResult)
beet.read(buf, 0) // same as goodResult
```

## LICENSE

Apache-2.0
