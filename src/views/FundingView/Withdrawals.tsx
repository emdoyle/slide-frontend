import { useState } from "react";
import { ProposalItem } from "@slidexyz/squads-sdk";
import { useAlert } from "react-alert";
import { useWallet } from "@solana/wallet-adapter-react";
import { ExpenseManagerItem, ProposalWithExecution } from "types";
import { Loader } from "components";
import { useSlideProgram } from "utils/useSlide";
import { executeWithdrawalProposal } from "./actions";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export const Withdrawals = ({
  expenseManager,
  proposals,
  refetchExecutionStatus,
}: {
  expenseManager: ExpenseManagerItem;
  proposals: ProposalWithExecution[];
  refetchExecutionStatus?: () => void;
}) => {
  const withdrawalProposals = proposals.filter((proposal) =>
    proposal.account.title.includes("Withdrawal")
  );
  if (!withdrawalProposals) return null;

  const pendingWithdrawalProposals = withdrawalProposals.filter(
    (proposal) => !proposal.slideExecuted
  );
  const withdrawalHistory = withdrawalProposals.filter(
    (proposal) => proposal.slideExecuted
  );

  return (
    <>
      {pendingWithdrawalProposals && (
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
      {withdrawalHistory && (
        <div className="flex flex-col justify-start text-left my-4">
          <h3 className="text-2xl">History</h3>
          <div className="flex flex-col gap-4 my-4">
            {withdrawalHistory.map((proposal) => (
              <WithdrawalHistoryCard
                key={proposal.pubkey.toString()}
                proposal={proposal}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

const parseProposal = (proposal: ProposalItem): [string, string] => {
  const proposalDescriptionLines = proposal.account.description
    .trimEnd()
    .split("\n");
  let timeDisplay;
  if (proposal.account.closeTimestamp) {
    timeDisplay = new Date(
      proposal.account.closeTimestamp.muln(1000).toNumber()
    ).toLocaleDateString("en-US", { year: "2-digit", month: "2-digit" });
  } else {
    timeDisplay = "";
  }
  let proposalDisplay;
  try {
    const solAmount =
      Number(proposalDescriptionLines[0].slice(10)) / LAMPORTS_PER_SOL;
    const manager = proposalDescriptionLines[1].slice(9);
    const treasury = proposalDescriptionLines[2].slice(10);
    proposalDisplay = `Withdraw ${solAmount}◎ ${manager.slice(
      0,
      4
    )}..${manager.slice(-4)} -> ${treasury.slice(0, 4)}..${treasury.slice(-4)}`;
  } catch {
    proposalDisplay = proposal.account.title;
  }

  return [proposalDisplay, timeDisplay];
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

  const [proposalDisplay] = parseProposal(proposal);
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

export const WithdrawalHistoryCard = ({
  proposal,
}: {
  proposal: ProposalItem;
}) => {
  const [withdrawalDisplay, timeDisplay] = parseProposal(proposal);
  return (
    <div className="bordered w-full compact rounded-md bg-white">
      <div className="flex justify-between items-center p-4 text-black">
        <p className="pr-2">{withdrawalDisplay}</p>
        <p>{timeDisplay}</p>
      </div>
    </div>
  );
};
