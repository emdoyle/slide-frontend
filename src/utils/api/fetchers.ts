import { SLIDE_SCHEMA, SQUADS_SCHEMA, SPL_GOV_SCHEMA } from "./schema";
import { Slide } from "@slidexyz/slide-sdk";
import { Program } from "@project-serum/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import useSWRImmutable from "swr/immutable";
import { Arguments, Key, SWRConfiguration } from "swr";

// If given Arguments is falsy, we want to passthrough
// the value to maintain the intent of the caller (to prevent query).
// The rest of the logic is just to handle scalar vs array Arguments.
const attachToCacheKey = (args: Arguments, ...toAttach: any[]) => {
  if (!args) {
    return args;
  } else if (Array.isArray(args)) {
    return [...toAttach, ...args];
  }
  return [...toAttach, args];
};

export const SlideFetcher = async (
  program: Program<Slide>,
  apiMethod: string,
  ...args: any[]
) => {
  return await SLIDE_SCHEMA[apiMethod](program, ...args);
};

// This handles the undefined check on 'program' automatically and otherwise
// allows the caller to specify any valid Key. This also keeps 'program' from
// ending up as a cache key (which wouldn't serialize properly).
export function useSlideSWRImmutable<T>(
  program: Program<Slide> | undefined,
  apiMethod: string,
  _key?: Key,
  options: SWRConfiguration = {}
) {
  let key: Key;
  if (!_key) {
    key = () => (program ? apiMethod : null);
  } else if (typeof _key === "function") {
    key = () => (program ? attachToCacheKey(_key(), apiMethod) : null);
  } else {
    key = () => (program ? attachToCacheKey(_key, apiMethod) : null);
  }
  return useSWRImmutable<T>(
    key,
    async (apiMethod, ...args) =>
      program ? await SlideFetcher(program, apiMethod, ...args) : null,
    options
  );
}

export const SPLGovFetcher = async (
  connection: Connection,
  programId: PublicKey,
  apiMethod: string,
  ...args: any[]
) => {
  return await SPL_GOV_SCHEMA[apiMethod](connection, programId, ...args);
};

// This keeps the connection from ending up as a cache key but allows any valid
// Key otherwise.
export function useSPLGovSWRImmutable<T>(
  connection: Connection,
  programId: PublicKey,
  apiMethod: string,
  _key?: Key,
  options: SWRConfiguration = {}
) {
  let key: Key;
  if (!_key) {
    key = apiMethod;
  } else if (typeof _key === "function") {
    key = () => attachToCacheKey(_key(), programId, apiMethod);
  } else {
    key = () => attachToCacheKey(_key, programId, apiMethod);
  }
  return useSWRImmutable<T>(
    key,
    async (_programId, apiMethod, ...args) =>
      SPLGovFetcher(connection, programId, apiMethod, ...args),
    options
  );
}

export const SquadsFetcher = async (
  connection: Connection,
  programId: PublicKey,
  apiMethod: string,
  ...args: any[]
) => {
  return await SQUADS_SCHEMA[apiMethod](connection, programId, ...args);
};

// This keeps the connection from ending up as a cache key but allows any valid
// Key otherwise.
export function useSquadsSWRImmutable<T>(
  connection: Connection,
  programId: PublicKey,
  apiMethod: string,
  _key?: Key,
  options: SWRConfiguration = {}
) {
  let key: Key;
  if (!_key) {
    key = apiMethod;
  } else if (typeof _key === "function") {
    key = () => attachToCacheKey(_key(), programId, apiMethod);
  } else {
    key = () => attachToCacheKey(_key, programId, apiMethod);
  }
  return useSWRImmutable<T>(
    key,
    async (_programId, apiMethod, ...args) =>
      SquadsFetcher(connection, programId, apiMethod, ...args),
    options
  );
}
