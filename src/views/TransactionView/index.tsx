import { FC, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletNfts, NftTokenAccount } from "@nfteyez/sol-rayz-react";
import { useConnection } from "@solana/wallet-adapter-react";

import { Loader, Nav } from "components";
import { TransactionCard } from "./TransactionCard";
import styles from "./index.module.css";
const walletPublicKey = "3EqUrFrjgABCWAnqMYjZ36GcktiwDtFdkNYwY6C6cDzy";

const transactions = [
  { name: "Coffee", id: "1", status: "pending" },
  { name: "Lunch", id: "2", status: "approved" },
  { name: "Desk", id: "3", status: "denied" },
];

const Modal = ({ open, close }: { open: boolean; close(): void }) => (
  <div className={`modal ${open && "modal-open"}`}>
    <div className="modal-box">
      <h3 className="font-bold text-lg">Add a new expense</h3>
      <div className="flex gap-2 mt-4 justify-center">
        <button className="btn btn-primary">Create</button>
        <button className="btn" onClick={close}>
          Close
        </button>
      </div>
    </div>
  </div>
);

export const TransactionView: FC = ({}) => {
  const [open, setOpen] = useState(false);
  const { connection } = useConnection();
  const [walletToParsePublicKey, setWalletToParsePublicKey] =
    useState<string>(walletPublicKey);
  const { publicKey } = useWallet();
  return (
    <div className="container mx-auto max-w-6xl p-8 2xl:px-0">
      <div className={styles.container}>
        <Nav />
        <div className="text-center pt-2">
          <div className="hero min-h-16 p-0 pt-10">
            <div className="text-center hero-content w-full">
              <div className="w-full">
                <div className="flex justify-between">
                  <h1 className="mb-5 text-5xl">Transactions for Anmol DAO</h1>
                  <button
                    className="btn btn-primary"
                    onClick={() => setOpen(true)}
                  >
                    Create Expense
                  </button>
                </div>
                <div className="my-4">
                  <TransactionList transactions={transactions} />
                </div>
                <Modal open={open} close={() => setOpen(false)} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

type TransactionListProps = {
  transactions: any[];
};

const TransactionList = ({ transactions }: TransactionListProps) => {
  return (
    <div className="flex flex-col gap-4">
      {transactions?.map((transaction) => (
        <TransactionCard key={transaction.id} details={transaction} />
      ))}
    </div>
  );
};
