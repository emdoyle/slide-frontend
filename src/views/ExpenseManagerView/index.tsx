import { FC, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

import { Loader, Nav } from "components";
import { ExpenseManagerCard } from "./ExpenseManagerCard";
import styles from "./index.module.css";
import { useSlideProgram } from "utils/useSlide";
import { PromptConnectWallet } from "components/PromptConnectWallet";
import { ExpenseManagerItem } from "types";
import { getSquadMintAddressAndBump } from "@slidexyz/squads-sdk";
import { PublicKey } from "@solana/web3.js";
import { getRealm } from "@solana/spl-governance";
import { getExpenseManagerAddressAndBump } from "@slidexyz/slide-sdk/address";
import { SLIDE_PROGRAM_ID } from "../../constants";

export const ExpenseManagerView: FC = ({}) => {
  const { connected } = useWallet();
  const [open, setOpen] = useState(false);
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

                <ExpenseManagerContent />
                <CreateExpenseManagerModal
                  open={open}
                  close={() => setOpen(false)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExpenseManagerContent = () => {
  const { connected } = useWallet();
  const { program } = useSlideProgram();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [expenseManagers, setExpenseManagers] = useState<any>([]);

  useEffect(() => {
    async function getExpenseManagers() {
      if (program !== undefined && !isLoading) {
        setExpenseManagers(await program.account.expenseManager.all());
      }
    }
    setIsLoading(true);
    getExpenseManagers().finally(() => setIsLoading(false));
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
        <ExpenseManagerList expenseManagers={expenseManagers} />
      )}
    </div>
  );
};

type ExpenseManagerListProps = {
  expenseManagers: ExpenseManagerItem[];
  error?: Error;
};

const ExpenseManagerList = ({ expenseManagers }: ExpenseManagerListProps) => {
  return (
    <div className="flex flex-col gap-4">
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
  close(): void;
}) => {
  const { publicKey: userPublicKey } = useWallet();
  const { connection } = useConnection();
  const { program } = useSlideProgram();
  const [name, setName] = useState<string>("");
  const [usingSPL, setUsingSPL] = useState<boolean>(true);
  const [realm, setRealm] = useState<string>("");
  const [govAuthority, setGovAuthority] = useState<string>("");
  const [squad, setSquad] = useState<string>("");

  const submitForm = async () => {
    if (!program) {
      alert("Please connect your wallet to submit this form.");
      return;
    }
    let realmPubkey;
    let govAuthPubkey;
    let squadPubkey;
    try {
      if (usingSPL) {
        realmPubkey = new PublicKey(realm);
        govAuthPubkey = new PublicKey(govAuthority);
      } else {
        squadPubkey = new PublicKey(squad);
      }
    } catch (e) {
      alert("Could not parse Public Keys, please check they are correct.");
      return;
    }

    let govTokenMint;
    if (usingSPL) {
      // get the mint from the realm (communityMint)
      if (!realmPubkey || !govAuthPubkey) {
        alert("Could not parse Public Keys, please check they are correct.");
        return;
      }
      govTokenMint = (await getRealm(connection, realmPubkey)).account
        .communityMint;
    } else {
      if (!squadPubkey) {
        alert("Could not parse Public Keys, please check they are correct.");
        return;
      }
      [govTokenMint] = await getSquadMintAddressAndBump(squadPubkey);
    }
    const [expenseManager] = getExpenseManagerAddressAndBump(
      name,
      SLIDE_PROGRAM_ID
    );
    console.log(
      name,
      govTokenMint.toString(),
      expenseManager.toString(),
      userPublicKey?.toString()
    );
    console.log("About to create...");
    // this fails with unauthed signer... phantom asked for approval though
    // maybe rerun tests? system program issue?
    await program.methods
      .createExpenseManager(name, govTokenMint)
      .accounts({
        expenseManager,
        payer: userPublicKey,
      })
      .rpc();
    console.log("Created!");
  };

  return (
    <div className={`modal ${open && "modal-open"}`}>
      <div className="modal-box">
        <h3 className="font-bold text-lg">Create an expense manager</h3>
        <div className="flex flex-col gap-2 justify-center">
          <input
            type="text"
            placeholder="Name"
            className="input input-bordered w-full bg-white text-black"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <div className="flex justify-center items-center px-4">
            <input
              type="radio"
              className=""
              name="daoProvider"
              id="radioSPL"
              checked={usingSPL}
              onChange={(event) => setUsingSPL(event.target.checked)}
            />
            <label htmlFor="radioSPL">SPL Governance</label>
            <input
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
                type="text"
                placeholder="Realm Pubkey"
                className="input input-bordered w-full bg-white text-black"
                value={realm}
                onChange={(event) => setRealm(event.target.value)}
              />
              <input
                type="text"
                placeholder="Governance Pubkey"
                className="input input-bordered w-full bg-white text-black"
                value={govAuthority}
                onChange={(event) => setGovAuthority(event.target.value)}
              />
            </>
          )}
          {!usingSPL && (
            <input
              type="text"
              placeholder="Squads Pubkey"
              className="input input-bordered w-full bg-white text-black"
              value={squad}
              onChange={(event) => setSquad(event.target.value)}
            />
          )}
        </div>
        <div className="flex gap-2 mt-4 justify-center">
          <button
            className="btn btn-primary"
            onClick={() =>
              submitForm()
                .then(() => alert("Hooray!"))
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
