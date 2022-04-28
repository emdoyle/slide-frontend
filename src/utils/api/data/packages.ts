import { Slide } from "@slidexyz/slide-sdk";
import { Program } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { ExpensePackageItem } from "../../../types";

export async function fetchExpensePackages(
  program: Program<Slide>,
  expenseManager: PublicKey
): Promise<ExpensePackageItem[]> {
  return await program.account.expensePackage.all([
    {
      memcmp: { offset: 41, bytes: expenseManager.toBase58() },
    },
  ]);
}
