import { FC, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Loader, Nav } from "components";

import styles from "./index.module.css";
import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
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
  expenseManager: ExpenseManagerItem
): Promise<string | undefined> => {
  const managerData = expenseManager.account;
  if (!managerData.squad) {
    return "Manager is not setup for Squads";
  }
  const instructions: TransactionInstruction[] = [];
  const { proposal } = await withCreateProposalAccount(
    instructions,
    SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
    user,
    managerData.squad,
    3, // TODO: need to pull on-chain Squad data to figure out nonce
    0,
    "Withdrawal",
    `[SLIDEPROPOSAL]: This withdraws the balance of your Slide expense manager (${expenseManager.publicKey.toString()}) to the Squads SOL treasury`,
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

  const withdrawFromManager = async () => {
    if (!program || !expenseManager || !userPublicKey) {
      Alert.show("Please connect your wallet");
      return;
    }
    const managerData = expenseManager.account;
    let alertText;
    if (managerData.realm && managerData.governanceAuthority) {
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
        expenseManager
      );
    }

    if (alertText) {
      Alert.show(alertText);
    }
  };

  const { balance: managerBalance } = useBalance(
    expenseManager?.publicKey ?? null
  );
  let balanceDisplay;
  if (managerBalance) {
    balanceDisplay = `(Balance: ~${managerBalance.toFixed(2)}◎)`;
  } else {
    balanceDisplay = "";
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
                {!isLoading && balanceDisplay && (
                  <p className="text-xl">{balanceDisplay}</p>
                )}
                {connected && !isLoading && expenseManager && (
                  <div className="flex flex-col gap-2 justify-center mt-5">
                    <p className="text-xl">
                      Deposit funds into your Slide Expense Manager
                    </p>
                    <p>{expenseManager.publicKey.toString()}</p>
                    {/*<button className="btn btn-primary">Copy</button>*/}
                  </div>
                )}

                {connected && (
                  <div className="flex flex-col gap-2 justify-center mt-10">
                    <p className="text-xl">
                      Create a Proposal to withdraw funds from your Slide
                      Expense Manager
                    </p>
                    <button
                      disabled={withdrawLoading}
                      className="btn btn-error"
                      onClick={() => {
                        setWithdrawLoading(true);
                        withdrawFromManager()
                          .then(() => {
                            Alert.show("Success");
                          })
                          .catch(console.error)
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
