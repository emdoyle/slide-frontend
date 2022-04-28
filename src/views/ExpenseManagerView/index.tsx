import { FC, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

import { Loader, Nav } from "components";
import { ExpenseManagerCard } from "./ExpenseManagerCard";
import styles from "./index.module.css";
import { useSlideProgram } from "utils/useSlide";
import { PromptConnectWallet } from "components/PromptConnectWallet";
import { ExpenseManagerItem, RealmItem, TreasuryWithGovernance } from "types";
import {
  getMemberEquityAddressAndBump,
  getSquadMintAddressAndBump,
  SquadItem,
  SQUADS_PROGRAM_ID,
} from "@slidexyz/squads-sdk";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { getTokenOwnerRecordAddress } from "@solana/spl-governance";
import { SLIDE_PROGRAM_ID, SPL_GOV_SHARED_PROGRAM_ID } from "../../constants";
import { useAlert } from "react-alert";
import { SquadsCombobox } from "./SquadsCombobox";
import { RealmsCombobox } from "./RealmsCombobox";
import { TreasuryCombobox } from "./TreasuryCombobox";
import { SearchIcon } from "@heroicons/react/solid";
import {
  useFnSWRImmutableWithProgram,
  useFnSWRImmutableWithConnection,
  fetchExpenseManagers,
  fetchSquads,
  fetchRealms,
  fetchTreasuries,
} from "../../utils/api";
import { useErrorAlert } from "../../utils/useErrorAlert";
import {
  flushInstructions,
  getExpenseManagerAddressAndBump,
} from "@slidexyz/slide-sdk";

export const ExpenseManagerView: FC<{
  realmsProgramIds: PublicKey[];
}> = ({ realmsProgramIds }) => {
  const { connected } = useWallet();
  const { program } = useSlideProgram();
  const [open, setOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
  const {
    data: expenseManagers,
    error,
    mutate,
  } = useFnSWRImmutableWithProgram<ExpenseManagerItem[]>(
    program,
    [],
    fetchExpenseManagers
  );
  useErrorAlert(error);
  const isLoading = !expenseManagers && !error;
  return (
    <div className="container mx-auto max-w-6xl p-8 2xl:px-0">
      <div className={styles.container}>
        <Nav />

        <div className="text-center pt-2">
          <div className="hero min-h-16 p-0 pt-10">
            <div className="text-center hero-content w-full">
              <div className="w-full">
                <h1 className="mb-5 text-5xl">Expense Managers</h1>
                <p className="mb-5 text-2xl">
                  Manage expenses for your DAO with Slide!
                </p>

                {connected && (
                  <button
                    className="btn btn-primary"
                    onClick={() => setOpen(true)}
                  >
                    + Add Manager
                  </button>
                )}

                {connected && isLoading && (
                  <div>
                    <Loader />
                  </div>
                )}
                {connected && expenseManagers && (
                  <div className="flex flex-col">
                    <div className="w-full flex justify-end">
                      <SearchIcon className="h-6 w-6 relative left-8 top-3" />
                      <input
                        type="text"
                        placeholder="Search managers by name..."
                        className="input input-bordered w-1/3 pl-10"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                      />
                    </div>
                    <ExpenseManagerList
                      expenseManagers={expenseManagers?.filter(
                        (expenseManager) =>
                          !query ||
                          expenseManager.account.name
                            .toLowerCase()
                            .includes(query.toLowerCase())
                      )}
                    />
                  </div>
                )}

                {!connected && <PromptConnectWallet />}

                {connected && (
                  <CreateExpenseManagerModal
                    open={open}
                    close={(success) => {
                      setOpen(false);
                      if (success) {
                        mutate();
                      }
                    }}
                    realmsProgramIds={realmsProgramIds}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

type ExpenseManagerListProps = {
  expenseManagers: ExpenseManagerItem[];
  error?: Error;
};

const ExpenseManagerList = ({ expenseManagers }: ExpenseManagerListProps) => {
  return (
    <div className="flex flex-col gap-4 py-5">
      {expenseManagers.map((expenseManager) => (
        <ExpenseManagerCard
          key={expenseManager.publicKey.toString()}
          expenseManager={expenseManager}
        />
      ))}
    </div>
  );
};

const CreateExpenseManagerModal = ({
  open,
  close,
  realmsProgramIds = [SPL_GOV_SHARED_PROGRAM_ID],
}: {
  open: boolean;
  close: (success?: boolean) => void;
  realmsProgramIds?: PublicKey[]; // sorta ugly to have this as a prop
}) => {
  const Alert = useAlert();
  const { publicKey: userPublicKey } = useWallet();
  const { connection } = useConnection();
  const { program } = useSlideProgram();
  const [name, setName] = useState<string>("");
  const [usingSPL, setUsingSPL] = useState<boolean>(true);
  const [realm, setRealm] = useState<RealmItem | null>(null);
  const [treasury, setTreasury] = useState<TreasuryWithGovernance | null>(null);
  const [squad, setSquad] = useState<SquadItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { data: squads, error: squadsError } = useFnSWRImmutableWithConnection<
    SquadItem[]
  >(
    connection,
    () => (open && !usingSPL ? [SQUADS_PROGRAM_ID] : null),
    fetchSquads
  );
  useErrorAlert(squadsError);
  const { data: realms, error: realmsError } = useFnSWRImmutableWithConnection<
    RealmItem[]
  >(
    connection,
    () => (open && usingSPL ? [realmsProgramIds] : null),
    fetchRealms
  );
  useErrorAlert(realmsError);
  const { data: treasuries, error: treasuriesError } =
    useFnSWRImmutableWithConnection<TreasuryWithGovernance[]>(
      connection,
      () => (open && usingSPL && realm ? [realm.owner, realm.pubkey] : null),
      fetchTreasuries
    );
  useErrorAlert(treasuriesError);

  const submitForm = async () => {
    if (!program || !userPublicKey) {
      Alert.show("Please connect your wallet to submit this form.");
      return;
    }

    let govTokenMint;
    if (usingSPL) {
      if (!realm || !treasury) {
        Alert.show(
          "Could not parse Public Keys from selected Realm and Treasury."
        );
        return;
      }
      govTokenMint = realm.account.communityMint;
    } else {
      if (!squad) {
        Alert.show("Could not parse Public Keys from selected Squad.");
        return;
      }
      [govTokenMint] = await getSquadMintAddressAndBump(
        SQUADS_PROGRAM_ID,
        squad.pubkey
      );
    }
    const [expenseManager] = getExpenseManagerAddressAndBump(
      name,
      SLIDE_PROGRAM_ID
    );

    const createManager: TransactionInstruction = await program.methods
      .createExpenseManager(name, govTokenMint)
      .accounts({
        expenseManager,
        payer: userPublicKey,
      })
      .instruction();
    let initializeManager: TransactionInstruction;
    if (usingSPL && realm && treasury) {
      const tokenOwnerRecord = await getTokenOwnerRecordAddress(
        realm.owner,
        realm.pubkey,
        govTokenMint,
        userPublicKey
      );
      initializeManager = await program.methods
        .splGovInitializeExpenseManager(realm.pubkey, realm.owner)
        .accounts({
          expenseManager,
          governanceAuthority: treasury.governance.pubkey,
          tokenOwnerRecord,
          member: userPublicKey,
        })
        .instruction();
    } else if (!usingSPL && squad) {
      const [memberEquityRecord] = await getMemberEquityAddressAndBump(
        SQUADS_PROGRAM_ID,
        userPublicKey,
        squad.pubkey
      );
      initializeManager = await program.methods
        .squadsInitializeExpenseManager(SQUADS_PROGRAM_ID)
        .accounts({
          expenseManager,
          memberEquity: memberEquityRecord,
          squad: squad.pubkey,
          member: userPublicKey,
        })
        .instruction();
    } else {
      Alert.show("An error occurred while preparing the Transaction.");
      return;
    }

    await flushInstructions(
      // @ts-ignore
      program,
      [createManager, initializeManager],
      []
    );
  };

  return (
    <div className={`modal ${open && "modal-open"}`}>
      <div className="modal-box">
        <h3 className="font-bold text-lg">Create an expense manager</h3>
        <div className="flex flex-col gap-2 justify-center">
          <input
            disabled={isSubmitting}
            type="text"
            placeholder="Name"
            className="input input-bordered w-full bg-white text-black"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <div className="flex justify-center items-center">
            <input
              disabled={isSubmitting}
              type="radio"
              className="radio"
              name="daoProvider"
              id="radioSPL"
              checked={usingSPL}
              onChange={(event) => setUsingSPL(event.target.checked)}
            />
            <label
              className="label cursor-pointer pl-2 pr-8"
              htmlFor="radioSPL"
            >
              Realms
            </label>
            <input
              disabled={isSubmitting}
              type="radio"
              className="radio"
              name="daoProvider"
              id="radioSquads"
              checked={!usingSPL}
              onChange={(event) => setUsingSPL(!event.target.checked)}
            />
            <label className="label cursor-pointer pl-2" htmlFor="radioSquads">
              Squads
            </label>
          </div>
          {usingSPL && (
            <>
              <RealmsCombobox
                disabled={isSubmitting}
                realms={realms ?? []}
                selectedRealm={realm}
                setSelectedRealm={setRealm}
              />
              <TreasuryCombobox
                treasuries={treasuries ?? []}
                selectedTreasury={treasury}
                setSelectedTreasury={setTreasury}
                disabled={isSubmitting || !realm}
              />
            </>
          )}
          {!usingSPL && (
            <SquadsCombobox
              disabled={isSubmitting}
              squads={squads ?? []}
              selectedSquad={squad}
              setSelectedSquad={setSquad}
            />
          )}
        </div>
        <div className="flex gap-2 mt-4 justify-center">
          <button
            disabled={isSubmitting}
            className="btn btn-primary"
            onClick={() => {
              setIsSubmitting(true);
              submitForm()
                .then(() => {
                  Alert.show("Success");
                  close(true);
                })
                .catch((error: Error) => Alert.error(error.message))
                .finally(() => setIsSubmitting(false));
            }}
          >
            Create
          </button>
          <button
            className="btn"
            onClick={() => {
              setIsSubmitting(false);
              close();
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
