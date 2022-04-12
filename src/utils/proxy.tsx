import { Connection, Transaction } from "@solana/web3.js";
import { Wallet } from "@project-serum/anchor/src/provider";

export const postTransaction = async (
  connection: Connection,
  wallet: Wallet,
  transaction: Transaction
): Promise<any> => {
  transaction.feePayer = wallet.publicKey;
  transaction.recentBlockhash = (
    await connection.getLatestBlockhash()
  ).blockhash;
  await wallet.signTransaction(transaction);
  const wireTxn = transaction.serialize();
  const response = await fetch("/api/clusterProxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transaction: wireTxn }),
  });

  // If the status code is not in the range 200-299,
  // we still try to parse and throw it.
  if (!response.ok) {
    const error = new Error("An error occurred while fetching the data.");
    // Attach extra info to the error object.
    const info = await response.json();
    (error as any).status = response.status;

    console.warn("\nAn error occured while fetching:\n", info);

    throw error;
  }

  return response.json();
};
