import { useSPLGovSWRImmutable, useSquadsSWRImmutable } from "./fetchers";
import { ExpenseManagerItem, ProposalInfo } from "../../types";
import { SQUADS_PROGRAM_ID } from "@slidexyz/squads-sdk";
import { SPL_GOV_PROPOSALS_KEY, SQUADS_PROPOSALS_KEY } from "./data";
import { useErrorAlert } from "../useErrorAlert";
import { SPL_GOV_PROGRAM_ID } from "@slidexyz/slide-sdk/lib/constants";
import { Slide } from "@slidexyz/slide-sdk";
import { Connection } from "@solana/web3.js";
import { Program } from "@project-serum/anchor";
import { useSWRConfig } from "swr";

export type ProposalHookData = {
  proposals: ProposalInfo[];
  error: any;
  isLoading: boolean;
  isValidating: boolean;
  mutateProposals: () => void;
};

export const useProposals = (
  program: Program<Slide> | undefined,
  connection: Connection,
  expenseManager: ExpenseManagerItem | undefined
): ProposalHookData => {
  const { mutate } = useSWRConfig();

  const {
    data: squadsProposals,
    error: squadsProposalsError,
    isValidating: squadsProposalsValidating,
  } = useSquadsSWRImmutable<ProposalInfo[]>(
    connection,
    SQUADS_PROGRAM_ID,
    SQUADS_PROPOSALS_KEY,
    () =>
      program && expenseManager?.account.squad
        ? [
            program.programId,
            expenseManager.publicKey,
            expenseManager.account.squad,
          ]
        : null
  );
  useErrorAlert(squadsProposalsError);
  const squadsProposalsLoading =
    expenseManager?.account.squad && !squadsProposals && !squadsProposalsError;

  const {
    data: splGovProposals,
    error: splGovProposalsError,
    isValidating: splGovProposalsValidating,
  } = useSPLGovSWRImmutable<ProposalInfo[]>(
    connection,
    SPL_GOV_PROGRAM_ID,
    SPL_GOV_PROPOSALS_KEY,
    () =>
      expenseManager?.account.realm
        ? [expenseManager.publicKey, expenseManager.account.realm]
        : null
  );
  useErrorAlert(splGovProposalsError);
  const splGovProposalsLoading =
    expenseManager?.account.squad && !squadsProposals && !squadsProposalsError;

  if (!program || !expenseManager) {
    return {
      proposals: [],
      error: null,
      isLoading: false,
      isValidating: false,
      mutateProposals: () => {},
    };
  } else if (expenseManager.account.squad) {
    return {
      proposals: squadsProposals ?? [],
      error: squadsProposalsError,
      isLoading: !!squadsProposalsLoading,
      isValidating: squadsProposalsValidating,
      mutateProposals: () =>
        mutate([
          [
            connection,
            SQUADS_PROGRAM_ID,
            SQUADS_PROPOSALS_KEY,
            program?.programId,
            expenseManager.publicKey,
            expenseManager.account.squad,
          ],
        ]),
    };
  } else {
    return {
      proposals: splGovProposals ?? [],
      error: splGovProposalsError,
      isLoading: !!splGovProposalsLoading,
      isValidating: splGovProposalsValidating,
      mutateProposals: () =>
        mutate([
          connection,
          SPL_GOV_PROGRAM_ID,
          SPL_GOV_PROPOSALS_KEY,
          expenseManager.publicKey,
          expenseManager.account.realm,
        ]),
    };
  }
};
