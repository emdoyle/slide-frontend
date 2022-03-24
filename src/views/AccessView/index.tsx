import { FC, useEffect, useState } from "react";
import { Loader, Nav } from "components";

import styles from "./index.module.css";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useSlideProgram } from "utils/useSlide";
import { PromptConnectWallet } from "components/PromptConnectWallet";
import { AccessRecordItem, ExpenseManager, ExpenseManagerItem } from "types";
import { AccessRecordCard } from "./AccessRecordCard";
import { useRouter } from "next/router";
import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { address, constants, Slide, utils } from "@slidexyz/slide-sdk";
import {
  AccountMetaData,
  getGovernance,
  getNativeTreasuryAddress,
  getTokenOwnerRecordAddress,
  InstructionData,
  VoteType,
  withCreateProposal,
  withInsertTransaction,
  withSignOffProposal,
} from "@solana/spl-governance";
import { Program } from "@project-serum/anchor";
import {
  SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
  withCreateProposalAccount,
  getProposals,
  ProposalItem,
} from "@slidexyz/squads-sdk";
import { useAlert } from "react-alert";
import { PendingAccessProposal } from "./PendingAccessProposal";

const createSPLAccessProposal = async (
  program: Program<Slide>,
  connection: Connection,
  user: PublicKey,
  expenseManager: ExpenseManagerItem,
  accessRecord: PublicKey
): Promise<string | undefined> => {
  const managerData = expenseManager.account;
  if (!managerData.realm || !managerData.governanceAuthority) {
    return "Manager not set up for SPL";
  }
  const proposalCount = (
    await getGovernance(connection, managerData.governanceAuthority)
  ).account.proposalCount;
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
    .splGovCreateAccessRecord(managerData.realm, user, {
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
    `[SLIDE] Grant Reviewer Access: ${user.toString()}`,
    "",
    managerData.membershipTokenMint,
    user,
    proposalCount,
    new VoteType({ type: 0, choiceCount: 1 }),
    ["Grant Access"],
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

const createSquadsAccessProposal = async (
  program: Program<Slide>,
  user: PublicKey,
  expenseManager: ExpenseManagerItem
): Promise<string | undefined> => {
  const managerData = expenseManager.account;
  if (!managerData.squad) {
    return "Manager not set up for Squads";
  }
  const instructions: TransactionInstruction[] = [];
  await withCreateProposalAccount(
    instructions,
    SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
    user,
    managerData.squad,
    1, // TODO: this requires us to pull Squad data from the chain!
    0,
    "Reviewer Access",
    `[SLIDEPROPOSAL]: This grants reviewer-level access in Slide to public key ${user.toString()}`,
    2,
    ["Approve", "Deny"]
  );

  // @ts-ignore
  await utils.flushInstructions(program, instructions, []);
};

export const AccessView: FC = ({}) => {
  const Alert = useAlert();
  const router = useRouter();
  const query = router.query;
  const { connection } = useConnection();
  const { connected, publicKey: userPublicKey } = useWallet();
  const { program } = useSlideProgram();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [proposalSubmitting, setProposalSubmitting] = useState<boolean>(false);
  const [expenseManager, setExpenseManager] =
    useState<ExpenseManagerItem | null>(null);

  async function fetchExpenseManager() {
    if (program && query?.pubkey) {
      setIsLoading(true);
      try {
        const expenseManagerPubkey = new PublicKey(query.pubkey);
        const expenseManagerAccount: ExpenseManager =
          await program.account.expenseManager.fetch(expenseManagerPubkey);
        setExpenseManager({
          account: expenseManagerAccount,
          publicKey: expenseManagerPubkey,
        });
      } catch (err) {
        if (err instanceof Error) {
          Alert.error(err.message);
        } else {
          Alert.error("An unknown error occurred");
        }
      } finally {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    fetchExpenseManager();
  }, [program?.programId, query?.pubkey]);

  const createAccessProposal = async () => {
    if (!program || !expenseManager || !userPublicKey) return;
    const managerData = expenseManager.account;
    let alertText;
    const [accessRecord] = address.getAccessRecordAddressAndBump(
      program.programId,
      expenseManager.publicKey,
      userPublicKey
    );
    if (managerData.realm && managerData.governanceAuthority) {
      alertText = await createSPLAccessProposal(
        program,
        connection,
        userPublicKey,
        expenseManager,
        accessRecord
      );
    } else {
      alertText = await createSquadsAccessProposal(
        program,
        userPublicKey,
        expenseManager
      );
    }
    if (alertText) {
      Alert.show(alertText);
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

                {connected && !isLoading && query?.pubkey && (
                  <>
                    <div className="flex flex-col gap-2 justify-center mt-5">
                      <p className="text-xl">
                        Create Proposal to grant your wallet
                        &apos;Reviewer&apos; access
                      </p>
                      <button
                        disabled={proposalSubmitting}
                        className="btn btn-primary"
                        onClick={() => {
                          setProposalSubmitting(true);
                          createAccessProposal()
                            .then(() => Alert.show("Success"))
                            .catch((err) => Alert.error(err.message))
                            .finally(() => setProposalSubmitting(false));
                        }}
                      >
                        Create
                      </button>
                    </div>
                    {expenseManager && (
                      <ProposalContent expenseManager={expenseManager} />
                    )}
                    <AccessRecordContent
                      managerPubkey={new PublicKey(query.pubkey)}
                    />
                  </>
                )}
                {connected && isLoading && (
                  <div>
                    <Loader />
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

const ProposalContent = ({
  expenseManager,
}: {
  expenseManager: ExpenseManagerItem;
}) => {
  const Alert = useAlert();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  async function fetchProposals() {
    if (expenseManager.account.squad) {
      setIsLoading(true);
      try {
        const proposalItems = await getProposals(
          SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
          connection,
          expenseManager.account.squad
        );
        setProposals(proposalItems);
      } catch (err) {
        if (err instanceof Error) {
          Alert.error(err.message);
        } else {
          Alert.error("An unknown error occurred");
        }
      } finally {
        setIsLoading(false);
      }
    }
  }
  useEffect(() => {
    fetchProposals();
  }, [expenseManager.account.squad?.toString()]);

  if (isLoading) {
    return (
      <div className="my-10">
        <Loader />
      </div>
    );
  }

  return <ProposalList proposals={proposals} expenseManager={expenseManager} />;
};

const ProposalList = ({
  proposals,
  expenseManager,
}: {
  proposals: ProposalItem[];
  expenseManager: ExpenseManagerItem;
}) => {
  const pendingAccessProposals = proposals.filter((proposal) =>
    proposal.account.title.includes("Reviewer Access")
  );
  if (!pendingAccessProposals) return null;
  return (
    <div className="flex flex-col gap-4 my-10">
      {pendingAccessProposals.map((proposal) => (
        <PendingAccessProposal
          key={proposal.pubkey.toString()}
          proposal={proposal}
          expenseManager={expenseManager}
        />
      ))}
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
      if (program) {
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
