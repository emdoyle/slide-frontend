import { FC, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletNfts, NftTokenAccount } from "@nfteyez/sol-rayz-react";
import { useConnection } from "@solana/wallet-adapter-react";

import { Loader, Nav } from "components";
import { TransactionCard } from "./TransactionCard";
import styles from "./index.module.css";
const walletPublicKey = "3EqUrFrjgABCWAnqMYjZ36GcktiwDtFdkNYwY6C6cDzy";

const transactions = [
  { name: "Coffee", id: "1" },
  { name: "Lunch", id: "2" },
];

export const TransactionView: FC = ({}) => {
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
                <h1 className="mb-5 text-5xl">Transactions for Anmol DAO</h1>

                <div className="w-full min-w-full">
                  <p className="mb-5">
                    Here are some DAOs that use Slide to manage expenses
                  </p>
                </div>
                <div className="my-10">
                  <TransactionList transactions={transactions} />
                </div>
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
