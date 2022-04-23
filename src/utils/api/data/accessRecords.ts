import { Program } from "@project-serum/anchor";
import { address, Slide } from "@slidexyz/slide-sdk";
import { PublicKey } from "@solana/web3.js";
import { AccessRecordItem } from "../../../types";

export const ACCESS_RECORDS_KEY = "access-records";

export const fetchAccessRecords = async (
  program: Program<Slide>,
  expenseManager: PublicKey
): Promise<AccessRecordItem[]> => {
  const managerFilter = {
    memcmp: { offset: 41, bytes: expenseManager.toBase58() },
  };
  return await program.account.accessRecord.all([managerFilter]);
};

export const ACCESS_RECORD_KEY = "access-record";

export const fetchAccessRecord = async (
  program: Program<Slide>,
  expenseManager: PublicKey,
  user: PublicKey
): Promise<AccessRecordItem> => {
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
