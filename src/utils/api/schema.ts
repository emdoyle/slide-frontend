import { Slide } from "@slidexyz/slide-sdk";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program } from "@project-serum/anchor";
import {
  ACCESS_PROPOSALS_KEY,
  ACCESS_RECORDS_KEY,
  EXPENSE_MANAGERS_KEY,
  EXPENSE_PACKAGES_KEY,
  fetchAccessProposals,
  fetchAccessRecords,
  fetchExpenseManagers,
  fetchExpensePackages,
  fetchRealms,
  fetchSquads,
  fetchWithdrawalProposals,
  REALMS_KEY,
  SQUADS_KEY,
  WITHDRAWAL_PROPOSALS_KEY,
} from "./data";

export const SLIDE_SCHEMA: Record<
  string,
  (program: Program<Slide>, ...args: any[]) => Promise<any>
> = {
  [ACCESS_RECORDS_KEY]: fetchAccessRecords,
  [EXPENSE_MANAGERS_KEY]: fetchExpenseManagers,
  [EXPENSE_PACKAGES_KEY]: fetchExpensePackages,
  [ACCESS_PROPOSALS_KEY]: fetchAccessProposals,
  [WITHDRAWAL_PROPOSALS_KEY]: fetchWithdrawalProposals,
};

export const SPL_GOV_SCHEMA: Record<
  string,
  (connection: Connection, programId: PublicKey, ...args: any[]) => Promise<any>
> = {
  [REALMS_KEY]: fetchRealms,
};

export const SQUADS_SCHEMA: Record<
  string,
  (connection: Connection, programId: PublicKey, ...args: any[]) => Promise<any>
> = {
  [SQUADS_KEY]: fetchSquads,
};
