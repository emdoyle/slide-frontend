import { FC, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Loader, Nav } from "components";

import styles from "./index.module.css";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import { useSlideProgram } from "../../utils/useSlide";
import { useRouter } from "next/router";
import { ExpenseManager, ExpenseManagerItem } from "../../types";
import {
  AccountMetaData,
  getAllProposals,
  getNativeTreasuryAddress,
  getTokenOwnerRecordAddress,
  InstructionData,
  VoteType,
  withCreateProposal,
  withInsertTransaction,
  withSignOffProposal,
} from "@solana/spl-governance";
import { constants, Slide, utils } from "@slidexyz/slide-sdk";
import { useBalance } from "../../utils/useBalance";
import { Program } from "@project-serum/anchor";
import {
  getSquadTreasuryAddressAndBump,
  SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
  withCreateProposalAccount,
} from "@slidexyz/squads-sdk";
import { PromptConnectWallet } from "../../components/PromptConnectWallet";
import { useAlert } from "react-alert";

const createSPLWithdrawalProposal = async (
  program: Program<Slide>,
  connection: Connection,
  user: PublicKey,
  expenseManager: ExpenseManagerItem
): Promise<string | undefined> => {
  const managerData = expenseManager.account;
  if (!managerData.realm || !managerData.governanceAuthority) {
    return "Manager not set up for SPL";
  }
  const proposalCount = (
    await getAllProposals(
      connection,
      constants.SPL_GOV_PROGRAM_ID,
      managerData.realm
    )
  ).length;
  const nativeTreasury = await getNativeTreasuryAddress(
    constants.SPL_GOV_PROGRAM_ID,
    managerData.governanceAuthority
  );
  const tokenOwnerRecord = await getTokenOwnerRecordAddress(
    constants.SPL_GOV_PROGRAM_ID,
    managerData.realm,
    managerData.membershipTokenMint,
    user
  );
  const instruction: TransactionInstruction = await program.methods
    .splGovWithdrawFromExpenseManager(managerData.realm)
    .accounts({
      expenseManager: expenseManager.publicKey,
      governanceAuthority: managerData.governanceAuthority,
      nativeTreasury,
    })
    .instruction();
  const instructionData = new InstructionData({
    programId: program.programId,
    accounts: instruction.keys.map((key) => new AccountMetaData({ ...key })),
    data: instruction.data,
  });
  // create a proposal containing those instructions
  let instructions: TransactionInstruction[] = [];
  const proposal = await withCreateProposal(
    instructions,
    constants.SPL_GOV_PROGRAM_ID,
    2,
    managerData.realm,
    managerData.governanceAuthority,
    tokenOwnerRecord,
    `[SLIDE] Withdraw all funds from expense manager ${expenseManager.publicKey.toString()}`,
    "",
    managerData.membershipTokenMint,
    user,
    proposalCount,
    new VoteType({ type: 0, choiceCount: 1 }),
    ["Withdraw"],
    true,
    user
  );
  await withInsertTransaction(
    instructions,
    constants.SPL_GOV_PROGRAM_ID,
    2,
    managerData.governanceAuthority,
    proposal,
    tokenOwnerRecord,
    user,
    0,
    0,
    0,
    [instructionData],
    user
  );
  // initiate voting on the proposal
  // TODO: this may not be necessary
  await withSignOffProposal(
    instructions,
    constants.SPL_GOV_PROGRAM_ID,
    2,
    managerData.realm,
    managerData.governanceAuthority,
    proposal,
    user,
    undefined,
    tokenOwnerRecord
  );

  // @ts-ignore
  await utils.flushInstructions(program, instructions, []);
};

const createSquadsWithdrawalProposal = async (
  program: Program<Slide>,
  user: PublicKey,
  expenseManager: ExpenseManagerItem,
  lamports: number
): Promise<string | undefined> => {
  const managerData = expenseManager.account;
  if (!managerData.squad) {
    return "Manager is not setup for Squads";
  }
  const [squadTreasury] = await getSquadTreasuryAddressAndBump(
    SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
    managerData.squad
  );
  const instructions: TransactionInstruction[] = [];
  const { proposal } = await withCreateProposalAccount(
    instructions,
    SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
    user,
    managerData.squad,
    3, // TODO: need to pull on-chain Squad data to figure out nonce
    0,
    "[SLIDE PROPOSAL] Withdrawal",
    `lamports: ${lamports}\nmanager: ${expenseManager.publicKey.toString()}\ntreasury: ${squadTreasury.toString()}`,
    2,
    ["Approve", "Deny"]
  );

  // @ts-ignore
  await utils.flushInstructions(program, instructions, []);

  return `Created proposal: ${proposal.toString()}`;
};

