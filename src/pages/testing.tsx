import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import {
  SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
  withAddMembersToSquad,
  withCastVote,
  withCreateSquad,
} from "@slidexyz/squads-sdk";
import { useSlideProgram } from "../utils/useSlide";
import { useWallet } from "@solana/wallet-adapter-react";
import { Nav } from "../components";
import BN from "bn.js";
import { Slide, utils } from "@slidexyz/slide-sdk";
import { Program } from "@project-serum/anchor";
import { useState } from "react";

const createSquad = async (program: Program<Slide>, user: PublicKey) => {
  const instructions: TransactionInstruction[] = [];
  const { squad } = await withCreateSquad(
    instructions,
    SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
    user,
    "my squad",
    "it's cool",
    "SLIDE",
    60,
    40
  );
  await withAddMembersToSquad(
    instructions,
    SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
    user,
    squad,
    [[user, new BN(100_000)]]
  );

  // @ts-ignore
  await utils.flushInstructions(program, instructions, []);
  alert(`Created Squad: ${squad.toString()}; member: ${user.toString()}`);
};

const approveProposal = async (
  program: Program<Slide>,
  user: PublicKey,
  squad: string,
  proposal: string
) => {
  let squadPubkey;
  let proposalPubkey;
  try {
    squadPubkey = new PublicKey(squad);
    proposalPubkey = new PublicKey(proposal);
  } catch {
    alert("Invalid pubkeys");
    return;
  }
  const instructions: TransactionInstruction[] = [];
  const { voteAccount } = await withCastVote(
    instructions,
    SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
    user,
    squadPubkey,
    proposalPubkey,
    0
  );

  // @ts-ignore
  await utils.flushInstructions(program, instructions, []);
  alert(
    `Approved Proposal: ${proposalPubkey.toString()} with Vote: ${voteAccount.toString()}`
  );
};

export default function Testing() {
  const { program } = useSlideProgram();
  const { publicKey: userPublicKey } = useWallet();
  const [proposal, setProposal] = useState<string>("");
  const [squad, setSquad] = useState<string>("");

  return (
    <>
      <Nav />
      <div className="flex flex-col justify-center items-center">
        <button
          className="btn"
          onClick={() => {
            if (!program || !userPublicKey) {
              alert("Connect wallet");
              return;
            }
            createSquad(program, userPublicKey);
          }}
        >
          Create Squad
        </button>
        <br />
        <br />
        <input
          id="squad-text-input"
          type="text"
          placeholder="Squad pubkey"
          onChange={(event) => setSquad(event.target.value)}
          value={squad}
        />
        <label htmlFor="squad-text-input">Squad</label>
        <input
          id="proposal-text-input"
          type="text"
          placeholder="Proposal pubkey"
          onChange={(event) => setProposal(event.target.value)}
          value={proposal}
        />
        <label htmlFor="proposal-text-input">Proposal</label>
        <button
          className="btn"
          onClick={() => {
            if (!program || !userPublicKey) {
              alert("Connect wallet");
              return;
            }
            approveProposal(program, userPublicKey, squad, proposal);
          }}
        >
          Approve Proposal
        </button>
      </div>
    </>
  );
}
