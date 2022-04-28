import { FC, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { Loader } from "components";
import { ExpensePackageCard } from "./ExpensePackageCard";
import { PublicKey } from "@solana/web3.js";
import { useSlideProgram } from "utils/useSlide";
import { PromptConnectWallet } from "components/PromptConnectWallet";
import {
  AccessRecordItem,
  ExpenseManagerItem,
  ExpensePackageItem,
} from "types";
import { useRouter } from "next/router";
import { ExpensePackageModal } from "./ExpensePackageModal";
import {
  fetchAccessRecord,
  fetchExpenseManager,
  fetchExpensePackages,
  useFnSWRImmutableWithProgram,
} from "../../utils/api";
import { useErrorAlert } from "../../utils/useErrorAlert";

export const ExpensePackageView: FC = ({}) => {
  const { connected, publicKey: userPublicKey } = useWallet();
  const { program } = useSlideProgram();
  const { query } = useRouter();
  const [open, setOpen] = useState(false);
  const [expenseManagerPubkey, setExpenseManagerPubkey] =
    useState<PublicKey | null>(null);

  if (!expenseManagerPubkey && query?.pubkey) {
    try {
      setExpenseManagerPubkey(new PublicKey(query.pubkey));
    } catch {
      // TODO: set an error message that shows up as a banner or blocking modal
    }
  }

  const { data: expenseManager, error: expenseManagerError } =
    useFnSWRImmutableWithProgram<ExpenseManagerItem>(
      program,
      () => expenseManagerPubkey ?? null,
      fetchExpenseManager
    );
  useErrorAlert(expenseManagerError);
  const isLoading = connected && !expenseManager && !expenseManagerError;

  // no error alert necessary for access record
  const { data: accessRecord, isValidating: accessRecordValidating } =
    useFnSWRImmutableWithProgram<AccessRecordItem>(
      program,
      () =>
        expenseManagerPubkey && userPublicKey
          ? [expenseManagerPubkey, userPublicKey]
          : null,
      fetchAccessRecord,
      { shouldRetryOnError: false }
    );

  const { data: expensePackages, error: expensePackagesError } =
    useFnSWRImmutableWithProgram<ExpensePackageItem[]>(
      program,
      () => expenseManagerPubkey ?? null,
      fetchExpensePackages
    );
  useErrorAlert(expensePackagesError);

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
            {!isLoading && expenseManager && (
              <>
                <button
                  className="btn btn-primary"
                  onClick={() => setOpen(true)}
                >
                  + Create Expense
                </button>
                <ExpensePackageList
                  canApproveAndDeny={!!accessRecord}
                  expenseManager={expenseManager}
                  expensePackages={expensePackages ?? []}
                />
                <ExpensePackageModal
                  open={open}
                  close={() => setOpen(false)}
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

type ExpensePackageListProps = {
  expenseManager: ExpenseManagerItem;
  expensePackages: ExpensePackageItem[];
  canApproveAndDeny?: boolean;
};

const ExpensePackageList = ({
  expenseManager,
  expensePackages,
  canApproveAndDeny,
}: ExpensePackageListProps) => {
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [packageToUpdate, setPackageToUpdate] = useState<
    ExpensePackageItem | undefined
  >();
  return (
    <>
      <div className="flex flex-col gap-4 my-4">
        {expensePackages.map((expensePackage) => (
          <ExpensePackageCard
            key={expensePackage.publicKey.toString()}
            expenseManager={expenseManager}
            expensePackage={expensePackage}
            canApproveAndDeny={canApproveAndDeny}
            openUpdateModal={() => {
              setPackageToUpdate(expensePackage);
              setModalOpen(true);
            }}
          />
        ))}
      </div>
      <ExpensePackageModal
        open={modalOpen}
        close={() => setModalOpen(false)}
        expenseManager={expenseManager}
        packageToUpdate={packageToUpdate}
      />
    </>
  );
};
