import { FC, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { Loader, Nav } from "components";
import { ExpenseManagerCard } from "./ExpenseManagerCard";
import styles from "./index.module.css";
import { useSlideProgram } from "utils/useSlide";
import { PromptConnectWallet } from "components/PromptConnectWallet";
import { ExpenseManagerItem } from "types";

export const ExpenseManagerView: FC = ({}) => {
  return (
    <div className="container mx-auto max-w-6xl p-8 2xl:px-0">
      <div className={styles.container}>
        <Nav />

        <div className="text-center pt-2">
          <div className="hero min-h-16 p-0 pt-10">
            <div className="text-center hero-content w-full">
              <div className="w-full">
                <h1 className="mb-5 text-5xl">Your DAOs</h1>

                <div className="w-full min-w-full">
                  <p className="mb-5">Manage expenses for your DAOs</p>
                </div>

                <button className="btn btn-primary">+ Add Manager</button>

                <ExpenseManagerContent />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExpenseManagerContent = () => {
  const { connected } = useWallet();
  const { program } = useSlideProgram();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [expenseManagers, setExpenseManagers] = useState<any>([]);

  useEffect(() => {
    async function getExpenseManagers() {
      if (program !== undefined && !isLoading) {
        setExpenseManagers(await program.account.expenseManager.all());
      }
    }
    setIsLoading(true);
    getExpenseManagers().finally(() => setIsLoading(false));
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
        <ExpenseManagerList expenseManagers={expenseManagers} />
      )}
    </div>
  );
};

type ExpenseManagerListProps = {
  expenseManagers: ExpenseManagerItem[];
  error?: Error;
};

const ExpenseManagerList = ({ expenseManagers }: ExpenseManagerListProps) => {
  return (
    <div className="flex flex-col gap-4">
      {expenseManagers.map((expenseManager) => (
        <ExpenseManagerCard
          key={expenseManager.publicKey.toString()}
          expenseManager={expenseManager}
        />
      ))}
    </div>
  );
};
