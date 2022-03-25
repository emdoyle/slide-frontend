import { FC, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

import { Loader, Nav } from "components";
import { ExpenseManagerCard } from "./ExpenseManagerCard";
import styles from "./index.module.css";
import { useSlideProgram } from "utils/useSlide";
import { PromptConnectWallet } from "components/PromptConnectWallet";
import { ExpenseManagerItem } from "types";
import {
  getMemberEquityAddressAndBump,
  getSquadMintAddressAndBump,
  getSquads,
  SquadItem,
  SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
} from "@slidexyz/squads-sdk";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import {
  getRealm,
  getTokenOwnerRecordAddress,
  Realm,
} from "@solana/spl-governance";
import { address, constants, utils } from "@slidexyz/slide-sdk";
import { SLIDE_PROGRAM_ID } from "../../constants";
import { useAlert } from "react-alert";
import { SquadsCombobox } from "./SquadsCombobox";

export const ExpenseManagerView: FC = ({}) => {
  const { connected } = useWallet();
  const [expenseManagers, setExpenseManagers] = useState<ExpenseManagerItem[]>(
    []
  );
  const { program } = useSlideProgram();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [open, setOpen] = useState(false);

  async function fetchExpenseManagers() {
    if (program) {
      setIsLoading(true);
      try {
        // TODO: filter these by membership.. maybe async?
        //   would be annoyingly slow to issue membership checks for each manager
        //   although for a demo it's not that bad (like 2 managers)
        setExpenseManagers(await program.account.expenseManager.all());
      } finally {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    fetchExpenseManagers();
  }, [program?.programId]);

  return (
    <div className="container mx-auto max-w-6xl p-8 2xl:px-0">
      <div className={styles.container}>
        <Nav />

        <div className="text-center pt-2">
          <div className="hero min-h-16 p-0 pt-10">
            <div className="text-center hero-content w-full">
              <div className="w-full">
                <h1 className="mb-5 text-5xl">Your DAOs</h1>

                <div className="w-full min-w-full">
                  <p className="mb-5">Manage expenses for your DAOs</p>
                </div>

                {connected && (
                  <button
                    className="btn btn-primary"
                    onClick={() => setOpen(true)}
                  >
                    + Add Manager
                  </button>
                )}

                {connected && isLoading ? (
                  <div>
                    <Loader />
                  </div>
                ) : (
                  <ExpenseManagerList expenseManagers={expenseManagers} />
                )}

                {!connected && <PromptConnectWallet />}

                <CreateExpenseManagerModal
                  open={open}
                  close={(success) => {
                    setOpen(false);
                    if (success) {
                      fetchExpenseManagers();
                    }
                  }}
                />
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
}: {
  open: boolean;
  close: (success?: boolean) => void;
}) => {
  const Alert = useAlert();
  const { publicKey: userPublicKey } = useWallet();
  const { connection } = useConnection();
  const { program } = useSlideProgram();
  const [name, setName] = useState<string>("");
  const [usingSPL, setUsingSPL] = useState<boolean>(true);
  const [realm, setRealm] = useState<string>("");
  const [govAuthority, setGovAuthority] = useState<string>("");
  const [squad, setSquad] = useState<SquadItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [allSquads, setAllSquads] = useState<SquadItem[]>([]);
  const [squadsLoading, setSquadsLoading] = useState<boolean>(false);
  const [allRealms, setAllRealms] = useState<Realm[]>([]);
  const [realmsLoading, setRealmsLoading] = useState<boolean>(false);

  const fetchSquads = async () => {
    setSquadsLoading(true);
    try {
      setAllSquads(
        await getSquads(SQUADS_CUSTOM_DEVNET_PROGRAM_ID, connection)
      );
    } catch (err) {
      if (err instanceof Error) {
        Alert.error(err.message);
      } else {
        Alert.error("An unknown error occurred when fetching Squads.");
      }
    } finally {
      setSquadsLoading(false);
    }
  };

  useEffect(() => {
    if (!usingSPL) {
      fetchSquads();
    } else {
      setSquad(null);
    }
  }, [usingSPL]);

  const submitForm = async () => {
    if (!program) {
      Alert.show("Please connect your wallet to submit this form.");
      return;
    }
    let realmPubkey;
    let govAuthPubkey;
    try {
      if (usingSPL) {
        realmPubkey = new PublicKey(realm);
        govAuthPubkey = new PublicKey(govAuthority);
      } else {
      }
    } catch (e) {
      Alert.show("Could not parse Public Keys, please check they are correct.");
      return;
    }

    let govTokenMint;
    if (usingSPL) {
      // get the mint from the realm (communityMint)
      if (!realmPubkey || !govAuthPubkey) {
        Alert.show(
          "Could not parse Public Keys, please check they are correct."
        );
        return;
      }
      govTokenMint = (await getRealm(connection, realmPubkey)).account
        .communityMint;
    } else {
      if (!squad?.pubkey) {
        Alert.show(
          "Could not parse Public Keys, please check they are correct."
        );
        return;
      }
      [govTokenMint] = await getSquadMintAddressAndBump(
        SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
        squad.pubkey
      );
    }
    const [expenseManager] = address.getExpenseManagerAddressAndBump(
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
    if (usingSPL) {
      const tokenOwnerRecord = await getTokenOwnerRecordAddress(
        constants.SPL_GOV_PROGRAM_ID,
        // @ts-ignore
        realmPubkey,
        govTokenMint,
        userPublicKey
      );
      initializeManager = await program.methods
        // @ts-ignore
        .splGovInitializeExpenseManager(realmPubkey, govAuthPubkey)
        .accounts({
          expenseManager,
          governanceAuthority: govAuthPubkey,
          tokenOwnerRecord,
          member: userPublicKey,
        })
        .instruction();
    } else {
      const [memberEquityRecord] = await getMemberEquityAddressAndBump(
        SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
        // @ts-ignore
        userPublicKey,
        squad?.pubkey
      );
      initializeManager = await program.methods
        .squadsInitializeExpenseManager()
        .accounts({
          expenseManager,
          memberEquity: memberEquityRecord,
          squad: squad?.pubkey,
          member: userPublicKey,
        })
        .instruction();
    }

    await utils.flushInstructions(
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
          <div className="flex justify-center items-center px-4">
            <input
              disabled={isSubmitting}
              type="radio"
              className=""
              name="daoProvider"
              id="radioSPL"
              checked={usingSPL}
              onChange={(event) => setUsingSPL(event.target.checked)}
            />
            <label htmlFor="radioSPL">SPL Governance</label>
            <input
              disabled={isSubmitting}
              type="radio"
              className=""
              name="daoProvider"
              id="radioSquads"
              checked={!usingSPL}
              onChange={(event) => setUsingSPL(!event.target.checked)}
            />
            <label htmlFor="radioSquads">Squads</label>
          </div>
          {usingSPL && (
            <>
              <input
                disabled={isSubmitting}
                type="text"
                placeholder="Realm Pubkey"
                className="input input-bordered w-full bg-white text-black"
                value={realm}
                onChange={(event) => setRealm(event.target.value)}
              />
              <input
                disabled={isSubmitting}
                type="text"
                placeholder="Governance Pubkey"
                className="input input-bordered w-full bg-white text-black"
                value={govAuthority}
                onChange={(event) => setGovAuthority(event.target.value)}
              />
            </>
          )}
          {!usingSPL && (
            <SquadsCombobox
              disabled={isSubmitting}
              squads={allSquads}
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
