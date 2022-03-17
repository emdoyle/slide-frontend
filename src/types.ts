import { PublicKey } from "@solana/web3.js";

export type ExpenseManager = {
  bump: number;
  expensePackageNonce: number;
  governanceAuthority: PublicKey | null;
  membershipTokenMint: PublicKey;
  name: string;
  realm: PublicKey | null;
  squad: PublicKey | null;
};

export type ExpenseManagerItem = {
  account: ExpenseManager;
  publicKey: PublicKey;
};

// TODO: opportunity for a generic type (account: T + publickey)

export type AccessRecord = {
  bump: number;
  user: PublicKey;
  expenseManager: PublicKey;
  role: Record<string, {}>;
};

export type AccessRecordItem = {
  account: AccessRecord;
  publicKey: PublicKey;
};