export const FundingView: FC = ({}) => {
  const Alert = useAlert();
  const { connection } = useConnection();
  const { connected, publicKey: userPublicKey } = useWallet();
  const { program } = useSlideProgram();
  const { query } = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [withdrawLoading, setWithdrawLoading] = useState<boolean>(false);
  const [expenseManager, setExpenseManager] =
    useState<ExpenseManagerItem | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");

  useEffect(() => {
    async function getExpenseManager() {
      if (program && userPublicKey && query?.pubkey) {
        const expenseManagerPubkey = new PublicKey(query.pubkey);
        const expenseManagerAccount: ExpenseManager =
          await program.account.expenseManager.fetch(expenseManagerPubkey);
        setExpenseManager({
          account: expenseManagerAccount,
          publicKey: expenseManagerPubkey,
        });
      }
    }
    setIsLoading(true);
    getExpenseManager().finally(() => setIsLoading(false));
  }, [program?.programId, query?.pubkey]);

  const withdrawFromManager = async (
    solWithdrawalAmount: string
  ): Promise<string | undefined> => {
    if (!program || !expenseManager || !userPublicKey) {
      throw new Error("Please connect your wallet");
    }
    let solWithdrawalNum;
    try {
      solWithdrawalNum = Number(solWithdrawalAmount);
    } catch {
      throw new Error("Withdrawal amount could not be parsed as a number.");
    }
    if (managerBalance && solWithdrawalNum > managerBalance) {
      throw new Error(
        `Withdrawal amount (${solWithdrawalNum}) exceeds balance of Expense Manager (${managerBalance}).`
      );
    }
    const lamports = Number(solWithdrawalAmount) * LAMPORTS_PER_SOL;

    const managerData = expenseManager.account;
    let alertText;
    if (managerData.realm && managerData.governanceAuthority) {
      // TODO: use lamports as input
      alertText = await createSPLWithdrawalProposal(
        program,
        connection,
        userPublicKey,
        expenseManager
      );
    } else {
      alertText = await createSquadsWithdrawalProposal(
        program,
        userPublicKey,
        expenseManager,
        lamports
      );
    }

    return alertText;
  };

  const { balance: managerBalance } = useBalance(
    expenseManager?.publicKey ?? null
  );
  let balanceDisplay;
  if (managerBalance) {
    balanceDisplay = `(Balance: ~${managerBalance.toFixed(2)}◎)`;
  } else {
    balanceDisplay = "(Balance: 0.00◎)";
  }

  return (
    <div className="container mx-auto max-w-6xl p-8 2xl:px-0">
      <div className={styles.container}>
        <Nav />

        <div className="text-center pt-2">
          <div className="hero min-h-16 py-4">
            <div className="text-center hero-content">
              <div className="max-w-lg">
                <h1 className="mb-5 text-5xl">Expense Manager Funding</h1>
                {isLoading && (
                  <div>
                    <Loader />
                  </div>
                )}
                {connected && !isLoading && expenseManager && (
                  <div className="flex flex-col gap-2 justify-center mt-5">
                    <p className="text-xl mb-5">
                      Deposit funds into your Slide Expense Manager using the
                      address below
                    </p>
                    <div className="card text-black bg-gray-400">
                      <div className="card-body">
                        <h3 className="card-title">
                          Expense Manager Address {balanceDisplay}
                        </h3>

                        <p>{expenseManager.publicKey.toString()}</p>
                        <div className="card-actions justify-end">
                          <button className="btn btn-primary">Copy</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {connected && !!managerBalance && (
                  <div className="flex flex-col gap-2 justify-center mt-10">
                    <p className="text-xl">
                      Create a Proposal to withdraw funds from your Slide
                      Expense Manager
                    </p>
                    <label className="label">
                      <span className="label-text">Withdrawal amount</span>
                    </label>
                    <input
                      disabled={withdrawLoading}
                      type="number"
                      placeholder="Amount (in SOL)"
                      className="input input-bordered"
                      max={managerBalance}
                      min={0}
                      step={1 / LAMPORTS_PER_SOL}
                      value={withdrawAmount}
                      onChange={(event) =>
                        setWithdrawAmount(event.target.value)
                      }
                    />
                    <button
                      disabled={withdrawLoading}
                      className="btn btn-error"
                      onClick={() => {
                        setWithdrawLoading(true);
                        withdrawFromManager(withdrawAmount)
                          .then((alertText?) => {
                            Alert.show(alertText ?? "Success");
                          })
                          .catch((err: Error) => Alert.error(err.message))
                          .finally(() => setWithdrawLoading(false));
                      }}
                    >
                      Withdraw
                    </button>
                    {withdrawLoading && (
                      <div>
                        <Loader noText />
                      </div>
                    )}
                  </div>
                )}
                {!connected && <PromptConnectWallet />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
