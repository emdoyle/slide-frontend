import { FC, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { Loader, Nav } from "components";
import { ExpensePackageCard } from "./ExpensePackageCard";
import styles from "./index.module.css";
import { PublicKey } from "@solana/web3.js";
import { useSlideProgram } from "../../utils/useSlide";
import { PromptConnectWallet } from "../../components/PromptConnectWallet";
import { ExpensePackageItem } from "../../types";
import { useRouter } from "next/router";

const Modal = ({ open, close }: { open: boolean; close(): void }) => (
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

export const ExpensePackageView: FC = ({}) => {
  const { query } = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="container mx-auto max-w-6xl p-8 2xl:px-0">
      <div className={styles.container}>
        <Nav />
        <div className="text-center pt-2">
          <div className="hero min-h-16 p-0 pt-10">
            <div className="text-center hero-content w-full">
              <div className="w-full">
                <div className="flex justify-between">
                  <h1 className="mb-5 text-5xl">Expenses for Anmol DAO</h1>
                  <button
                    className="btn btn-primary"
                    onClick={() => setOpen(true)}
                  >
                    Create Expense
                  </button>
                </div>
                {query?.pubkey && (
                  <ExpensePackageContent
                    managerPubkey={new PublicKey(query.pubkey)}
                  />
                )}
                <Modal open={open} close={() => setOpen(false)} />
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
  error?: Error;
};

const ExpensePackageList = ({ expensePackages }: ExpensePackageListProps) => {
  return (
    <div className="flex flex-col gap-4">
      {expensePackages.map((expensePackage) => (
        <ExpensePackageCard
          key={expensePackage.publicKey.toString()}
          expensePackage={expensePackage}
        />
      ))}
    </div>
  );
};
