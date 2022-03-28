import { useEffect, useState } from "react";
import {
  getProposals,
  ProposalItem,
  SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
} from "@slidexyz/squads-sdk";
import { useAlert } from "react-alert";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ExpenseManagerItem } from "types";
import { Loader } from "components";
import { useSlideProgram } from "../../utils/useSlide";
import { executeWithdrawalProposal } from "./actions";

export const WithdrawHistory = ({
  expenseManager,
}: {
  expenseManager: ExpenseManagerItem;
}) => {
  const Alert = useAlert();
  const { connection } = useConnection();
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  async function fetchProposals() {
    if (expenseManager && expenseManager.account.squad) {
      setIsLoading(true);
      try {
        const proposalItems = await getProposals(
          SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
          connection,
          expenseManager.account.squad
        );
        setProposals(proposalItems);
      } catch (err) {
        if (err instanceof Error) {
          Alert.error(err.message);
        } else {
          Alert.error("An unknown error occurred");
        }
      } finally {
        setIsLoading(false);
      }
    }
  }
  useEffect(() => {
    fetchProposals();
  }, [expenseManager.account.squad?.toString()]);

  const pendingWithdrawalProposals = proposals.filter((proposal) =>
    proposal.account.title.includes("Withdrawal")
  );

  if (isLoading) {
    return (
      <div className="my-4">
        <Loader />
      </div>
    );
  }

  if (!pendingWithdrawalProposals) return null;

  return (
    <div className="flex flex-col gap-4 my-4">
      {pendingWithdrawalProposals.map((proposal) => (
        <PendingWithdrawalProposal
          key={proposal.pubkey.toString()}
          proposal={proposal}
          expenseManager={expenseManager}
        />
      ))}
    </div>
  );
};

export const PendingWithdrawalProposal = ({
  proposal,
  expenseManager,
  refetchHistory,
}: {
  proposal: ProposalItem;
  expenseManager: ExpenseManagerItem;
  refetchHistory?: () => void;
}) => {
  const Alert = useAlert();
  const { program } = useSlideProgram();
  const { publicKey: userPublicKey } = useWallet();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const executeProposal = async () => {
    if (!program || !userPublicKey) {
      Alert.show("Please connect your wallet");
      return;
    }
    setIsLoading(true);
    try {
      const alertText = await executeWithdrawalProposal(
        program,
        userPublicKey,
        proposal,
        expenseManager
      );
      Alert.show(alertText);
    } catch (err) {
      if (err instanceof Error) {
        Alert.error(err.message);
      } else {
        Alert.error("An unknown error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bordered w-full compact rounded-md bg-white">
      <div className="flex justify-between items-center p-4">
        <h2 className="text-lg text-black">
          {proposal.account.title.trimEnd()}
        </h2>
        {isLoading && (
          <div>
            <Loader noText color="black" />
          </div>
        )}
        {/* TODO: More state logic (failed, executed) */}
        {!isLoading && proposal.account.executeReady ? (
          <button
            className="btn w-24"
            onClick={() => {
              executeProposal();
              if (refetchHistory) {
                refetchHistory();
              }
            }}
          >
            Execute
          </button>
        ) : (
          <button className="text-gray-400 btn btn-outline btn-disabled w-24">
            Pending
          </button>
        )}
      </div>
    </div>
  );
};
