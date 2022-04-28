import { Connection, PublicKey } from "@solana/web3.js";
import { getSquads } from "@slidexyz/squads-sdk";
import base58 from "bs58";

export async function fetchSquads(
  connection: Connection,
  programId: PublicKey
) {
  return await getSquads(programId, connection, {
    filters: [{ memcmp: { offset: 3, bytes: base58.encode([1]) } }],
  });
}
