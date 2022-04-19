import { Program } from "@project-serum/anchor";
import { constants, Slide } from "@slidexyz/slide-sdk";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
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
  getSquadMintAddressAndBump,
  getSquadTreasuryAddressAndBump,
  SQUADS_PROGRAM_ID,
  withCreateProposalAccount,
} from "@slidexyz/squads-sdk";
import { getProposalExecutionAddressAndBump } from "@slidexyz/slide-sdk/lib/address";
import { displayPubkey } from "utils/formatting";
import BN from "bn.js";
import { postTransaction } from "../../utils/proxy";

export const createSPLWithdrawalProposal = async (
  program: Program<Slide>,
  connection: Connection,
  user: PublicKey,
  expenseManager: ExpenseManagerItem,
  lamports: number
): Promise<string | undefined> => {
  const managerData = expenseManager.account;
  if (!managerData.realm || !managerData.governanceAuthority) {
    throw new Error("Manager not set up for Realms");
  }
  const governanceData = await getGovernance(
    connection,
    managerData.governanceAuthority
  );
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
    .splGovWithdrawFromExpenseManager(managerData.realm, new BN(lamports))
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
    `[SLIDE] Withdraw ${(lamports / LAMPORTS_PER_SOL).toFixed(
      6
    )}◎ from expense manager ${expenseManager.publicKey.toString()}`,
    "",
    managerData.membershipTokenMint,
    user,
    governanceData.account.proposalCount,
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

  const transaction = new Transaction();
  transaction.add(...instructions);
  await postTransaction(connection, program.provider.wallet, transaction);

  return `Created proposal: ${displayPubkey(proposal)}`;
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
    SQUADS_PROGRAM_ID,
    managerData.squad
  );
  const instructions: TransactionInstruction[] = [];
  const { proposal } = await withCreateProposalAccount(
    instructions,
    SQUADS_PROGRAM_ID,
    user,
    managerData.squad,
    squad.proposalNonce + 1,
    0,
    "[SLIDE PROPOSAL] Withdrawal",
    `lamports: ${lamports}\nmanager: ${expenseManager.publicKey.toString()}\ntreasury: ${squadTreasury.toString()}`,
    2,
    ["Approve", "Deny"]
  );

  const transaction = new Transaction();
  transaction.add(...instructions);
  await postTransaction(connection, program.provider.wallet, transaction);

  return `Created proposal: ${displayPubkey(proposal)}`;
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
    SQUADS_PROGRAM_ID,
    managerData.squad
  );
  const [squadTreasury] = await getSquadTreasuryAddressAndBump(
    SQUADS_PROGRAM_ID,
    managerData.squad
  );
  const transaction = await program.methods
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
    .transaction();
  await postTransaction(
    program.provider.connection,
    program.provider.wallet,
    transaction
  );
  return `Withdrawal Proposal executed!`;
};
