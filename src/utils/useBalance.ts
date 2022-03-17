import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import {
  getAccountInfo,
  getRentExemptBalance,
} from "@slidexyz/slide-sdk/utils";

export const useBalance = (account: PublicKey) => {
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [rentExempt, setRentExempt] = useState<number | null>(null);
  useEffect(() => {
    async function getBalance() {
      const accountInfo = await getAccountInfo(connection, account);
      const rentExemptBalance = await getRentExemptBalance(
        connection,
        accountInfo
      );
      const balanceMinusRent =
        (accountInfo.lamports - rentExemptBalance) / LAMPORTS_PER_SOL;
      setBalance(balanceMinusRent);
      setRentExempt(rentExemptBalance);
    }
    getBalance();
  }, [account.toString()]);
  return { balance, rentExempt };
};
