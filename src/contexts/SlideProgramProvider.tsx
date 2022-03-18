import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { FC, ReactNode } from "react";
import { PublicKey } from "@solana/web3.js";
import { getSlide } from "@slidexyz/slide-sdk";
import { SlideProgramContext } from "utils/useSlide";

export interface SlideProgramProviderProps {
  children: ReactNode;
  programId: PublicKey;
}

export const SlideProgramProvider: FC<SlideProgramProviderProps> = ({
  programId,
  children,
}) => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  let slideProgram;
  // TODO: problem with undefined when no wallet is connected:
  //   RPC queries shouldn't require connected wallet technically
  if (wallet === undefined) {
    slideProgram = undefined;
  } else {
    slideProgram = getSlide({ programId, connection, wallet });
  }

  return (
    // @ts-ignore
    <SlideProgramContext.Provider value={{ program: slideProgram }}>
      {children}
    </SlideProgramContext.Provider>
  );
};
export {};
