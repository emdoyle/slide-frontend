import { SLIDE_SCHEMA, SQUADS_SCHEMA, SPL_GOV_SCHEMA } from "./schema";
import { Slide } from "@slidexyz/slide-sdk";
import { Program } from "@project-serum/anchor";
import { Connection, PublicKey } from "@solana/web3.js";

export const SlideFetcher = async (
  program: Program<Slide>,
  apiMethod: string,
  ...args: any[]
) => {
  return await SLIDE_SCHEMA[apiMethod](program, ...args);
};

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
