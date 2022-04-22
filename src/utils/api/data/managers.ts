import { Slide } from "@slidexyz/slide-sdk";
import { Program } from "@project-serum/anchor";
import { ExpenseManagerItem } from "../../../types";
import { estimateRentExemptBalanceStatic } from "../../rent";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

export const EXPENSE_MANAGERS_KEY = "expense-managers";

export const fetchExpenseManagers = async (
  program: Program<Slide>
): Promise<ExpenseManagerItem[]> => {
  const expenseManagers: ExpenseManagerItem[] =
    await program.account.expenseManager.all();
  const managerAccountInfos =
    await program.provider.connection.getMultipleAccountsInfo(
      expenseManagers.map((expenseManager) => expenseManager.publicKey)
    );
  managerAccountInfos.forEach((accountInfo, idx) => {
    if (accountInfo) {
      expenseManagers[idx].balance =
        (accountInfo.lamports -
          estimateRentExemptBalanceStatic(accountInfo.data.byteLength)) /
        LAMPORTS_PER_SOL;
    }
  });
  return expenseManagers;
};

export const EXPENSE_MANAGER_KEY = "expense-manager";

export const fetchExpenseManager = async (
  program: Program<Slide>,
  expenseManager: PublicKey | undefined
): Promise<ExpenseManagerItem | null> => {
  if (!expenseManager) {
    return null;
  }
  const managerAccount = await program.account.expenseManager.fetch(
    expenseManager
  );
  return {
    account: managerAccount,
    publicKey: expenseManager,
  };
};
