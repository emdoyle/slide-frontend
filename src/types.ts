import { AccountInfo, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { Governance, ProgramAccount, Realm } from "@solana/spl-governance";
import { ProposalItem } from "@slidexyz/squads-sdk";

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
  balance?: number;
};

export type ExpensePackage = {
  bump: number;
  owner: PublicKey;
  expenseManager: PublicKey;
  name: string;
  description: string;
  state: Record<string, {}>;
  quantity: BN;
  nonce: number;
};

export type ExpensePackageItem = {
  account: ExpensePackage;
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

export type RealmItem = ProgramAccount<Realm>;
export type GovernanceItem = ProgramAccount<Governance>;
export type TreasuryItem = {
  account: AccountInfo<Buffer>;
  pubkey: PublicKey;
};
export type TreasuryWithGovernance = TreasuryItem & {
  governance: GovernanceItem;
};

export type ProposalInfo = {
  pubkey: PublicKey;
  title: string;
  description: string;
  executeReady: boolean;
  executed: boolean;
  executedAt?: BN; // UnixTimestamp
};
