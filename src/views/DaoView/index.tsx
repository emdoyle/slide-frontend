import { FC, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletNfts, NftTokenAccount } from "@nfteyez/sol-rayz-react";
import { useConnection } from "@solana/wallet-adapter-react";

import { Loader, Nav } from "components";
import { DAOCard } from "./DAOCard";
import styles from "./index.module.css";
const walletPublicKey = "3EqUrFrjgABCWAnqMYjZ36GcktiwDtFdkNYwY6C6cDzy";

const DAOs = [
  { name: "Anmol DAO", id: "1" },
  { name: "Evan DAO", id: "2" },
];

export const DAOView: FC = ({}) => {
  const { connection } = useConnection();
  const [walletToParsePublicKey, setWalletToParsePublicKey] =
    useState<string>(walletPublicKey);
  const { publicKey } = useWallet();

  const { nfts, isLoading } = useWalletNfts({
    publicAddress: walletToParsePublicKey,
    connection,
  });

  // const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const { value } = e.target;
  //   setWalletToParsePublicKey(value.trim());
  // };

  // const onUseWalletClick = () => {
  //   if (publicKey) {
  //     setWalletToParsePublicKey(publicKey?.toBase58());
  //   }
  // };

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
                    <DAOList daos={DAOs} />
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

type DAOListProps = {
  daos: any[];
  error?: Error;
};

const DAOList = ({ daos }: DAOListProps) => {
  return (
    <div className="flex flex-col gap-4">
      {daos?.map((dao) => (
        <DAOCard key={dao.id} details={dao} />
      ))}
    </div>
  );
};
