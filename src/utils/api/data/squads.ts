import { Connection, PublicKey } from "@solana/web3.js";
import { getSquads } from "@slidexyz/squads-sdk";
import base58 from "bs58";

export const SQUADS_KEY = "squads";

export const fetchSquads = async (
  connection: Connection,
  programId: PublicKey
) => {
  return await getSquads(programId, connection, {
    filters: [{ memcmp: { offset: 3, bytes: base58.encode([1]) } }],
  });
};
