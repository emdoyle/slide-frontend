import { FC, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { Loader, Nav } from "components";
import { ExpensePackageCard } from "./ExpensePackageCard";
import styles from "./index.module.css";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useSlideProgram } from "utils/useSlide";
import { PromptConnectWallet } from "components/PromptConnectWallet";
import {
  AccessRecordItem,
  ExpenseManager,
  ExpenseManagerItem,
  ExpensePackageItem,
} from "types";
import { useRouter } from "next/router";
import BN from "bn.js";
import { constants, address, Slide } from "@slidexyz/slide-sdk";
import { getTokenOwnerRecordAddress } from "@solana/spl-governance";
import { Program } from "@project-serum/anchor";
import {
  getMemberEquityAddressAndBump,
  SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
} from "@slidexyz/squads-sdk";

const createSPLExpensePackage = async (
  program: Program<Slide>,
  user: PublicKey,
  expenseManager: ExpenseManagerItem,
  name: string,
  description: string,
  quantity: string
) => {
  const managerData = expenseManager.account;
  if (!managerData.realm || !managerData.governanceAuthority) {
    alert("Manager not set up for SPL");
    return;
  }
  const [expensePackage] = address.getExpensePackageAddressAndBump(
    expenseManager.publicKey,
    user,
    managerData.expensePackageNonce,
    program.programId
  );
  const tokenOwnerRecord = await getTokenOwnerRecordAddress(
    constants.SPL_GOV_PROGRAM_ID,
    managerData.realm,
    managerData.membershipTokenMint,
    user
  );
  await program.methods
    .splGovCreateExpensePackage(
      managerData.realm,
      managerData.expensePackageNonce,
      name,
      description,
      new BN(Number(quantity) * LAMPORTS_PER_SOL)
    )
    .accounts({
      expensePackage,
      expenseManager: expenseManager.publicKey,
      tokenOwnerRecord,
      owner: user,
    })
    .rpc();
};

const createSquadsExpensePackage = async (
  program: Program<Slide>,
  user: PublicKey,
  expenseManager: ExpenseManagerItem,
  name: string,
  description: string,
  quantity: string
) => {
  const managerData = expenseManager.account;
  if (!managerData.squad) {
    alert("Manager not set up for Squads");
    return;
  }
  const [expensePackage] = address.getExpensePackageAddressAndBump(
    expenseManager.publicKey,
    user,
    managerData.expensePackageNonce,
    program.programId
  );
  const [memberEquity] = await getMemberEquityAddressAndBump(
    SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
    user,
    managerData.squad
  );
  await program.methods
    .squadsCreateExpensePackage(
      managerData.expensePackageNonce,
      name,
      description,
      new BN(Number(quantity) * LAMPORTS_PER_SOL)
    )
    .accounts({
      expensePackage,
      expenseManager: expenseManager.publicKey,
      memberEquity,
      squad: managerData.squad,
      owner: user,
    })
    .rpc();
};

const CreateExpensePackageModal = ({
  open,
  close,
  expenseManager,
}: {
  open: boolean;
  close(): void;
  expenseManager: ExpenseManagerItem;
}) => {
  const router = useRouter();
  const { publicKey: userPublicKey } = useWallet();
  const { program } = useSlideProgram();
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const submitForm = async () => {
    if (!userPublicKey || !program) {
      alert("Please connect your wallet");
      return;
    }
    if (!name || !quantity) {
      alert("Name and quantity are required fields");
      return;
    }
    const expenseManagerAccount = expenseManager.account;
    if (
      expenseManagerAccount.realm &&
      expenseManagerAccount.governanceAuthority
    ) {
      await createSPLExpensePackage(
        program,
        userPublicKey,
        expenseManager,
        name,
        description,
        quantity
      );
    } else {
      await createSquadsExpensePackage(
        program,
        userPublicKey,
        expenseManager,
        name,
        description,
        quantity
      );
    }
  };

  return (
    <div className={`modal ${open && "modal-open"}`}>
      <div className="modal-box">
        <h3 className="font-bold text-lg">Add a new expense</h3>
        <div className="flex flex-col gap-2 justify-center">
          <input
            type="text"
            placeholder="For"
            className="input input-bordered w-full bg-white text-black"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <input
            type="text"
            placeholder="Description (optional)"
            className="input input-bordered w-full bg-white text-black"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <input
            type="number"
            placeholder="Amount (in SOL)"
            className="input input-bordered w-full bg-white text-black"
            max={1_000_000 * LAMPORTS_PER_SOL}
            min={0}
            step={1 / LAMPORTS_PER_SOL}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </div>
        <div className="flex gap-2 mt-4 justify-center">
          <button
            className="btn btn-primary"
            onClick={() =>
              submitForm()
                .then(() => router.reload())
                .catch(alert)
            }
          >
            Create
          </button>
          <button className="btn" onClick={close}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const ExpensePackageView: FC = ({}) => {
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

  useEffect(() => {
    async function getData() {
      if (program && userPublicKey && !isLoading && query?.pubkey) {
        const expenseManagerPubkey = new PublicKey(query.pubkey);
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
        try {
          const accessRecordAccount = await program.account.accessRecord.fetch(
            accessRecordPubkey
          );
          setAccessRecord({
            account: accessRecordAccount,
            publicKey: accessRecordPubkey,
          });
        } catch {}
      }
    }
    setIsLoading(true);
    getData().finally(() => setIsLoading(false));
  }, [program?.programId, query?.pubkey]);

  const headerText = expenseManager
    ? `Expenses for ${expenseManager.account.name}`
    : "Expenses";

  return (
    <div className="container mx-auto max-w-6xl p-8 2xl:px-0">
      <div className={styles.container}>
        <Nav />
        <div className="text-center pt-2">
          <div className="hero min-h-16 p-0 pt-10">
            <div className="text-center hero-content w-full">
              <div className="w-full">
                <div className="text-center">
                  <h1 className="mb-5 text-5xl">{headerText}</h1>
                </div>
                {!isLoading && connected && expenseManager && (
                  <>
                    <button
                      className="btn btn-primary"
                      onClick={() => setOpen(true)}
                    >
                      Create Expense
                    </button>
                    <ExpensePackageContent
                      accessRecord={accessRecord}
                      expenseManager={expenseManager}
                    />
                    <CreateExpensePackageModal
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
  const [expensePackages, setExpensePackages] = useState<any>([]);

  useEffect(() => {
    async function getExpensePackages() {
      if (program !== undefined && !isLoading) {
        const managerFilter = {
          memcmp: { offset: 41, bytes: expenseManager.publicKey.toBase58() },
        };
        setExpensePackages(
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
        />
      )}
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
  return (
    <div className="flex flex-col gap-4">
      {expensePackages.map((expensePackage) => (
        <ExpensePackageCard
          key={expensePackage.publicKey.toString()}
          expenseManager={expenseManager}
          expensePackage={expensePackage}
          canApproveAndDeny={canApproveAndDeny}
        />
      ))}
    </div>
  );
};
