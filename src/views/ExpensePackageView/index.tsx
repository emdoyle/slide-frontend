import { FC, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { Loader, Nav } from "components";
import { ExpensePackageCard } from "./ExpensePackageCard";
import styles from "./index.module.css";
import { PublicKey } from "@solana/web3.js";
import { useSlideProgram } from "utils/useSlide";
import { PromptConnectWallet } from "components/PromptConnectWallet";
import { ExpenseManager, ExpenseManagerItem, ExpensePackageItem } from "types";
import { useRouter } from "next/router";

const CreateExpensePackageModal = ({
  open,
  close,
  expenseManager,
}: {
  open: boolean;
  close(): void;
  expenseManager: ExpenseManagerItem;
}) => {
  const submitForm = async () => {};

  return (
    <div className={`modal ${open && "modal-open"}`}>
      <div className="modal-box">
        <h3 className="font-bold text-lg">Add a new expense</h3>
        <div className="flex flex-col gap-2 justify-center">
          <input
            type="text"
            placeholder="For"
            className="input input-bordered w-full bg-white text-black"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            className="input input-bordered w-full bg-white text-black"
          />
          <input
            type="number"
            placeholder="Amount (in SOL)"
            className="input input-bordered w-full bg-white text-black"
          />
        </div>
        <div className="flex gap-2 mt-4 justify-center">
          <button className="btn btn-primary">Create</button>
          <button className="btn" onClick={close}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const ExpensePackageView: FC = ({}) => {
  const { connected } = useWallet();
  const { program } = useSlideProgram();
  const { query } = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [expenseManager, setExpenseManager] =
    useState<ExpenseManagerItem | null>(null);

  useEffect(() => {
    async function getExpenseManagers() {
      if (program !== undefined && !isLoading && query?.pubkey) {
        // TODO: filter these by membership.. maybe async?
        //   would be annoyingly slow to issue membership checks for each manager
        //   although for a demo it's not that bad (like 2 managers)
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
    getExpenseManagers().finally(() => setIsLoading(false));
  }, [program?.programId, query?.pubkey]);

  return (
    <div className="container mx-auto max-w-6xl p-8 2xl:px-0">
      <div className={styles.container}>
        <Nav />
        <div className="text-center pt-2">
          <div className="hero min-h-16 p-0 pt-10">
            <div className="text-center hero-content w-full">
              <div className="w-full">
                <div className="text-center">
                  <h1 className="mb-5 text-5xl">Expenses for Anmol DAO</h1>
                </div>
                {!isLoading && connected && expenseManager && (
                  <>
                    <button
                      className="btn btn-primary"
                      onClick={() => setOpen(true)}
                    >
                      Create Expense
                    </button>
                    <ExpensePackageContent
                      managerPubkey={expenseManager.publicKey}
                    />
                    <CreateExpensePackageModal
                      open={open}
                      close={() => setOpen(false)}
                      expenseManager={expenseManager}
                    />
                  </>
                )}
                {!isLoading && !connected && <PromptConnectWallet />}
                {isLoading && (
                  <div>
                    <Loader />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExpensePackageContent = ({
  managerPubkey,
}: {
  managerPubkey: PublicKey;
}) => {
  const { connected } = useWallet();
  const { program } = useSlideProgram();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [expensePackages, setExpensePackages] = useState<any>([]);

  useEffect(() => {
    async function getExpensePackages() {
      if (program !== undefined && !isLoading) {
        const managerFilter = {
          memcmp: { offset: 41, bytes: managerPubkey.toBase58() },
        };
        setExpensePackages(
          await program.account.expensePackage.all([managerFilter])
        );
      }
    }
    setIsLoading(true);
    getExpensePackages().finally(() => setIsLoading(false));
  }, [program?.programId]);

  if (!connected) {
    return <PromptConnectWallet />;
  }

  return (
    <div className="my-10">
      {isLoading ? (
        <div>
          <Loader />
        </div>
      ) : (
        <ExpensePackageList expensePackages={expensePackages} />
      )}
    </div>
  );
};

type ExpensePackageListProps = {
  expensePackages: ExpensePackageItem[];
  canApproveAndDeny?: boolean;
};

const ExpensePackageList = ({
  expensePackages,
  canApproveAndDeny,
}: ExpensePackageListProps) => {
  return (
    <div className="flex flex-col gap-4">
      {expensePackages.map((expensePackage) => (
        <ExpensePackageCard
          key={expensePackage.publicKey.toString()}
          expensePackage={expensePackage}
          canApproveAndDeny={canApproveAndDeny}
        />
      ))}
    </div>
  );
};
