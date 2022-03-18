import { FC, useEffect, useState } from "react";
import { Loader, Nav } from "components";

import styles from "./index.module.css";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useSlideProgram } from "utils/useSlide";
import { PromptConnectWallet } from "components/PromptConnectWallet";
import { AccessRecordItem, ExpenseManager, ExpenseManagerItem } from "types";
import { AccessRecordCard } from "./AccessRecordCard";
import { useRouter } from "next/router";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { getAccessRecordAddressAndBump } from "@slidexyz/slide-sdk/address";
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
import { SPL_GOV_PROGRAM_ID } from "@slidexyz/slide-sdk/constants";
import { flushInstructions } from "@slidexyz/slide-sdk/utils";

export const AccessView: FC = ({}) => {
  const { query } = useRouter();
  const { connection } = useConnection();
  const { connected, publicKey: userPublicKey } = useWallet();
  const { program } = useSlideProgram();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [expenseManager, setExpenseManager] =
    useState<ExpenseManagerItem | null>(null);

  useEffect(() => {
    async function getExpenseManager() {
      if (program !== undefined && !isLoading && query?.pubkey) {
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

  const createAccessProposal = async () => {
    if (!program || !expenseManager || !userPublicKey) return;
    const managerData = expenseManager.account;
    const [accessRecord] = getAccessRecordAddressAndBump(
      program.programId,
      expenseManager.publicKey,
      userPublicKey
    );
    if (managerData.realm && managerData.governanceAuthority) {
      const proposalCount = (
        await getAllProposals(connection, SPL_GOV_PROGRAM_ID, managerData.realm)
      ).length;
      const nativeTreasury = await getNativeTreasuryAddress(
        SPL_GOV_PROGRAM_ID,
        managerData.governanceAuthority
      );
      const tokenOwnerRecord = await getTokenOwnerRecordAddress(
        SPL_GOV_PROGRAM_ID,
        managerData.realm,
        managerData.membershipTokenMint,
        userPublicKey
      );
      const instruction: TransactionInstruction = await program.methods
        .splGovCreateAccessRecord(managerData.realm, userPublicKey, {
          reviewer: {},
        })
        .accounts({
          accessRecord,
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
        SPL_GOV_PROGRAM_ID,
        2,
        managerData.realm,
        managerData.governanceAuthority,
        tokenOwnerRecord,
        `[SLIDE] Grant Reviewer Access: ${userPublicKey.toString()}`,
        "",
        managerData.membershipTokenMint,
        userPublicKey,
        proposalCount,
        new VoteType({ type: 0, choiceCount: 1 }),
        ["Grant Access"],
        true,
        userPublicKey
      );
      await withInsertTransaction(
        instructions,
        SPL_GOV_PROGRAM_ID,
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
        SPL_GOV_PROGRAM_ID,
        2,
        managerData.realm,
        managerData.governanceAuthority,
        proposal,
        userPublicKey,
        undefined,
        tokenOwnerRecord
      );

      await flushInstructions(program, instructions, []);
    }
  };

  return (
    <div className="container mx-auto max-w-6xl p-8 2xl:px-0">
      <div className={styles.container}>
        <Nav />

        <div className="text-center pt-2">
          <div className="hero min-h-16 py-4">
            <div className="text-center hero-content">
              <div className="max-w-lg">
                <h1 className="mb-5 text-5xl">Expense Manager Access</h1>
                <p className="text-xl mb-5">
                  View who can approve and deny expenses
                </p>

                {connected && query?.pubkey && (
                  <>
                    <div className="flex flex-col gap-2 justify-center mt-5">
                      <p className="text-xl">
                        Create Proposal to grant your wallet
                        &apos;Reviewer&apos; access
                      </p>
                      <button
                        className="btn btn-primary"
                        onClick={() =>
                          createAccessProposal()
                            .then(() => alert("Hooray!"))
                            .catch(alert)
                        }
                      >
                        Create
                      </button>
                    </div>
                    <AccessRecordContent
                      managerPubkey={new PublicKey(query.pubkey)}
                    />
                  </>
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

const AccessRecordContent = ({
  managerPubkey,
}: {
  managerPubkey: PublicKey;
}) => {
  const { program } = useSlideProgram();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [accessRecords, setAccessRecords] = useState<any>([]);

  useEffect(() => {
    async function getAccessRecords() {
      if (program !== undefined && !isLoading) {
        const managerFilter = {
          memcmp: { offset: 41, bytes: managerPubkey.toBase58() },
        };
        setAccessRecords(
          await program.account.accessRecord.all([managerFilter])
        );
      }
    }
    setIsLoading(true);
    getAccessRecords().finally(() => setIsLoading(false));
  }, [program?.programId]);

  return (
    <div className="my-10">
      {isLoading ? (
        <div>
          <Loader />
        </div>
      ) : (
        <AccessRecordList accessRecords={accessRecords} />
      )}
    </div>
  );
};

type AccessRecordListProps = {
  accessRecords: AccessRecordItem[];
  error?: Error;
};

const AccessRecordList = ({ accessRecords }: AccessRecordListProps) => {
  return (
    <div className="flex flex-col gap-4">
      {accessRecords.map((accessRecord) => (
        <AccessRecordCard
          key={accessRecord.publicKey.toString()}
          accessRecord={accessRecord}
        />
      ))}
    </div>
  );
};
