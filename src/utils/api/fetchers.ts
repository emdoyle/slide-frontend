import { SLIDE_SCHEMA, SQUADS_SCHEMA, SPL_GOV_SCHEMA } from "./schema";
import { Slide } from "@slidexyz/slide-sdk";
import { Program } from "@project-serum/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import useSWRImmutable from "swr/immutable";
import { Key, SWRConfiguration } from "swr";

export const SlideFetcher = async (
  program: Program<Slide>,
  apiMethod: string,
  ...args: any[]
) => {
  return await SLIDE_SCHEMA[apiMethod](program, ...args);
};

// purely for convenience to avoid needing to write out the program undefined
// checks every time
export function useSlideSWRImmutable<T>(
  program: Program<Slide> | undefined,
  apiMethod: string,
  args?: any[],
  options: SWRConfiguration = {}
) {
  let key: Key;
  if (args?.length) {
    key = [apiMethod, ...args];
  } else {
    key = apiMethod;
  }
  return useSWRImmutable<T>(
    () => (program ? key : null),
    async (apiMethod, ...innerArgs) =>
      program ? await SlideFetcher(program, apiMethod, ...innerArgs) : null,
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

export const SquadsFetcher = async (
  connection: Connection,
  programId: PublicKey,
  apiMethod: string,
  ...args: any[]
) => {
  return await SQUADS_SCHEMA[apiMethod](connection, programId, ...args);
};
