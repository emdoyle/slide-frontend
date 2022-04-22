import { Program } from "@project-serum/anchor";
import { address, Slide } from "@slidexyz/slide-sdk";
import { PublicKey } from "@solana/web3.js";
import { AccessRecordItem } from "../../../types";

export const ACCESS_RECORDS_KEY = "access-records";

export const fetchAccessRecords = async (
  program: Program<Slide>,
  expenseManager: PublicKey
) => {};

export const ACCESS_RECORD_KEY = "access-record";

export const fetchAccessRecord = async (
  program: Program<Slide>,
  expenseManager: PublicKey | undefined,
  user: PublicKey | null
): Promise<AccessRecordItem | null> => {
  if (!expenseManager || !user) {
    return null;
  }
  const [accessRecordPubkey] = address.getAccessRecordAddressAndBump(
    program.programId,
    expenseManager,
    user
  );
  const accessRecordAccount = await program.account.accessRecord.fetch(
    accessRecordPubkey
  );
  return {
    account: accessRecordAccount,
    publicKey: accessRecordPubkey,
  };
};
