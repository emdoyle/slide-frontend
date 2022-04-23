import { Connection, PublicKey } from "@solana/web3.js";
import { getProposals } from "@slidexyz/squads-sdk";
import { getProposalExecutionAddressAndBump } from "@slidexyz/slide-sdk/lib/address";
import { ProposalInfo } from "../../../types";
import { SPLProposalToInfo, squadsProposalToInfo } from "../../proposals";
import { getAllProposals } from "@solana/spl-governance";

export const SQUADS_PROPOSALS_KEY = "squads-proposals";

export const fetchSquadsProposals = async (
  connection: Connection,
  programId: PublicKey,
  slideProgramId: PublicKey,
  expenseManager: PublicKey,
  squad: PublicKey
) => {
  const proposalItems = await getProposals(programId, connection, squad);
  const proposalExecutions = proposalItems.map(
    (proposal) =>
      getProposalExecutionAddressAndBump(
        slideProgramId,
        expenseManager,
        proposal.pubkey
      )[0]
  );
  const executionAccountInfos = await connection.getMultipleAccountsInfo(
    proposalExecutions
  );
  const proposalInfos: ProposalInfo[] = proposalItems.map((proposal, idx) =>
    squadsProposalToInfo(proposal, executionAccountInfos[idx] !== null)
  );
  return proposalInfos;
};

export const SPL_GOV_PROPOSALS_KEY = "spl-proposals";

export const fetchSPLGovProposals = async (
  connection: Connection,
  programId: PublicKey,
  expenseManager: PublicKey,
  realm: PublicKey
) => {
  const proposalItems = await getAllProposals(connection, programId, realm);
  // TODO: flattening here is required because we pulled all proposals
  //   regardless of which governance they were created under
  //   otherwise could restrict it to just the governance attached to
  //   the native treasury, but seems unnecessary
  const proposalInfos: ProposalInfo[] = proposalItems
    .flat()
    .map(SPLProposalToInfo);
  return proposalInfos;
};
