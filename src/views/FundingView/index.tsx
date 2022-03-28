import { FC, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Loader, Nav, PromptConnectWallet } from "components";

import styles from "./index.module.css";
import { PublicKey } from "@solana/web3.js";
import { useSlideProgram } from "utils/useSlide";
import { useRouter } from "next/router";
import {
  ExpenseManager,
  ExpenseManagerItem,
  ProposalWithExecution,
} from "types";
import { useBalance } from "utils/useBalance";
import { CreateWithdrawProposalModal } from "./CreateWithdrawProposalModal";
import { Withdrawals } from "./Withdrawals";
import {
  getProposals,
  SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
} from "@slidexyz/squads-sdk";
import { getProposalExecutionAddressAndBump } from "@slidexyz/slide-sdk/lib/address";
import { useAlert } from "react-alert";

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
  const [proposals, setProposals] = useState<ProposalWithExecution[]>([]);
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
    if (program && expenseManager && expenseManager.account.squad) {
      setProposalsLoading(true);
      try {
        const proposalItems = await getProposals(
          SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
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
        const executionAccountInfos = await connection.getMultipleAccountsInfo(
          proposalExecutions
        );
        const proposalsWithExecution: ProposalWithExecution[] =
          proposalItems.map((proposal, idx) => ({
            ...proposal,
            slideExecuted: executionAccountInfos[idx] !== null,
          }));
        setProposals(proposalsWithExecution);
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
    if (program && expenseManager) {
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
      const proposalsWithExecution: ProposalWithExecution[] = proposals.map(
        (proposal, idx) => ({
          ...proposal,
          slideExecuted: executionAccountInfos[idx] !== null,
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
  }, [expenseManager?.account.squad?.toString()]);

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
    <div className="container mx-auto max-w-6xl p-8 2xl:px-0">
      <div className={styles.container}>
        <Nav />

        <div className="text-center pt-2">
          <div className="hero min-h-16 py-4">
            <div className="text-center hero-content">
              <div className="max-w-lg">
                <h1 className="mb-5 text-5xl">Expense Manager Funding</h1>
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
                    <div className="flex flex-col justify-start text-left my-4">
                      <h3 className="text-2xl">Create Withdrawal</h3>
                      <div className="flex justify-between items-center">
                        <p>Withdraw funds with a Proposal</p>
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

                {connected && expenseManager && !!managerBalance && (
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
      </div>
    </div>
  );
};
