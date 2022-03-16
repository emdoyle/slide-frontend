import { FC } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";

export const Nav: FC<{}> = () => {
  return (
    <div className="navbar mb-2 shadow-lg bg-neutral text-neutral-content rounded-box">
      <Link href="/">
        <button className="btn btn-square btn-ghost">
          <span className="text-4xl">🏠</span>
        </button>
      </Link>
      <Link href="/managers">
        <button className="btn btn-square btn-ghost">
          <span className="text-4xl">🌐</span>
        </button>
      </Link>
      <div className="flex-1 px-2 mx-2">
        <span className="text-lg font-bold">Slide</span>
      </div>
      <div className="flex-none">
        <WalletMultiButton className="btn btn-ghost" />
      </div>
    </div>
  );
};
