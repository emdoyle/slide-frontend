import { ProposalItem } from "@slidexyz/squads-sdk";
import { ProposalInfo } from "../types";
import {
  ProgramAccount,
  Proposal,
  ProposalState,
} from "@solana/spl-governance";

// TODO: handle failed votes!

export const squadsProposalToInfo = (
  squadsProposal: ProposalItem,
  executed: boolean = false
): ProposalInfo => {
  return {
    pubkey: squadsProposal.pubkey,
    title: squadsProposal.account.title,
    description: squadsProposal.account.description,
    executeReady: squadsProposal.account.executeReady,
    executed: executed,
    executedAt: squadsProposal.account.closeTimestamp, // TODO: this is wrong
  };
};

export const SPLProposalToInfo = (
  splProposal: ProgramAccount<Proposal>
): ProposalInfo => {
  return {
    pubkey: splProposal.pubkey,
    title: splProposal.account.name,
    description: splProposal.account.descriptionLink,
    // don't want to prompt user to execute SPL proposal via Slide
    executeReady: splProposal.account.state === ProposalState.Completed,
    executed: splProposal.account.state === ProposalState.Completed,
    executedAt: splProposal.account.executingAt ?? undefined,
  };
};

export const isWithdrawal = (proposal: ProposalInfo): boolean => {
  // TODO: use bracket ID consistently across Squads/SPL
  return proposal.title.includes("Withdraw");
};

export const isAccessRequest = (proposal: ProposalInfo): boolean => {
  // TODO: use bracket ID consistently across Squads/SPL
  return proposal.title.includes("Grant");
};

export const overflowEllipses = (
  content: string,
  maxLength: number = 24
): string => {
  if (content.length < maxLength) return content;

  return `${content.slice(0, maxLength)}...`;
};
