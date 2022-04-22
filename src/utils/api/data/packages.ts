import { Slide } from "@slidexyz/slide-sdk";
import { Program } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { ExpensePackageItem } from "../../../types";

export const EXPENSE_PACKAGES_KEY = "expense-packages";

export const fetchExpensePackages = async (
  program: Program<Slide>,
  expenseManager: PublicKey | undefined
): Promise<ExpensePackageItem[] | null> => {
  if (!expenseManager) {
    return null;
  }
  return await program.account.expensePackage.all([
    {
      memcmp: { offset: 41, bytes: expenseManager.toBase58() },
    },
  ]);
};
