import { FC, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { Loader } from "components";
import { ExpensePackageCard } from "./ExpensePackageCard";
import { PublicKey } from "@solana/web3.js";
import { useSlideProgram } from "utils/useSlide";
import { PromptConnectWallet } from "components/PromptConnectWallet";
import {
  AccessRecordItem,
  ExpenseManager,
  ExpenseManagerItem,
  ExpensePackage,
  ExpensePackageItem,
} from "types";
import { useRouter } from "next/router";
import { address } from "@slidexyz/slide-sdk";
import { useAlert } from "react-alert";
import { ExpensePackageModal } from "./ExpensePackageModal";

export const ExpensePackageView: FC = ({}) => {
  const Alert = useAlert();
  const { connected, publicKey: userPublicKey } = useWallet();
  const { program } = useSlideProgram();
  const { query } = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [expenseManager, setExpenseManager] =
    useState<ExpenseManagerItem | null>(null);
  const [accessRecord, setAccessRecord] = useState<AccessRecordItem | null>(
    null
  );

  async function fetchData() {
    if (program && userPublicKey && query?.pubkey) {
      let expenseManagerPubkey;
      try {
        expenseManagerPubkey = new PublicKey(query.pubkey);
      } catch {
        Alert.show(
          `Could not find expense manager for this page (pubkey: ${query.pubkey})`
        );
        return;
      }
      setIsLoading(true);
      try {
        const expenseManagerAccount: ExpenseManager =
          await program.account.expenseManager.fetch(expenseManagerPubkey);
        setExpenseManager({
          account: expenseManagerAccount,
          publicKey: expenseManagerPubkey,
        });
        const [accessRecordPubkey] = address.getAccessRecordAddressAndBump(
          program.programId,
          expenseManagerPubkey,
          userPublicKey
        );
        const accessRecordAccount = await program.account.accessRecord.fetch(
          accessRecordPubkey
        );
        setAccessRecord({
          account: accessRecordAccount,
          publicKey: accessRecordPubkey,
        });
      } catch {
        // expected behavior for accessRecord to fail if it doesn't exist
        // TODO: differentiate manager from access record failure
      } finally {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    fetchData();
  }, [program?.programId, query?.pubkey]);

  return (
    <div className="text-center pt-2">
      <div className="hero min-h-16 p-0 pt-10">
        <div className="text-center hero-content w-full">
          <div className="w-full">
            {expenseManager ? (
              <h1 className="mb-5 text-5xl">
                Expenses for{" "}
                <span className="font-bold">{expenseManager.account.name}</span>
              </h1>
            ) : (
              <h1 className="mb-5 text-5xl">Expenses</h1>
            )}
            <p className="mb-5 text-2xl">
              Create and submit expenses for reimbursement.
              <br />
              If you&apos;re an officer, you can review expenses and either
              Approve or Deny them.
            </p>
            {!isLoading && connected && expenseManager && (
              <>
                <button
                  className="btn btn-primary"
                  onClick={() => setOpen(true)}
                >
                  + Create Expense
                </button>
                <ExpensePackageContent
                  accessRecord={accessRecord}
                  expenseManager={expenseManager}
                />
                <ExpensePackageModal
                  open={open}
                  close={(success) => {
                    setOpen(false);
                    if (success) {
                      fetchData();
                    }
                  }}
                  expenseManager={expenseManager}
                />
              </>
            )}
            {!isLoading && !connected && <PromptConnectWallet />}
            {isLoading && (
              <div>
                <Loader />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ExpensePackageContent = ({
  accessRecord,
  expenseManager,
}: {
  accessRecord: AccessRecordItem | null;
  expenseManager: ExpenseManagerItem;
}) => {
  const { connected } = useWallet();
  const { program } = useSlideProgram();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [expensePackages, setExpensePackages] = useState<ExpensePackageItem[]>(
    []
  );

  async function refetchExpensePackage(expensePackagePubkey: PublicKey) {
    if (program) {
      // @ts-ignore
      const expensePackage: ExpensePackage =
        await program.account.expensePackage.fetch(expensePackagePubkey);
      setExpensePackages((prevPackages) => {
        return prevPackages.map((currPackage) => {
          if (currPackage.publicKey.equals(expensePackagePubkey)) {
            return {
              account: expensePackage,
              publicKey: currPackage.publicKey,
            };
          }
          return currPackage;
        });
      });
    }
  }

  useEffect(() => {
    async function getExpensePackages() {
      if (program) {
        const managerFilter = {
          memcmp: { offset: 41, bytes: expenseManager.publicKey.toBase58() },
        };
        setExpensePackages(
          // @ts-ignore
          await program.account.expensePackage.all([managerFilter])
        );
      }
    }
    setIsLoading(true);
    getExpensePackages().finally(() => setIsLoading(false));
  }, [program?.programId]);

  if (!connected) {
    return <PromptConnectWallet />;
  }

  return (
    <div className="my-10">
      {isLoading ? (
        <div>
          <Loader />
        </div>
      ) : (
        <ExpensePackageList
          expenseManager={expenseManager}
          expensePackages={expensePackages}
          canApproveAndDeny={!!accessRecord}
          refetchExpensePackage={refetchExpensePackage}
        />
      )}
    </div>
  );
};

type ExpensePackageListProps = {
  expenseManager: ExpenseManagerItem;
  expensePackages: ExpensePackageItem[];
  canApproveAndDeny?: boolean;
  refetchExpensePackage?: (expenseManagerPubkey: PublicKey) => void;
};

const ExpensePackageList = ({
  expenseManager,
  expensePackages,
  canApproveAndDeny,
  refetchExpensePackage,
}: ExpensePackageListProps) => {
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [packageToUpdate, setPackageToUpdate] = useState<
    ExpensePackageItem | undefined
  >();
  return (
    <>
      <div className="flex flex-col gap-4">
        {expensePackages.map((expensePackage) => (
          <ExpensePackageCard
            key={expensePackage.publicKey.toString()}
            expenseManager={expenseManager}
            expensePackage={expensePackage}
            canApproveAndDeny={canApproveAndDeny}
            refetchExpensePackage={() => {
              if (refetchExpensePackage) {
                refetchExpensePackage(expensePackage.publicKey);
              }
            }}
            openUpdateModal={() => {
              setPackageToUpdate(expensePackage);
              setModalOpen(true);
            }}
          />
        ))}
      </div>
      <ExpensePackageModal
        open={modalOpen}
        close={(success) => {
          setModalOpen(false);
          if (success && packageToUpdate && refetchExpensePackage) {
            refetchExpensePackage(packageToUpdate.publicKey);
          }
        }}
        expenseManager={expenseManager}
        packageToUpdate={packageToUpdate}
      />
    </>
  );
};
