import React from "react";
import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import { ConnectionProvider } from "@solana/wallet-adapter-react";
import { SlideProgramProvider } from "../contexts/SlideProgramProvider";

import "tailwindcss/tailwind.css";
import "../styles/globals.css";
import "../styles/App.css";
import { PublicKey } from "@solana/web3.js";

// set custom RPC server endpoint for the final website
// const endpoint = "https://explorer-api.devnet.solana.com";
// const endpoint = "http://127.0.0.1:8899";
const endpoint = "https://ssc-dao.genesysgo.net";

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
            new PublicKey("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS")
          }
        >
          <Component {...pageProps} />
        </SlideProgramProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default MyApp;
