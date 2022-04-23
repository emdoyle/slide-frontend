import { FC, useEffect, useState } from "react";
import { Loader } from "components";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useSlideProgram } from "utils/useSlide";
import { PromptConnectWallet } from "components/PromptConnectWallet";
import { AccessRecordItem, ExpenseManager, ExpenseManagerItem } from "types";
import { AccessRecordCard } from "./AccessRecordCard";
import { useRouter } from "next/router";
import { PublicKey } from "@solana/web3.js";
import { useAlert } from "react-alert";
import { PendingAccessProposal } from "./PendingAccessProposal";
import { CreateAccessProposalModal } from "./CreateAccessProposalModal";
import { isAccessRequest } from "utils/proposals";
import { useProposals } from "../../utils/api/useProposals";

export const AccessView: FC = ({}) => {
  const Alert = useAlert();
  const router = useRouter();
  const query = router.query;
  const { connected } = useWallet();
  const { program } = useSlideProgram();
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [expenseManager, setExpenseManager] =
    useState<ExpenseManagerItem | null>(null);
  const [accessRecords, setAccessRecords] = useState<any>([]);

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

  async function fetchAccessRecords() {
    if (program && expenseManager) {
      const managerFilter = {
        memcmp: { offset: 41, bytes: expenseManager.publicKey.toBase58() },
      };
      setAccessRecords(await program.account.accessRecord.all([managerFilter]));
    }
  }

  useEffect(() => {
    fetchAccessRecords();
  }, [program?.programId, expenseManager?.publicKey.toString()]);

  useEffect(() => {
    fetchExpenseManager();
  }, [program?.programId, query?.pubkey]);

  return (
    <div className="text-center pt-2">
      <div className="hero min-h-16 p-0 pt-10">
        <div className="text-center hero-content">
          <div className="w-full">
            {expenseManager ? (
              <h1 className="mb-5 text-5xl">
                Access Controls for{" "}
                <span className="font-bold">{expenseManager.account.name}</span>
              </h1>
            ) : (
              <h1 className="mb-5 text-5xl">Access Controls</h1>
            )}
            <p className="text-2xl mb-5">
              Officers are granted permission to approve and deny expenses using
              Proposals submitted to your DAO.
            </p>

            {connected && !isLoading && query?.pubkey && (
              <>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setModalOpen(true);
                  }}
                >
                  Request Access
                </button>
                {expenseManager && (
                  <ProposalContent
                    expenseManager={expenseManager}
                    modalOpen={modalOpen}
                    setModalOpen={setModalOpen}
                    refetchAccessRecords={fetchAccessRecords}
                  />
                )}
                {!!accessRecords.length && (
                  <AccessRecordList accessRecords={accessRecords} />
                )}
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
  );
};

const ProposalContent = ({
  expenseManager,
  modalOpen,
  setModalOpen,
  refetchAccessRecords,
}: {
  expenseManager: ExpenseManagerItem;
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  refetchAccessRecords: () => void;
}) => {
  const { connection } = useConnection();
  const { program } = useSlideProgram();
  const { proposals, isLoading, mutateProposals } = useProposals(
    program,
    connection,
    expenseManager
  );
  const pendingAccessProposals = proposals.filter(
    (proposal) => isAccessRequest(proposal) && !proposal.executed
  );

  return (
    <>
      {isLoading && (
        <div className="my-10">
          <Loader />
        </div>
      )}
      {!isLoading && !!pendingAccessProposals.length && (
        <div className="flex flex-col gap-4 justify-start text-left my-10">
          <h3 className="text-2xl">Pending Proposals</h3>
          <div className="flex flex-col gap-4 my-4">
            {pendingAccessProposals.map((proposal) => (
              <PendingAccessProposal
                key={proposal.pubkey.toString()}
                proposal={proposal}
                expenseManager={expenseManager}
                refetchAccessRecords={() => {
                  refetchAccessRecords();
                  mutateProposals();
                }}
              />
            ))}
          </div>
        </div>
      )}
      <CreateAccessProposalModal
        open={modalOpen}
        close={(success) => {
          setModalOpen(false);
          if (success) {
            mutateProposals();
          }
        }}
        expenseManager={expenseManager}
      />
    </>
  );
};

type AccessRecordListProps = {
  accessRecords: AccessRecordItem[];
};

const AccessRecordList = ({ accessRecords }: AccessRecordListProps) => {
  return (
    <div className="flex flex-col gap-4 justify-start text-left my-10">
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
