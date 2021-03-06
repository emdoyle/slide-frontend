import { useState } from "react";
import { useAlert } from "react-alert";
import { useWallet } from "@solana/wallet-adapter-react";
import { ExpenseManagerItem, ProposalInfo } from "types";
import { Loader } from "components";
import { useSlideProgram } from "utils/useSlide";
import { executeWithdrawalProposal } from "./actions";
import {
  isWithdrawal,
  parseSPLProposal,
  parseSquadsProposal,
} from "utils/proposals";

export const Withdrawals = ({
  expenseManager,
  proposals,
  refetchExecutionStatus,
}: {
  expenseManager: ExpenseManagerItem;
  proposals: ProposalInfo[];
  refetchExecutionStatus?: () => void;
}) => {
  const withdrawalProposals = proposals.filter(isWithdrawal);
  if (!withdrawalProposals) return null;

  const pendingWithdrawalProposals = withdrawalProposals.filter(
    (proposal) => !proposal.executed
  );
  const withdrawalHistory = withdrawalProposals.filter(
    (proposal) => proposal.executed
  );

  return (
    <>
      {!!pendingWithdrawalProposals.length && (
        <div className="flex flex-col justify-start text-left my-4">
          <h3 className="text-2xl">Pending Withdrawals</h3>
          <div className="flex flex-col gap-4 my-4">
            {pendingWithdrawalProposals.map((proposal) => (
              <PendingWithdrawalProposal
                key={proposal.pubkey.toString()}
                proposal={proposal}
                expenseManager={expenseManager}
                refetchHistory={refetchExecutionStatus}
              />
            ))}
          </div>
        </div>
      )}
      {!!withdrawalHistory.length && (
        <div className="flex flex-col justify-start text-left my-4">
          <h3 className="text-2xl">History</h3>
          <div className="flex flex-col gap-4 my-4">
            {withdrawalHistory.map((proposal) => (
              <WithdrawalHistoryCard
                key={proposal.pubkey.toString()}
                proposal={proposal}
                expenseManager={expenseManager}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export const PendingWithdrawalProposal = ({
  proposal,
  expenseManager,
  refetchHistory,
}: {
  proposal: ProposalInfo;
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
        proposal.pubkey,
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

  const [proposalDisplay] = expenseManager.account.squad
    ? parseSquadsProposal(proposal)
    : parseSPLProposal(proposal);
  return (
    <div className="bordered w-full compact rounded-md bg-white">
      <div className="flex justify-between items-center p-4">
        <h2 className="text-lg text-black pr-2">{proposalDisplay}</h2>
        {isLoading && (
          <div>
            <Loader noText color="black" />
          </div>
        )}
        {/* TODO: what logic needs to be replicated from Program's validation of Proposal? */}
        {!isLoading && proposal.executeReady ? (
          <button
            className="btn w-24"
            onClick={() => {
              executeProposal().then(() => {
                if (refetchHistory) {
                  refetchHistory();
                }
              });
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

export const WithdrawalHistoryCard = ({
  proposal,
  expenseManager,
}: {
  proposal: ProposalInfo;
  expenseManager: ExpenseManagerItem;
}) => {
  const [withdrawalDisplay, timeDisplay] = expenseManager.account.squad
    ? parseSquadsProposal(proposal)
    : parseSPLProposal(proposal);
  return (
    <div className="bordered w-full compact rounded-md bg-white">
      <div className="flex justify-between items-center p-4 text-black">
        <p className="pr-2">{withdrawalDisplay}</p>
        <p>{timeDisplay}</p>
      </div>
    </div>
  );
};
