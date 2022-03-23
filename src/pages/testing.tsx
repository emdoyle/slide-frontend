import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import {
  getSquadMintAddressAndBump,
  getSquadTreasuryAddressAndBump,
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
import { getAccessRecordAddressAndBump } from "@slidexyz/slide-sdk/lib/address";

const createSquad = async (
  program: Program<Slide>,
  user: PublicKey,
  name?: string,
  token?: string
) => {
  const instructions: TransactionInstruction[] = [];
  const { squad } = await withCreateSquad(
    instructions,
    SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
    user,
    name ?? "my squad",
    "it's cool",
    token ?? "SLIDE",
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

const executeAccessProposal = async (
  program: Program<Slide>,
  user: PublicKey,
  squad: string,
  proposal: string,
  expenseManager: string
) => {
  let squadPubkey;
  let proposalPubkey;
  let expenseManagerPubkey;
  try {
    squadPubkey = new PublicKey(squad);
    proposalPubkey = new PublicKey(proposal);
    expenseManagerPubkey = new PublicKey(expenseManager);
  } catch {
    alert("Invalid pubkeys");
    return;
  }
  const [accessRecord] = getAccessRecordAddressAndBump(
    program.programId,
    expenseManagerPubkey,
    user
  );
  const [squadMint] = await getSquadMintAddressAndBump(
    SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
    squadPubkey
  );
  await program.methods
    .squadsExecuteAccessProposal()
    .accounts({
      proposal: proposalPubkey,
      accessRecord,
      expenseManager: expenseManagerPubkey,
      squad: squadPubkey,
      squadMint,
      member: user,
      signer: user,
    })
    .rpc();
  alert(
    `Access Proposal: ${proposal} executed! User: ${user.toString()} should now have access`
  );
};

const executeWithdrawalProposal = async (
  program: Program<Slide>,
  user: PublicKey,
  squad: string,
  proposal: string,
  expenseManager: string
) => {
  let squadPubkey;
  let proposalPubkey;
  let expenseManagerPubkey;
  try {
    squadPubkey = new PublicKey(squad);
    proposalPubkey = new PublicKey(proposal);
    expenseManagerPubkey = new PublicKey(expenseManager);
  } catch {
    alert("Invalid pubkeys");
    return;
  }
  const [squadMint] = await getSquadMintAddressAndBump(
    SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
    squadPubkey
  );
  const [squadTreasury] = await getSquadTreasuryAddressAndBump(
    SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
    squadPubkey
  );
  await program.methods
    .squadsExecuteWithdrawalProposal()
    .accounts({
      proposal: proposalPubkey,
      expenseManager: expenseManagerPubkey,
      squad: squadPubkey,
      squadMint,
      squadTreasury,
      signer: user,
    })
    .rpc();
  alert(
    `Withdrawal Proposal: ${proposal} executed! ${expenseManager} should have been debited to rent-exempt minimum, crediting ${squadTreasury.toString()}`
  );
};

export default function Testing() {
  const { program } = useSlideProgram();
  const { publicKey: userPublicKey } = useWallet();
  const [name, setName] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [proposal, setProposal] = useState<string>("");
  const [squad, setSquad] = useState<string>("");
  const [expenseManager, setExpenseManager] = useState<string>("");

  return (
    <>
      <Nav />
      <div className="flex flex-col justify-center items-center">
        <input
          className="text-primary"
          id="name-text-input"
          type="text"
          placeholder="Squad name"
          onChange={(event) => setName(event.target.value)}
          value={name}
        />
        <label htmlFor="squad-text-input">Name</label>
        <input
          className="text-primary"
          id="token-text-input"
          type="text"
          placeholder="Token symbol"
          onChange={(event) => setToken(event.target.value)}
          value={token}
        />
        <label htmlFor="proposal-text-input">Token</label>
        <button
          className="btn"
          onClick={() => {
            if (!program || !userPublicKey) {
              alert("Connect wallet");
              return;
            }
            createSquad(program, userPublicKey, name, token);
          }}
        >
          Create Squad
        </button>
        <br />
        <br />
        <input
          className="text-primary"
          id="squad-text-input"
          type="text"
          placeholder="Squad pubkey"
          onChange={(event) => setSquad(event.target.value)}
          value={squad}
        />
        <label htmlFor="squad-text-input">Squad</label>
        <input
          className="text-primary"
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
        <br />
        <br />
        <input
          className="text-primary"
          id="expense-manager-text-input"
          type="text"
          placeholder="Expense Manager pubkey"
          onChange={(event) => setExpenseManager(event.target.value)}
          value={expenseManager}
        />
        <label htmlFor="expense-manager-text-input">Expense Manager</label>
        <button
          className="btn"
          onClick={() => {
            if (!program || !userPublicKey) {
              alert("Connect wallet");
              return;
            }
            executeAccessProposal(
              program,
              userPublicKey,
              squad,
              proposal,
              expenseManager
            );
          }}
        >
          Execute Access Proposal
        </button>
        <button
          className="btn"
          onClick={() => {
            if (!program || !userPublicKey) {
              alert("Connect wallet");
              return;
            }
            executeWithdrawalProposal(
              program,
              userPublicKey,
              squad,
              proposal,
              expenseManager
            );
          }}
        >
          Execute Withdrawal Proposal
        </button>
      </div>
    </>
  );
}
