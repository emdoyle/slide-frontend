import { Program } from "@project-serum/anchor";
import { Slide, getAccessRecordAddressAndBump } from "@slidexyz/slide-sdk";
import { PublicKey } from "@solana/web3.js";
import { AccessRecordItem } from "../../../types";

export async function fetchAccessRecords(
  program: Program<Slide>,
  expenseManager: PublicKey
): Promise<AccessRecordItem[]> {
  const managerFilter = {
    memcmp: { offset: 41, bytes: expenseManager.toBase58() },
  };
  return await program.account.accessRecord.all([managerFilter]);
}

export async function fetchAccessRecord(
  program: Program<Slide>,
  expenseManager: PublicKey,
  user: PublicKey
): Promise<AccessRecordItem> {
  const [accessRecordPubkey] = getAccessRecordAddressAndBump(
    expenseManager,
    user,
    program.programId
  );
  const accessRecordAccount = await program.account.accessRecord.fetch(
    accessRecordPubkey
  );
  return {
    account: accessRecordAccount,
    publicKey: accessRecordPubkey,
  };
}
