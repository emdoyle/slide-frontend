import { Program } from "@project-serum/anchor";
import { constants, Slide, utils } from "@slidexyz/slide-sdk";
import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { ExpenseManagerItem } from "types";
import {
  AccountMetaData,
  getGovernance,
  getNativeTreasuryAddress,
  getTokenOwnerRecordAddress,
  InstructionData,
  VoteType,
  withCreateProposal,
  withInsertTransaction,
  withSignOffProposal,
} from "@solana/spl-governance";
import {
  getSquad,
  SQUADS_PROGRAM_ID,
  withCreateProposalAccount,
} from "@slidexyz/squads-sdk";
import { capitalize } from "../../utils/formatting";

export const createSPLAccessProposal = async (
  program: Program<Slide>,
  connection: Connection,
  user: PublicKey,
  expenseManager: ExpenseManagerItem,
  accessRecord: PublicKey,
  role: "reviewer" | "admin"
): Promise<string | undefined> => {
  const managerData = expenseManager.account;
  if (!managerData.realm || !managerData.governanceAuthority) {
    return "Manager not set up for SPL";
  }
  const proposalCount = (
    await getGovernance(connection, managerData.governanceAuthority)
  ).account.proposalCount;
  const nativeTreasury = await getNativeTreasuryAddress(
    constants.SPL_GOV_PROGRAM_ID,
    managerData.governanceAuthority
  );
  const tokenOwnerRecord = await getTokenOwnerRecordAddress(
    constants.SPL_GOV_PROGRAM_ID,
    managerData.realm,
    managerData.membershipTokenMint,
    user
  );
  const instruction: TransactionInstruction = await program.methods
    .splGovCreateAccessRecord(managerData.realm, user, {
      [role]: {},
    })
    .accounts({
      accessRecord,
      expenseManager: expenseManager.publicKey,
      governanceAuthority: managerData.governanceAuthority,
      nativeTreasury,
    })
    .instruction();
  const instructionData = new InstructionData({
    programId: program.programId,
    accounts: instruction.keys.map((key) => new AccountMetaData({ ...key })),
    data: instruction.data,
  });
  // create a proposal containing those instructions
  let instructions: TransactionInstruction[] = [];
  const proposal = await withCreateProposal(
    instructions,
    constants.SPL_GOV_PROGRAM_ID,
    2,
    managerData.realm,
    managerData.governanceAuthority,
    tokenOwnerRecord,
    `[SLIDE] Grant ${capitalize(role)} Access: ${user.toString()}`,
    "",
    managerData.membershipTokenMint,
    user,
    proposalCount,
    new VoteType({ type: 0, choiceCount: 1 }),
    ["Grant Access"],
    true,
    user
  );
  await withInsertTransaction(
    instructions,
    constants.SPL_GOV_PROGRAM_ID,
    2,
    managerData.governanceAuthority,
    proposal,
    tokenOwnerRecord,
    user,
    0,
    0,
    0,
    [instructionData],
    user
  );
  // initiate voting on the proposal
  // TODO: this may not be necessary
  await withSignOffProposal(
    instructions,
    constants.SPL_GOV_PROGRAM_ID,
    2,
    managerData.realm,
    managerData.governanceAuthority,
    proposal,
    user,
    undefined,
    tokenOwnerRecord
  );

  // @ts-ignore
  await utils.flushInstructions(program, instructions, []);
};

export const createSquadsAccessProposal = async (
  program: Program<Slide>,
  connection: Connection,
  user: PublicKey,
  expenseManager: ExpenseManagerItem,
  role: "reviewer" | "admin"
): Promise<string | undefined> => {
  const managerData = expenseManager.account;
  if (!managerData.squad) {
    return "Manager not set up for Squads";
  }

  const squad = await getSquad(connection, managerData.squad);
  const instructions: TransactionInstruction[] = [];
  await withCreateProposalAccount(
    instructions,
    SQUADS_PROGRAM_ID,
    user,
    managerData.squad,
    squad.proposalNonce + 1,
    0,
    "[SLIDE PROPOSAL] Grant Permission",
    `member: ${user.toString()}\nrole: ${role}`,
    2,
    ["Approve", "Deny"]
  );

  // @ts-ignore
  await utils.flushInstructions(program, instructions, []);
};
