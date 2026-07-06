import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CBR4V5L5ES2RMLHCXAGJAGI3GAEPFK4H744UJP6DIXM7FZA2CSB47ZWN",
  }
} as const

export const Errors = {
  1: {message:"InvalidConfig"},
  2: {message:"JarNotFound"},
  3: {message:"ZeroDeposit"},
  4: {message:"NotOwner"},
  5: {message:"AlreadyWithdrawn"},
  6: {message:"StillLocked"}
}


export interface JarData {
  asset: string;
  balance: i128;
  created_at: u64;
  owner: string;
  target_amount: i128;
  target_date: u64;
  unlock_type: UnlockType;
  withdrawn: boolean;
}

export type UnlockType = {tag: "DateOnly", values: void} | {tag: "GoalOnly", values: void} | {tag: "EitherOne", values: void} | {tag: "BothRequired", values: void};




export interface Client {
  /**
   * Construct and simulate a deposit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  deposit: ({jar_id, depositor, amount}: {jar_id: u64, depositor: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_jar transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_jar: ({jar_id}: {jar_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<JarData>>>

  /**
   * Construct and simulate a withdraw transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  withdraw: ({jar_id, caller}: {jar_id: u64, caller: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a create_jar transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  create_jar: ({owner, asset, unlock_type, target_date, target_amount}: {owner: string, asset: string, unlock_type: UnlockType, target_date: u64, target_amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a is_unlocked transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  is_unlocked: ({jar_id}: {jar_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<boolean>>>

  /**
   * Construct and simulate a get_user_jars transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_user_jars: ({owner}: {owner: string}, options?: MethodOptions) => Promise<AssembledTransaction<Array<u64>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "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" ]),
      options
    )
  }
  public readonly fromJSON = {
    deposit: this.txFromJSON<Result<void>>,
        get_jar: this.txFromJSON<Result<JarData>>,
        withdraw: this.txFromJSON<Result<void>>,
        create_jar: this.txFromJSON<Result<u64>>,
        is_unlocked: this.txFromJSON<Result<boolean>>,
        get_user_jars: this.txFromJSON<Array<u64>>
  }
}