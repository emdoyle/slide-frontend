import { Slide } from "@slidexyz/slide-sdk";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program } from "@project-serum/anchor";
import {
  ACCESS_RECORD_KEY,
  ACCESS_RECORDS_KEY,
  EXPENSE_MANAGER_KEY,
  EXPENSE_MANAGERS_KEY,
  EXPENSE_PACKAGES_KEY,
  fetchAccessRecord,
  fetchAccessRecords,
  fetchExpenseManager,
  fetchExpenseManagers,
  fetchExpensePackages,
  fetchRealms,
  fetchSPLGovProposals,
  fetchSquads,
  fetchSquadsProposals,
  fetchTreasuries,
  REALMS_KEY,
  SPL_GOV_PROPOSALS_KEY,
  SQUADS_KEY,
  SQUADS_PROPOSALS_KEY,
  TREASURIES_KEY,
} from "./data";

export const SLIDE_SCHEMA: Record<
  string,
  (program: Program<Slide>, ...args: any[]) => Promise<any>
> = {
  [ACCESS_RECORD_KEY]: fetchAccessRecord,
  [ACCESS_RECORDS_KEY]: fetchAccessRecords,
  [EXPENSE_MANAGER_KEY]: fetchExpenseManager,
  [EXPENSE_MANAGERS_KEY]: fetchExpenseManagers,
  [EXPENSE_PACKAGES_KEY]: fetchExpensePackages,
};

export const SPL_GOV_SCHEMA: Record<
  string,
  (connection: Connection, programId: PublicKey, ...args: any[]) => Promise<any>
> = {
  [REALMS_KEY]: fetchRealms,
  [TREASURIES_KEY]: fetchTreasuries,
  [SPL_GOV_PROPOSALS_KEY]: fetchSPLGovProposals,
};

export const SQUADS_SCHEMA: Record<
  string,
  (connection: Connection, programId: PublicKey, ...args: any[]) => Promise<any>
> = {
  [SQUADS_KEY]: fetchSquads,
  [SQUADS_PROPOSALS_KEY]: fetchSquadsProposals,
};
