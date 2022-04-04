import { FC } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";

export const Nav: FC<{}> = ({ children }) => {
  return (
    <div className="navbar mb-2 shadow-lg bg-neutral text-neutral-content rounded-box justify-between items-center">
      <div>
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
        <div className={`pl-2 ml-2 ${children && "pr-8 mr-6 border-r-2"}`}>
          <span className="text-lg font-bold">Slide</span>
        </div>
        {children}
      </div>
      <div className="pr-2">
        <WalletMultiButton className="btn btn-ghost" />
      </div>
    </div>
  );
};
