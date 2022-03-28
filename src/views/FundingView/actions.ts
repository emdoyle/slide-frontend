import { Program } from "@project-serum/anchor";
import { constants, Slide, utils } from "@slidexyz/slide-sdk";
import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { ExpenseManagerItem } from "../../types";
import {
  AccountMetaData,
  getAllProposals,
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
  getSquadMintAddressAndBump,
  getSquadTreasuryAddressAndBump,
  ProposalItem,
  SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
  withCreateProposalAccount,
} from "@slidexyz/squads-sdk";
import { getProposalExecutionAddressAndBump } from "@slidexyz/slide-sdk/lib/address";

export const createSPLWithdrawalProposal = async (
  program: Program<Slide>,
  connection: Connection,
  user: PublicKey,
  expenseManager: ExpenseManagerItem
): Promise<string | undefined> => {
  const managerData = expenseManager.account;
  if (!managerData.realm || !managerData.governanceAuthority) {
    throw new Error("Manager not set up for SPL");
  }
  const proposalCount = (
    await getAllProposals(
      connection,
      constants.SPL_GOV_PROGRAM_ID,
      managerData.realm
    )
  ).length;
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
    .splGovWithdrawFromExpenseManager(managerData.realm)
    .accounts({
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
    `[SLIDE] Withdraw all funds from expense manager ${expenseManager.publicKey.toString()}`,
    "",
    managerData.membershipTokenMint,
    user,
    proposalCount,
    new VoteType({ type: 0, choiceCount: 1 }),
    ["Withdraw"],
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

export const createSquadsWithdrawalProposal = async (
  program: Program<Slide>,
  connection: Connection,
  user: PublicKey,
  expenseManager: ExpenseManagerItem,
  lamports: number
): Promise<string | undefined> => {
  const managerData = expenseManager.account;
  if (!managerData.squad) {
    throw new Error("Manager is not set up for Squads");
  }
  const squad = await getSquad(connection, managerData.squad);
  const [squadTreasury] = await getSquadTreasuryAddressAndBump(
    SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
    managerData.squad
  );
  const instructions: TransactionInstruction[] = [];
  const { proposal } = await withCreateProposalAccount(
    instructions,
    SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
    user,
    managerData.squad,
    squad.proposalNonce + 1,
    0,
    "[SLIDE PROPOSAL] Withdrawal",
    `lamports: ${lamports}\nmanager: ${expenseManager.publicKey.toString()}\ntreasury: ${squadTreasury.toString()}`,
    2,
    ["Approve", "Deny"]
  );

  // @ts-ignore
  await utils.flushInstructions(program, instructions, []);

  const proposalAddress = proposal.toString();
  return `Created proposal: ${proposalAddress.slice(
    0,
    4
  )}..${proposalAddress.slice(-4)}`;
};

export const executeWithdrawalProposal = async (
  program: Program<Slide>,
  user: PublicKey,
  proposal: PublicKey,
  expenseManager: ExpenseManagerItem
): Promise<string | undefined> => {
  const managerData = expenseManager.account;
  if (!managerData.squad) {
    throw new Error("Manager is not set up for Squads");
  }
  const [proposalExecution] = getProposalExecutionAddressAndBump(
    program.programId,
    expenseManager.publicKey,
    proposal
  );
  const [squadMint] = await getSquadMintAddressAndBump(
    SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
    managerData.squad
  );
  const [squadTreasury] = await getSquadTreasuryAddressAndBump(
    SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
    managerData.squad
  );
  await program.methods
    .squadsExecuteWithdrawalProposal()
    .accounts({
      proposal,
      expenseManager: expenseManager.publicKey,
      squad: managerData.squad,
      squadMint,
      squadTreasury,
      proposalExecution,
      signer: user,
    })
    .rpc();
  return `Withdrawal Proposal executed!`;
};
