import { Slide } from "@slidexyz/slide-sdk";
import { Program } from "@project-serum/anchor";
import { ExpenseManager } from "../../../types";

export const ACCESS_PROPOSALS_KEY = "access-proposals";

export const fetchAccessProposals = async (
  program: Program<Slide>,
  expenseManager: ExpenseManager
) => {};

export const WITHDRAWAL_PROPOSALS_KEY = "withdrawal-proposals";

export const fetchWithdrawalProposals = async (
  program: Program<Slide>,
  expenseManager: ExpenseManager
) => {};
