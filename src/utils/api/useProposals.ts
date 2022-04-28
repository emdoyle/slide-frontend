import { useFnSWRImmutableWithConnection } from "./hooks";
import { ExpenseManagerItem, ProposalInfo } from "../../types";
import { SQUADS_PROGRAM_ID } from "@slidexyz/squads-sdk";
import { fetchSPLGovProposals, fetchSquadsProposals } from "./data";
import { useErrorAlert } from "../useErrorAlert";
import { Slide } from "@slidexyz/slide-sdk";
import { Connection } from "@solana/web3.js";
import { Program } from "@project-serum/anchor";

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
  expenseManager: ExpenseManagerItem | null | undefined
): ProposalHookData => {
  const {
    data: squadsProposals,
    error: squadsProposalsError,
    isValidating: squadsProposalsValidating,
    mutate: mutateSquadsProposals,
  } = useFnSWRImmutableWithConnection<ProposalInfo[]>(
    connection,
    () =>
      program && expenseManager?.account.squad
        ? [
            SQUADS_PROGRAM_ID,
            program.programId,
            expenseManager.publicKey,
            expenseManager.account.squad,
          ]
        : null,
    fetchSquadsProposals
  );
  useErrorAlert(squadsProposalsError);
  const squadsProposalsLoading =
    expenseManager?.account.squad && !squadsProposals && !squadsProposalsError;

  const {
    data: splGovProposals,
    error: splGovProposalsError,
    isValidating: splGovProposalsValidating,
    mutate: mutateSplGovProposals,
  } = useFnSWRImmutableWithConnection<ProposalInfo[]>(
    connection,
    () =>
      expenseManager?.account.realm
        ? [
            expenseManager.account.externalProgramId,
            expenseManager.publicKey,
            expenseManager.account.realm,
          ]
        : null,
    fetchSPLGovProposals
  );
  useErrorAlert(splGovProposalsError);
  const splGovProposalsLoading =
    expenseManager?.account.squad && !squadsProposals && !squadsProposalsError;

  // This isn't done early because we are in a Hook.
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
      mutateProposals: mutateSquadsProposals,
    };
  } else {
    return {
      proposals: splGovProposals ?? [],
      error: splGovProposalsError,
      isLoading: !!splGovProposalsLoading,
      isValidating: splGovProposalsValidating,
      mutateProposals: mutateSplGovProposals,
    };
  }
};
