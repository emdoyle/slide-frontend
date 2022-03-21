import { FC, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Nav } from "components";

import styles from "./index.module.css";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
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
import { constants, utils } from "@slidexyz/slide-sdk";
import { useBalance } from "../../utils/useBalance";

export const FundingView: FC = ({}) => {
  const router = useRouter();
  const { connection } = useConnection();
  const { publicKey: userPublicKey } = useWallet();
  const { program } = useSlideProgram();
  const { query } = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [expenseManager, setExpenseManager] =
    useState<ExpenseManagerItem | null>(null);

  useEffect(() => {
    async function getExpenseManager() {
      if (program && userPublicKey && !isLoading && query?.pubkey) {
        // TODO: filter these by membership.. maybe async?
        //   would be annoyingly slow to issue membership checks for each manager
        //   although for a demo it's not that bad (like 2 managers)
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
    if (!program || !expenseManager || !userPublicKey) return;
    // generate instructions for withdrawal
    const managerData = expenseManager.account;
    if (managerData.realm && managerData.governanceAuthority) {
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
        userPublicKey
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
        accounts: instruction.keys.map(
          (key) => new AccountMetaData({ ...key })
        ),
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
        userPublicKey,
        proposalCount,
        new VoteType({ type: 0, choiceCount: 1 }),
        ["Withdraw"],
        true,
        userPublicKey
      );
      await withInsertTransaction(
        instructions,
        constants.SPL_GOV_PROGRAM_ID,
        2,
        managerData.governanceAuthority,
        proposal,
        tokenOwnerRecord,
        userPublicKey,
        0,
        0,
        0,
        [instructionData],
        userPublicKey
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
        userPublicKey,
        undefined,
        tokenOwnerRecord
      );

      // @ts-ignore
      await utils.flushInstructions(program, instructions, []);
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
                {balanceDisplay && <p className="text-xl">{balanceDisplay}</p>}
                {expenseManager && (
                  <div className="flex flex-col gap-2 justify-center mt-5">
                    <p className="text-xl">
                      Deposit funds into your Slide Expense Manager
                    </p>
                    <p>{expenseManager?.publicKey.toString()}</p>
                    {/*<button className="btn btn-primary">Copy</button>*/}
                  </div>
                )}

                <div className="flex flex-col gap-2 justify-center mt-10">
                  <p className="text-xl">
                    Create a Proposal to withdraw funds from your Slide Expense
                    Manager
                  </p>
                  <button
                    className="btn btn-error"
                    onClick={() =>
                      withdrawFromManager()
                        .then(() => router.reload())
                        .catch(alert)
                    }
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
