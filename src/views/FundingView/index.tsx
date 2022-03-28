import { FC, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Loader, Nav, PromptConnectWallet } from "components";

import styles from "./index.module.css";
import { PublicKey } from "@solana/web3.js";
import { useSlideProgram } from "utils/useSlide";
import { useRouter } from "next/router";
import { ExpenseManager, ExpenseManagerItem } from "types";
import { useBalance } from "utils/useBalance";
import { CreateWithdrawProposalModal } from "./CreateWithdrawProposalModal";

export const FundingView: FC = ({}) => {
  const { connected, publicKey: userPublicKey } = useWallet();
  const { program } = useSlideProgram();
  const { query } = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [expenseManager, setExpenseManager] =
    useState<ExpenseManagerItem | null>(null);

  useEffect(() => {
    async function getExpenseManager() {
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
    setIsLoading(true);
    getExpenseManager().finally(() => setIsLoading(false));
  }, [program?.programId, query?.pubkey]);

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
                  <div className="flex flex-col gap-2 justify-center mt-5">
                    <p className="text-xl mb-5">
                      Deposit funds into your Slide Expense Manager using the
                      address below
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
                )}

                <div className="flex flex-col justify-start  text-left my-4">
                  <h3 className="text-2xl">Withdrawals</h3>
                  <div className="flex justify-between items-center">
                    <p>Withdraw funds with a Proposal</p>
                    <button className="btn" onClick={() => setModalOpen(true)}>
                      Withdraw
                    </button>
                  </div>
                </div>

                {connected && expenseManager && !!managerBalance && (
                  <CreateWithdrawProposalModal
                    open={modalOpen}
                    close={() => setModalOpen(false)}
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
