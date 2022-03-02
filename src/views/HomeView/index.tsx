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

          {/* <div className="max-w-4xl mx-auto">
            <h1 className="mb-5 pb-8 text-5xl">Templates:</h1>
            <ul className="text-left leading-10">
              <li className="mb-5">
                <Link href="/gallery">
                  <a className="text-4xl font-bold hover:underline">
                    🏞 -- NFT Gallery
                  </a>
                </Link>
              </li>
              <li className="mb-5">
                <Link href="/mint">
                  <a className="text-4xl font-bold hover:underline">
                    🍬 -- Candy Machine Mint UI
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/tweeter">
                  <a className="mb-5 text-4xl font-bold hover:underline">
                    🐦 -- Solana Tweeter
                  </a>
                </Link>
              </li>
            </ul>
          </div> */}
        </div>
      </div>
    </div>
  );
};
