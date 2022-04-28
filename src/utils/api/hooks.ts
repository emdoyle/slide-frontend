import { Connection } from "@solana/web3.js";
import useSWRImmutable from "swr/immutable";
import { Fetcher, Key, SWRConfiguration } from "swr";
import { FetcherResponse } from "swr/dist/types";
import { Slide } from "@slidexyz/slide-sdk";
import { Program } from "@project-serum/anchor";

const attachToCacheKey = (key: Key, toAttach: any): Key => {
  if (!key) {
    // If given Key is falsy, we want to passthrough to disable fetching
    return key;
  } else if (Array.isArray(key) && key.length === 0) {
    // If given Key is an empty array, we want to use toAttach alone
    return toAttach;
  } else if (Array.isArray(key)) {
    // If given Key is a concrete array, attaching to the front is simple
    return [toAttach, ...key];
  } else if (typeof key === "function") {
    // If given Key is a Function, we want to return a Function which will
    // wrap the Key's result with a recursive call to add toAttach.
    // Shouldn't really allow recursing into this branch but we do want
    // to repeat the null/scalar/array checks.
    return () => attachToCacheKey(key(), toAttach);
  }
  // The Key is a scalar value and we construct an array to add toAttach.
  return [toAttach, key];
};

// This implicitly uses the 'name' of the 'fetcher' argument as a leading
// cache key.
// Note that when using a global mutate, this name will need to be passed
// explicitly as part of the key.
export function useFnSWRImmutable<D = any, E = any>(
  _key: Key,
  fetcher: Fetcher<D, Key>,
  options: SWRConfiguration<D, E, Fetcher<D, Key>> = {},
  fnNameOverride: string = ""
) {
  const key = attachToCacheKey(_key, fnNameOverride ?? fetcher.name);
  return useSWRImmutable<D, E, Key>(
    key,
    async (name: string, ...args: any[]) => await fetcher(...args),
    options
  );
}

// TODO: can combine these ideas but the type checking seems a little annoying

// This takes a 'Program' as a parameter instead of the typical pattern of
// passing arguments via 'Key' with useSWR.
// This avoids the problem of serializing/deserializing Program as part of
// the cache key.
// This function also handles the 'undefined' check on program automatically
// so that it can be used more easily with useSlideProgram.
export function useFnSWRImmutableWithProgram<D = any, E = any>(
  program: Program<Slide> | undefined,
  key: Key,
  fetcher: (program: Program<Slide>, ...args: any[]) => FetcherResponse<D>,
  options: SWRConfiguration = {}
) {
  return useFnSWRImmutable<D | null, E>(
    () => (program ? key : null),
    async (...args: any[]) => {
      return program ? await fetcher(program, ...args) : null;
    },
    options,
    fetcher.name
  );
}

// This takes a 'Connection' as a parameter instead of the typical pattern of
// passing arguments via 'Key' with useSWR.
// This avoids the problem of serializing/deserializing Connection as part of
// the cache key.
export function useFnSWRImmutableWithConnection<D = any, E = any>(
  connection: Connection,
  key: Key,
  fetcher: (connection: Connection, ...args: any[]) => FetcherResponse<D>,
  options: SWRConfiguration = {}
) {
  return useFnSWRImmutable<D, E>(
    key,
    async (...args: any[]) => await fetcher(connection, ...args),
    options,
    fetcher.name
  );
}
