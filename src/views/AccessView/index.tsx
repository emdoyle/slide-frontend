import { FC, useEffect, useState } from "react";
import { Loader, Nav } from "components";

import styles from "./index.module.css";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useSlideProgram } from "utils/useSlide";
import { PromptConnectWallet } from "components/PromptConnectWallet";
import { AccessRecordItem, ExpenseManager, ExpenseManagerItem } from "types";
import { AccessRecordCard } from "./AccessRecordCard";
import { useRouter } from "next/router";
import { PublicKey } from "@solana/web3.js";
import {
  SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
  getProposals,
  ProposalItem,
} from "@slidexyz/squads-sdk";
import { useAlert } from "react-alert";
import { PendingAccessProposal } from "./PendingAccessProposal";
import { CreateAccessProposalModal } from "./CreateAccessProposalModal";

export const AccessView: FC = ({}) => {
  const Alert = useAlert();
  const router = useRouter();
  const query = router.query;
  const { connected, publicKey: userPublicKey } = useWallet();
  const { program } = useSlideProgram();
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
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
                  Officers are granted permission to approve and deny expenses
                  using Proposals submitted to your DAO.
                </p>

                {connected && !isLoading && query?.pubkey && (
                  <>
                    <div className="flex flex-col gap-2 justify-center mt-5">
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          setModalOpen(true);
                        }}
                      >
                        Request Access
                      </button>
                    </div>
                    {expenseManager && (
                      <>
                        <ProposalContent expenseManager={expenseManager} />
                        <CreateAccessProposalModal
                          open={modalOpen}
                          close={() => setModalOpen(false)}
                          expenseManager={expenseManager}
                        />
                      </>
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

  const pendingAccessProposals = proposals.filter((proposal) =>
    proposal.account.title.includes("Grant Permission")
  );

  if (isLoading) {
    return (
      <div className="my-10">
        <Loader />
      </div>
    );
  }

  if (!pendingAccessProposals.length) return null;

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

  if (isLoading) {
    return (
      <div>
        <Loader />
      </div>
    );
  }

  if (!accessRecords.length) return null;

  return (
    <div className="my-10">
      <AccessRecordList accessRecords={accessRecords} />
    </div>
  );
};

type AccessRecordListProps = {
  accessRecords: AccessRecordItem[];
};

const AccessRecordList = ({ accessRecords }: AccessRecordListProps) => {
  return (
    <div className="flex flex-col gap-4 justify-start text-left">
      <h3 className="text-2xl">Officers</h3>
      <div className="flex flex-col gap-4 my-4">
        {accessRecords.map((accessRecord) => (
          <AccessRecordCard
            key={accessRecord.publicKey.toString()}
            accessRecord={accessRecord}
          />
        ))}
      </div>
    </div>
  );
};
