import { Program } from "@project-serum/anchor";
import { address, constants, Slide } from "@slidexyz/slide-sdk";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { ExpenseManagerItem } from "../../types";
import { getTokenOwnerRecordAddress } from "@solana/spl-governance";
import BN from "bn.js";
import {
  getMemberEquityAddressAndBump,
  SQUADS_PROGRAM_ID,
} from "@slidexyz/squads-sdk";
import { postTransaction } from "../../utils/proxy";

export const createSPLExpensePackage = async (
  program: Program<Slide>,
  user: PublicKey,
  expenseManager: ExpenseManagerItem,
  name: string,
  description: string,
  quantity: string
): Promise<string | undefined> => {
  const managerData = expenseManager.account;
  if (!managerData.realm || !managerData.governanceAuthority) {
    return "Manager not set up for Realms";
  }
  const [expensePackage] = address.getExpensePackageAddressAndBump(
    expenseManager.publicKey,
    user,
    managerData.expensePackageNonce,
    program.programId
  );
  const tokenOwnerRecord = await getTokenOwnerRecordAddress(
    constants.SPL_GOV_PROGRAM_ID,
    managerData.realm,
    managerData.membershipTokenMint,
    user
  );

  const transaction = await program.methods
    .splGovCreateExpensePackage(
      managerData.realm,
      managerData.expensePackageNonce,
      name,
      description,
      new BN(Number(quantity) * LAMPORTS_PER_SOL)
    )
    .accounts({
      expensePackage,
      expenseManager: expenseManager.publicKey,
      tokenOwnerRecord,
      owner: user,
    })
    .transaction();
  await postTransaction(
    program.provider.connection,
    program.provider.wallet,
    transaction
  );
};

export const updateSPLExpensePackage = async (
  program: Program<Slide>,
  user: PublicKey,
  expenseManager: ExpenseManagerItem,
  packageNonce: number,
  name: string,
  description: string,
  quantity: string
): Promise<string | undefined> => {
  const managerData = expenseManager.account;
  if (!managerData.realm || !managerData.governanceAuthority) {
    return "Manager not set up for Realms";
  }
  const [expensePackage] = address.getExpensePackageAddressAndBump(
    expenseManager.publicKey,
    user,
    packageNonce,
    program.programId
  );
  const tokenOwnerRecord = await getTokenOwnerRecordAddress(
    constants.SPL_GOV_PROGRAM_ID,
    managerData.realm,
    managerData.membershipTokenMint,
    user
  );

  const transaction = await program.methods
    .splGovUpdateExpensePackage(
      managerData.realm,
      packageNonce,
      name,
      description,
      new BN(Number(quantity) * LAMPORTS_PER_SOL)
    )
    .accounts({
      expensePackage,
      expenseManager: expenseManager.publicKey,
      tokenOwnerRecord,
      owner: user,
    })
    .transaction();
  await postTransaction(
    program.provider.connection,
    program.provider.wallet,
    transaction
  );
};

export const createSquadsExpensePackage = async (
  program: Program<Slide>,
  user: PublicKey,
  expenseManager: ExpenseManagerItem,
  name: string,
  description: string,
  quantity: string
): Promise<string | undefined> => {
  const managerData = expenseManager.account;
  if (!managerData.squad) {
    return "Manager not set up for Squads";
  }
  const [expensePackage] = address.getExpensePackageAddressAndBump(
    expenseManager.publicKey,
    user,
    managerData.expensePackageNonce,
    program.programId
  );
  const [memberEquity] = await getMemberEquityAddressAndBump(
    SQUADS_PROGRAM_ID,
    user,
    managerData.squad
  );
  const transaction = await program.methods
    .squadsCreateExpensePackage(
      managerData.expensePackageNonce,
      name,
      description,
      new BN(Number(quantity) * LAMPORTS_PER_SOL)
    )
    .accounts({
      expensePackage,
      expenseManager: expenseManager.publicKey,
      memberEquity,
      squad: managerData.squad,
      owner: user,
    })
    .transaction();
  await postTransaction(
    program.provider.connection,
    program.provider.wallet,
    transaction
  );
};

export const updateSquadsExpensePackage = async (
  program: Program<Slide>,
  user: PublicKey,
  expenseManager: ExpenseManagerItem,
  packageNonce: number,
  name: string,
  description: string,
  quantity: string
): Promise<string | undefined> => {
  const managerData = expenseManager.account;
  if (!managerData.squad) {
    return "Manager not set up for Squads";
  }
  const [expensePackage] = address.getExpensePackageAddressAndBump(
    expenseManager.publicKey,
    user,
    packageNonce,
    program.programId
  );
  const [memberEquity] = await getMemberEquityAddressAndBump(
    SQUADS_PROGRAM_ID,
    user,
    managerData.squad
  );
  const transaction = await program.methods
    .squadsUpdateExpensePackage(
      packageNonce,
      name,
      description,
      new BN(Number(quantity) * LAMPORTS_PER_SOL)
    )
    .accounts({
      expensePackage,
      expenseManager: expenseManager.publicKey,
      memberEquity,
      squad: managerData.squad,
      owner: user,
    })
    .transaction();
  await postTransaction(
    program.provider.connection,
    program.provider.wallet,
    transaction
  );
};
