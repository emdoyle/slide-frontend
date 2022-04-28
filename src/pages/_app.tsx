import React, { useEffect, useState } from "react";
import { SWRConfig } from "swr";
import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import { ConnectionProvider } from "@solana/wallet-adapter-react";
import { SlideProgramProvider } from "../contexts/SlideProgramProvider";
import { transitions, positions, Provider as AlertProvider } from "react-alert";
import AlertTemplate from "react-alert-template-basic";

import "tailwindcss/tailwind.css";
import "../styles/globals.css";
import "../styles/App.css";
import { serializePubkeysForCache } from "../utils/swrMiddleware";
import { useRouter } from "next/router";

// localnet (not really using this atm)
const LOCAL_CLUSTER = "http://127.0.0.1:8899";
// devnet
const DEVNET_CLUSTER = "https://api.devnet.solana.com";
const DEVNET = "devnet";
// mainnet
const MAINNET_CLUSTER = "https://ssc-dao.genesysgo.net";
const MAINNET = "mainnet-beta";

const WalletProvider = dynamic(
  () => import("../contexts/ClientWalletProvider"),
  {
    ssr: false,
  }
);

const AlertOptions = {
  position: positions.BOTTOM_LEFT,
  timeout: 4000,
  offset: "10px",
  transition: transitions.SCALE,
};

function MyApp({ Component, pageProps }: AppProps) {
  const { isReady } = useRouter();
  const [clusterEndpoint, setClusterEndpoint] =
    useState<string>(DEVNET_CLUSTER);
  const [clusterName, setClusterName] = useState<string>(DEVNET);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const subdomain = window.location.hostname.split(".")[0];
      if (subdomain === "mainnet") {
        setClusterEndpoint(MAINNET_CLUSTER);
        setClusterName(MAINNET);
      }
    }
  }, [isReady]);

  return (
    <SWRConfig value={{ use: [serializePubkeysForCache] }}>
      <ConnectionProvider endpoint={clusterEndpoint}>
        <WalletProvider>
          <SlideProgramProvider>
            <AlertProvider template={AlertTemplate} {...AlertOptions}>
              {/* Should probably use another provider for this */}
              <Component cluster={clusterName} {...pageProps} />
            </AlertProvider>
          </SlideProgramProvider>
        </WalletProvider>
      </ConnectionProvider>
    </SWRConfig>
  );
}

export default MyApp;
