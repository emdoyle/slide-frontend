import { Slide } from "@slidexyz/slide-sdk";
import { Program } from "@project-serum/anchor";
import { ExpenseManagerItem } from "../../../types";
import { estimateRentExemptBalanceStatic } from "../../rent";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export const EXPENSE_MANAGERS_KEY = "expense-managers";

export const fetchExpenseManagers = async (program: Program<Slide>) => {
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
