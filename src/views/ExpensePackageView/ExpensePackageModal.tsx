import { ExpenseManagerItem, ExpensePackageItem } from "types";
import { useAlert } from "react-alert";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSlideProgram } from "utils/useSlide";
import { useEffect, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  createSPLExpensePackage,
  createSquadsExpensePackage,
  updateSPLExpensePackage,
  updateSquadsExpensePackage,
} from "./actions";
import BN from "bn.js";
import { useSWRConfig } from "swr";
import { fetchExpensePackages } from "../../utils/api";

export const ExpensePackageModal = ({
  open,
  close,
  expenseManager,
  packageToUpdate,
}: {
  open: boolean;
  close: () => void;
  expenseManager: ExpenseManagerItem;
  packageToUpdate?: ExpensePackageItem;
}) => {
  const Alert = useAlert();
  const { publicKey: userPublicKey } = useWallet();
  const { program } = useSlideProgram();
  const { mutate } = useSWRConfig();
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (packageToUpdate) {
      // set 'default' initial values when updating
      setName(packageToUpdate.account.name);
      setDescription(packageToUpdate.account.description);
      setQuantity(
        packageToUpdate.account.quantity
          .div(new BN(LAMPORTS_PER_SOL))
          .toNumber()
          .toFixed(6)
      );
    }
  }, [packageToUpdate?.publicKey.toString()]);

  const submitForm = async () => {
    if (!userPublicKey || !program) {
      Alert.show("Please connect your wallet");
      return;
    }
    if (!name || !quantity) {
      Alert.show("Name and quantity are required fields");
      return;
    }
    const expenseManagerAccount = expenseManager.account;
    let alertText;
    if (
      expenseManagerAccount.realm &&
      expenseManagerAccount.governanceAuthority
    ) {
      if (packageToUpdate) {
        alertText = await updateSPLExpensePackage(
          program,
          userPublicKey,
          expenseManager,
          packageToUpdate.account.nonce,
          name,
          description,
          quantity
        );
      } else {
        alertText = await createSPLExpensePackage(
          program,
          userPublicKey,
          expenseManager,
          name,
          description,
          quantity
        );
      }
    } else if (expenseManagerAccount.squad) {
      if (packageToUpdate) {
        alertText = await updateSquadsExpensePackage(
          program,
          userPublicKey,
          expenseManager,
          packageToUpdate.account.nonce,
          name,
          description,
          quantity
        );
      } else {
        alertText = await createSquadsExpensePackage(
          program,
          userPublicKey,
          expenseManager,
          name,
          description,
          quantity
        );
      }
    }
    if (alertText) {
      Alert.show(alertText);
    }
  };

  const headerText = packageToUpdate ? "Update expense" : "Add a new expense";
  const submitText = packageToUpdate ? "Update" : "Create";

  return (
    <div className={`modal ${open && "modal-open"}`}>
      <div className="modal-box">
        <h3 className="font-bold text-lg">{headerText}</h3>
        <div className="flex flex-col gap-2 justify-center">
          <input
            disabled={isLoading}
            type="text"
            placeholder="For"
            className="input input-bordered w-full bg-white text-black"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <input
            disabled={isLoading}
            type="text"
            placeholder="Description (optional)"
            className="input input-bordered w-full bg-white text-black"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <input
            disabled={isLoading}
            type="number"
            placeholder="Amount (in SOL)"
            className="input input-bordered w-full bg-white text-black"
            max={1_000_000}
            min={0}
            step={1 / LAMPORTS_PER_SOL}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </div>
        <div className="flex gap-2 mt-4 justify-center">
          <button
            disabled={isLoading}
            className="btn btn-primary"
            onClick={() => {
              setIsLoading(true);
              submitForm()
                .then(() => {
                  Alert.show("Success");
                  mutate([fetchExpensePackages.name, expenseManager.publicKey]);
                  close();
                })
                .catch((err: Error) => Alert.error(err.message))
                .finally(() => setIsLoading(false));
            }}
          >
            {submitText}
          </button>
          <button
            className="btn"
            onClick={() => {
              setIsLoading(false);
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
