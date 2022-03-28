import { ProposalItem } from "@slidexyz/squads-sdk";
import { ProposalInfo } from "../types";
import {
  ProgramAccount,
  Proposal,
  ProposalState,
} from "@solana/spl-governance";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { displayPubkey } from "./formatting";

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

const parseProposalExecutedAt = (proposal: ProposalInfo): string => {
  if (proposal.executedAt) {
    return new Date(
      proposal.executedAt.muln(1000).toNumber()
    ).toLocaleDateString("en-US", { year: "2-digit", month: "2-digit" });
  } else {
    return "";
  }
};

const parseSquadsProposalContent = (proposal: ProposalInfo): string => {
  const proposalDescriptionLines = proposal.description.trimEnd().split("\n");
  try {
    const solAmount =
      Number(proposalDescriptionLines[0].slice(10)) / LAMPORTS_PER_SOL;
    const manager = proposalDescriptionLines[1].slice(9);
    const treasury = proposalDescriptionLines[2].slice(10);
    return `Withdraw ${solAmount}◎ ${displayPubkey(manager)} -> ${displayPubkey(
      treasury
    )}`;
  } catch {
    return proposal.title;
  }
};

export const parseSquadsProposal = (
  proposal: ProposalInfo
): [string, string] => {
  return [
    parseSquadsProposalContent(proposal),
    parseProposalExecutedAt(proposal),
  ];
};

const parseSPLProposalContent = (proposal: ProposalInfo): string => {
  return overflowEllipses(proposal.title, 60);
};

export const parseSPLProposal = (proposal: ProposalInfo): [string, string] => {
  return [parseSPLProposalContent(proposal), parseProposalExecutedAt(proposal)];
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
