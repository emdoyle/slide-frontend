import { FC } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Nav } from "components";

import styles from "./index.module.css";

export const HomeView: FC = ({}) => {
  const { publicKey } = useWallet();

  return (
    <div className="container mx-auto max-w-6xl p-8 2xl:px-0">
      <div className={styles.container}>
        <Nav />

        <div className="text-center pt-2">
          <div className="hero min-h-16 py-4">
            <div className="text-center hero-content">
              <div className="max-w-lg">
                <h1 className="mb-5 text-5xl font-bold">Welcome to Slide!</h1>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
