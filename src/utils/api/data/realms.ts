import { Connection, PublicKey } from "@solana/web3.js";
import {
  getAllGovernances,
  getNativeTreasuryAddress,
  getRealms,
} from "@solana/spl-governance";

export async function fetchRealms(
  connection: Connection,
  programId: PublicKey
) {
  return await getRealms(connection, programId);
}

export async function fetchTreasuries(
  connection: Connection,
  programId: PublicKey,
  realm: PublicKey
) {
  // TODO:
  //   backend Program assumes that the governance is a 'token' governance
  //   because this is what the Realms UI creates when creating a native
  //   treasury. but it is possible to create other types of governances
  //   which also have a native treasury attached
  const governances = await getAllGovernances(connection, programId, realm);
  const treasuryPubkeys: PublicKey[] = [];
  for (let i = 0; i < governances.length; i++) {
    treasuryPubkeys.push(
      await getNativeTreasuryAddress(programId, governances[i].pubkey)
    );
  }
  return (await connection.getMultipleAccountsInfo(treasuryPubkeys)).flatMap(
    (account, idx) =>
      account
        ? [
            {
              account: account,
              pubkey: treasuryPubkeys[idx],
              governance: governances[idx],
            },
          ]
        : []
  );
}
