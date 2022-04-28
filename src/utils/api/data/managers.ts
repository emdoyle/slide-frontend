import { Slide } from "@slidexyz/slide-sdk";
import { Program } from "@project-serum/anchor";
import { ExpenseManagerItem } from "../../../types";
import { estimateRentExemptBalanceStatic } from "../../rent";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

export async function fetchExpenseManagers(
  program: Program<Slide>
): Promise<ExpenseManagerItem[]> {
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
}

export async function fetchExpenseManager(
  program: Program<Slide>,
  expenseManager: PublicKey
): Promise<ExpenseManagerItem> {
  const managerAccount = await program.account.expenseManager.fetch(
    expenseManager
  );
  return {
    account: managerAccount,
    publicKey: expenseManager,
  };
}
