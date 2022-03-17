import { FC } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Nav } from "components";

import styles from "./index.module.css";

export const FundingView: FC = ({}) => {
  const { publicKey } = useWallet();

  return (
    <div className="container mx-auto max-w-6xl p-8 2xl:px-0">
      <div className={styles.container}>
        <Nav />

        <div className="text-center pt-2">
          <div className="hero min-h-16 py-4">
            <div className="text-center hero-content">
              <div className="max-w-lg">
                <h1 className="mb-5 text-5xl">Expense Manager Funding</h1>
                <p className="text-xl">Current balance: 10◎</p>
                <div className="flex flex-col gap-2 justify-center mt-5">
                  <p className="text-xl">
                    Create Proposal to fund your Slide Expense Manager
                  </p>
                  <input
                    type="number"
                    placeholder="Amount (in SOL)"
                    className="input input-bordered w-full bg-white text-black"
                  />
                  <button className="btn btn-primary">Create</button>
                </div>

                <div className="flex flex-col gap-2 justify-center mt-10">
                  <p className="text-xl">
                    Create Proposal to withdraw funds from your Slide Expense
                    Manager
                  </p>
                  <button className="btn btn-error">Withdraw</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
