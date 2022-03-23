import { Transaction, TransactionInstruction } from "@solana/web3.js";
import {
  SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
  withAddMembersToSquad,
  withCreateSquad,
} from "@slidexyz/squads-sdk";
import { useSlideProgram } from "../utils/useSlide";
import { useWallet } from "@solana/wallet-adapter-react";
import { Nav } from "../components";
import BN from "bn.js";

export default function Testing() {
  const { program } = useSlideProgram();
  const { publicKey: userPublicKey } = useWallet();
  const test = async () => {
    if (!program || !userPublicKey) {
      alert("Connect wallet");
      return;
    }
    const instructions: TransactionInstruction[] = [];
    const { squad, squadMint, squadSol, randomId } = await withCreateSquad(
      instructions,
      SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
      userPublicKey,
      "my squad",
      "it's cool",
      "SLIDE",
      60,
      40
    );
    await withAddMembersToSquad(
      instructions,
      SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
      userPublicKey,
      squad,
      [[userPublicKey, new BN(100_000)]]
    );

    const txn = new Transaction();
    txn.add(...instructions);
    await program.provider.send(txn);
    alert(
      `Created Squad: ${squad.toString()}; member: ${userPublicKey.toString()}`
    );
  };

  return (
    <>
      <Nav />
      <div className="flex justify-center items-center">
        <button className="btn" onClick={test}>
          Test
        </button>
      </div>
    </>
  );
}
