import { FC, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Loader, PromptConnectWallet } from "components";

import { PublicKey } from "@solana/web3.js";
import { useSlideProgram } from "utils/useSlide";
import { useRouter } from "next/router";
import { ExpenseManagerItem } from "types";
import { useBalance } from "utils/useBalance";
import { CreateWithdrawProposalModal } from "./CreateWithdrawProposalModal";
import { Withdrawals } from "./Withdrawals";
import { useSlideSWRImmutable } from "../../utils/api/fetchers";
import { EXPENSE_MANAGER_KEY } from "../../utils/api";
import { useErrorAlert } from "../../utils/useErrorAlert";
import { useProposals } from "../../utils/api/useProposals";

export const FundingView: FC = ({}) => {
  const { connection } = useConnection();
  const { connected } = useWallet();
  const { program } = useSlideProgram();
  const { query } = useRouter();
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const [expenseManagerPubkey, setExpenseManagerPubkey] =
    useState<PublicKey | null>(null);

  if (!expenseManagerPubkey && query?.pubkey) {
    try {
      setExpenseManagerPubkey(new PublicKey(query.pubkey));
    } catch {
      // TODO: set an error message that shows up as a banner or blocking modal
    }
  }

  const {
    data: expenseManager,
    error: expenseManagerError,
    isValidating: expenseManagerValidating,
  } = useSlideSWRImmutable<ExpenseManagerItem>(program, EXPENSE_MANAGER_KEY, [
    expenseManagerPubkey,
  ]);
  useErrorAlert(expenseManagerError);
  const isLoading = connected && !expenseManager && !expenseManagerError;

  const {
    proposals,
    isLoading: proposalsLoading,
    mutateProposals,
  } = useProposals(program, connection, expenseManager);

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
      <div className="hero min-h-16 p-0 pt-10">
        <div className="text-center hero-content">
          <div className="w-full">
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
            {connected && expenseManager && (
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
                  />
                )}
                <CreateWithdrawProposalModal
                  open={modalOpen}
                  close={(success) => {
                    setModalOpen(false);
                    if (success) {
                      mutateProposals();
                    }
                  }}
                  expenseManager={expenseManager}
                  managerBalance={managerBalance ?? 0}
                />
              </>
            )}
            {!connected && <PromptConnectWallet />}
          </div>
        </div>
      </div>
    </div>
  );
};
