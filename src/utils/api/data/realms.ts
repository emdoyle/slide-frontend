import { Connection, PublicKey } from "@solana/web3.js";
import {
  getAllGovernances,
  getNativeTreasuryAddress,
  getRealms,
} from "@solana/spl-governance";

export async function fetchRealms(
  connection: Connection,
  programIds: PublicKey[]
) {
  const results = [];
  for (let i = 0; i < programIds.length; i++) {
    results.push(await getRealms(connection, programIds[i]));
    // artificial slowdown to avoid rate limit
    // TODO: either need to get a private RPC or cache this data server-side
    //   staticProps is an option but need to deal with serialization
    //   prob need to deal with serialization regardless
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return results.flat();
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
