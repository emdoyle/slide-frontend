import { NextApiRequest, NextApiResponse } from "next";
import {
  clusterApiUrl,
  Connection,
  sendAndConfirmRawTransaction,
} from "@solana/web3.js";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // verify that this is a POST request
  if (req.method !== "POST") {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({ error: "clusterForwarder only accepts POST requests" })
    );
    return;
  }
  // TODO: check Host header for devnet/mainnet-beta/other cluster
  const cluster = clusterApiUrl("devnet");
  // pull JSON payload and verify 'transaction' exists
  if (req.headers["content-type"] !== "application/json") {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "clusterForwarder POST request must have JSON body",
      })
    );
    return;
  }
  const transactionData = req.body["transaction"];
  if (!transactionData) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({ error: "'transaction' not found in request body" })
    );
    return;
  }
  // compile Transaction from serialized data
  // submit RPC request
  const conn = new Connection(cluster, { commitment: "confirmed" });
  let txSignature;
  let retryDelay = 500;
  while (true) {
    try {
      txSignature = await sendAndConfirmRawTransaction(
        conn,
        Buffer.from(transactionData)
      );
      break;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      if (retryDelay > 4000) {
        // catch errors and return those (500)
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: errorMessage }));
        return;
      } else {
        console.error(errorMessage);
        console.error(`Retrying in ${retryDelay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        retryDelay *= 2;
      }
    }
  }
  // if successful,
  // return (200)
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ signature: txSignature }));
}
