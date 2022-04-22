import { SLIDE_SCHEMA, SQUADS_SCHEMA, SPL_GOV_SCHEMA } from "./schema";
import { Slide } from "@slidexyz/slide-sdk";
import { Program } from "@project-serum/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import useSWRImmutable from "swr/immutable";

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
  ...args: any[]
) {
  return useSWRImmutable<T>(
    () => (program ? apiMethod : null),
    async (apiMethod) =>
      program ? await SlideFetcher(program, apiMethod, ...args) : null
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
