import { FC, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Loader, Nav, PromptConnectWallet } from "components";

import styles from "./index.module.css";
import { PublicKey } from "@solana/web3.js";
import { useSlideProgram } from "utils/useSlide";
import { useRouter } from "next/router";
import { ExpenseManager, ExpenseManagerItem, ProposalInfo } from "types";
import { useBalance } from "utils/useBalance";
import { CreateWithdrawProposalModal } from "./CreateWithdrawProposalModal";
import { Withdrawals } from "./Withdrawals";
import { getProposals, SQUADS_PROGRAM_ID } from "@slidexyz/squads-sdk";
import { getProposalExecutionAddressAndBump } from "@slidexyz/slide-sdk/lib/address";
import { useAlert } from "react-alert";
import { SPLProposalToInfo, squadsProposalToInfo } from "../../utils/proposals";
import { getAllProposals } from "@solana/spl-governance";
import { SPL_GOV_PROGRAM_ID } from "@slidexyz/slide-sdk/lib/constants";

export const FundingView: FC = ({}) => {
  const Alert = useAlert();
  const { connection } = useConnection();
  const { connected, publicKey: userPublicKey } = useWallet();
  const { program } = useSlideProgram();
  const { query } = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [expenseManager, setExpenseManager] =
    useState<ExpenseManagerItem | null>(null);
  const [proposals, setProposals] = useState<ProposalInfo[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState<boolean>(false);

  async function fetchExpenseManager() {
    if (program && userPublicKey && query?.pubkey) {
      const expenseManagerPubkey = new PublicKey(query.pubkey);
      const expenseManagerAccount: ExpenseManager =
        await program.account.expenseManager.fetch(expenseManagerPubkey);
      setExpenseManager({
        account: expenseManagerAccount,
        publicKey: expenseManagerPubkey,
      });
    }
  }

  async function fetchProposals() {
    if (program && expenseManager) {
      setProposalsLoading(true);
      try {
        if (expenseManager.account.squad) {
          // Fetch Squads proposals, map into ProposalInfo
          const proposalItems = await getProposals(
            SQUADS_PROGRAM_ID,
            connection,
            expenseManager.account.squad
          );
          const proposalExecutions = proposalItems.map(
            (proposal) =>
              getProposalExecutionAddressAndBump(
                program.programId,
                expenseManager.publicKey,
                proposal.pubkey
              )[0]
          );
          const executionAccountInfos =
            await connection.getMultipleAccountsInfo(proposalExecutions);
          const proposalInfos: ProposalInfo[] = proposalItems.map(
            (proposal, idx) =>
              squadsProposalToInfo(
                proposal,
                executionAccountInfos[idx] !== null
              )
          );
          setProposals(proposalInfos);
        } else if (
          expenseManager.account.realm &&
          expenseManager.account.governanceAuthority
        ) {
          // Fetch SPL Gov proposals, map into ProposalInfo
          const proposalItems = await getAllProposals(
            connection,
            SPL_GOV_PROGRAM_ID,
            expenseManager.account.realm
          );
          // TODO: flattening here is required because we pulled all proposals
          //   regardless of which governance they were created under
          //   otherwise could restrict it to just the governance attached to
          //   the native treasury, but seems unnecessary
          const proposalInfos: ProposalInfo[] = proposalItems
            .flat()
            .map(SPLProposalToInfo);
          setProposals(proposalInfos);
        }
      } catch (err) {
        if (err instanceof Error) {
          Alert.error(err.message);
        } else {
          Alert.error("An unknown error occurred");
        }
      } finally {
        setProposalsLoading(false);
      }
    }
  }

  async function refetchExecutionStatus() {
    if (program && expenseManager && expenseManager.account.squad) {
      const proposalExecutions = proposals.map(
        (proposal) =>
          getProposalExecutionAddressAndBump(
            program.programId,
            expenseManager.publicKey,
            proposal.pubkey
          )[0]
      );
      const executionAccountInfos = await connection.getMultipleAccountsInfo(
        proposalExecutions
      );
      const proposalsWithExecution: ProposalInfo[] = proposals.map(
        (proposal, idx) => ({
          ...proposal,
          executed: executionAccountInfos[idx] !== null,
        })
      );
      setProposals(proposalsWithExecution);
    }
  }

  useEffect(() => {
    setIsLoading(true);
    fetchExpenseManager().finally(() => setIsLoading(false));
  }, [program?.programId, query?.pubkey]);

  useEffect(() => {
    fetchProposals();
  }, [expenseManager?.publicKey.toString()]);

  const { balance: managerBalance } = useBalance(
    expenseManager?.publicKey ?? null
  );
  let balanceDisplay;
  if (managerBalance) {
    balanceDisplay = `(Balance: ~${managerBalance.toFixed(2)}◎)`;
  } else {
    balanceDisplay = "(Balance: 0.00◎)";
  }

  return (
    <div className="text-center pt-2">
      <div className="hero min-h-16 py-4">
        <div className="text-center hero-content">
          <div className="max-w-lg">
            {expenseManager ? (
              <h1 className="mb-5 text-5xl">
                Funding for{" "}
                <span className="font-bold">{expenseManager.account.name}</span>
              </h1>
            ) : (
              <h1 className="mb-5 text-5xl">Funding</h1>
            )}
            <p className="text-2xl mb-5">
              Use your existing governance methods to fund your Slide expense
              manager. When you want to withdraw funds, use Slide to create a
              Proposal to withdraw to your DAO&apos;s treasury.
            </p>
            {isLoading && (
              <div>
                <Loader />
              </div>
            )}
            {connected && !isLoading && expenseManager && (
              <>
                <div className="flex flex-col gap-2 justify-center mt-5">
                  <p className="text-xl mb-5">
                    Deposit funds into your Slide Expense Manager using the
                    address below.
                  </p>
                  <div className="card text-black bg-gray-400">
                    <div className="card-body">
                      <h3 className="card-title">
                        Expense Manager Address {balanceDisplay}
                      </h3>

                      <p>{expenseManager.publicKey.toString()}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-start text-left my-6">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-2xl">Create Withdrawal</h3>
                      <p>Withdraw funds with a Proposal</p>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={() => setModalOpen(true)}
                    >
                      Withdraw
                    </button>
                  </div>
                </div>
                {proposalsLoading ? (
                  <div>
                    <Loader />
                  </div>
                ) : (
                  <Withdrawals
                    expenseManager={expenseManager}
                    proposals={proposals}
                    refetchExecutionStatus={refetchExecutionStatus}
                  />
                )}
              </>
            )}

            {connected && expenseManager && managerBalance !== null && (
              <CreateWithdrawProposalModal
                open={modalOpen}
                close={(success) => {
                  setModalOpen(false);
                  if (success) {
                    fetchProposals();
                  }
                }}
                expenseManager={expenseManager}
                managerBalance={managerBalance}
              />
            )}
            {!connected && <PromptConnectWallet />}
          </div>
        </div>
      </div>
    </div>
  );
};
