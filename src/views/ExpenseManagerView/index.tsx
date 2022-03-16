import { FC } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";

import { Loader, Nav } from "components";
import { ExpenseManagerCard } from "./ExpenseManagerCard";
import styles from "./index.module.css";

const expenseManagers = [
  { name: "Anmol DAO", id: "1" },
  { name: "Evan DAO", id: "2" },
];

export const ExpenseManagerView: FC = ({}) => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  // TODO: actually fetch expense managers for publicKey (slide SDK/anchor program)
  const isLoading = false;

  return (
    <div className="container mx-auto max-w-6xl p-8 2xl:px-0">
      <div className={styles.container}>
        <Nav />

        <div className="text-center pt-2">
          <div className="hero min-h-16 p-0 pt-10">
            <div className="text-center hero-content w-full">
              <div className="w-full">
                <h1 className="mb-5 text-5xl">Solana DAOs on Slide</h1>

                <div className="w-full min-w-full">
                  <p className="mb-5">
                    Here are some DAOs that use Slide to manage expenses
                  </p>
                </div>
                <div className="my-10">
                  {isLoading ? (
                    <div>
                      <Loader />
                    </div>
                  ) : (
                    <ExpenseManagerList expenseManagers={expenseManagers} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

type ExpenseManagerListProps = {
  expenseManagers: any[];
  error?: Error;
};

const ExpenseManagerList = ({ expenseManagers }: ExpenseManagerListProps) => {
  return (
    <div className="flex flex-col gap-4">
      {expenseManagers?.map((expenseManager) => (
        <ExpenseManagerCard key={expenseManager.id} details={expenseManager} />
      ))}
    </div>
  );
};
