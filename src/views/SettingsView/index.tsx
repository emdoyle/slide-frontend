import { FC } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Nav } from "components";

import styles from "./index.module.css";

export const SettingsView: FC = ({}) => {
  const { publicKey } = useWallet();

  return (
    <div className="container mx-auto max-w-6xl p-8 2xl:px-0">
      <div className={styles.container}>
        <Nav />

        <div className="text-center pt-2">
          <div className="hero min-h-16 py-4">
            <div className="text-center hero-content">
              <div className="max-w-lg">
                <h1 className="mb-5 text-5xl">Expense Management Settings</h1>
                <div className="flex flex-col gap-2 justify-center">
                  <input
                    type="text"
                    placeholder="Name"
                    className="input input-bordered w-full bg-white text-black"
                  />
                  <input
                    type="text"
                    placeholder="DAO Token Mint Authority"
                    className="input input-bordered w-full bg-white text-black"
                  />
                  <button className="btn btn-primary">Save</button>
                </div>

                <div className="flex flex-col gap-2 justify-center mt-10">
                  <p className="text-xl">
                    Create Proposal to send amount your Slide Expense Manager
                  </p>
                  <input
                    type="number"
                    placeholder="Amount (in SOL)"
                    className="input input-bordered w-full bg-white text-black"
                  />
                  <button className="btn btn-primary">Create</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
