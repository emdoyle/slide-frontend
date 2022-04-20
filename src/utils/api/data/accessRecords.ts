import { Program } from "@project-serum/anchor";
import { Slide } from "@slidexyz/slide-sdk";
import { PublicKey } from "@solana/web3.js";

export const ACCESS_RECORDS_KEY = "access-records";

export const fetchAccessRecords = async (
  program: Program<Slide>,
  expenseManager: PublicKey
) => {};
