import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { utils } from "@slidexyz/slide-sdk";
import { estimateRentExemptBalanceStatic } from "./rent";

export const useBalance = (account: PublicKey | null) => {
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [rentExempt, setRentExempt] = useState<number | null>(null);
  useEffect(() => {
    async function getBalance() {
      if (account) {
        const accountInfo = await utils.getAccountInfo(connection, account);
        const rentExemptBalance = estimateRentExemptBalanceStatic(
          accountInfo.data.byteLength
        );
        const balanceMinusRent =
          (accountInfo.lamports - rentExemptBalance) / LAMPORTS_PER_SOL;
        setBalance(balanceMinusRent);
        setRentExempt(rentExemptBalance);
      }
    }
    getBalance();
  }, [account?.toString()]);
  return { balance, rentExempt };
};
