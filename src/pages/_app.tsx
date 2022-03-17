import React from "react";
import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import { ConnectionProvider } from "@solana/wallet-adapter-react";
import { SlideProgramProvider } from "../contexts/SlideProgramProvider";

import "tailwindcss/tailwind.css";
import "../styles/globals.css";
import "../styles/App.css";
import { PublicKey } from "@solana/web3.js";

// localnet
// const endpoint = "http://127.0.0.1:8899";
// devnet
const endpoint = "https://api.devnet.solana.com";
// mainnet
// const endpoint = "https://ssc-dao.genesysgo.net";

const WalletProvider = dynamic(
  () => import("../contexts/ClientWalletProvider"),
  {
    ssr: false,
  }
);

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider>
        <SlideProgramProvider
          programId={
            // TODO: constant/configurable
            new PublicKey("3nunqfARwEnmSGg5b9aDEWuBVQHHHhztRAXR4bM4CYCE")
          }
        >
          <Component {...pageProps} />
        </SlideProgramProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default MyApp;
