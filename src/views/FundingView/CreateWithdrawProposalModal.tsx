import { ExpenseManagerItem } from "types";
import { useAlert } from "react-alert";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useSlideProgram } from "utils/useSlide";
import { useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Loader } from "components";
import {
  createSPLWithdrawalProposal,
  createSquadsWithdrawalProposal,
} from "./actions";

export const CreateWithdrawProposalModal = ({
  open,
  close,
  expenseManager,
  managerBalance,
}: {
  open: boolean;
  close: (success?: boolean) => void;
  expenseManager: ExpenseManagerItem;
  managerBalance: number;
}) => {
  const Alert = useAlert();
  const { connection } = useConnection();
  const { publicKey: userPublicKey } = useWallet();
  const { program } = useSlideProgram();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");

  const withdrawFromManager = async (
    solWithdrawalAmount: string
  ): Promise<string | undefined> => {
    if (!program || !expenseManager || !userPublicKey) {
      throw new Error("Please connect your wallet");
    }
    let solWithdrawalNum;
    try {
      solWithdrawalNum = Number(solWithdrawalAmount);
    } catch {
      throw new Error("Withdrawal amount could not be parsed as a number.");
    }
    if (managerBalance && solWithdrawalNum > managerBalance) {
      throw new Error(
        `Withdrawal amount (${solWithdrawalNum}) exceeds balance of Expense Manager (${managerBalance}).`
      );
    }
    const lamports = Number(solWithdrawalAmount) * LAMPORTS_PER_SOL;

    const managerData = expenseManager.account;
    let alertText;
    if (managerData.realm && managerData.governanceAuthority) {
      // TODO: use lamports as input
      alertText = await createSPLWithdrawalProposal(
        program,
        connection,
        userPublicKey,
        expenseManager
      );
    } else {
      alertText = await createSquadsWithdrawalProposal(
        program,
        connection,
        userPublicKey,
        expenseManager,
        lamports
      );
    }

    return alertText;
  };

  return (
    <div className={`modal ${open && "modal-open"}`}>
      <div className="modal-box">
        <div className="flex flex-col gap-2 justify-center mt-10">
          <p className="text-xl">
            Create a Proposal to withdraw funds from your Slide Expense Manager
          </p>
          <label className="label">
            <span className="label-text">Withdrawal amount</span>
          </label>
          <input
            disabled={isSubmitting}
            type="number"
            placeholder="Amount (in SOL)"
            className="input input-bordered"
            max={managerBalance}
            min={0}
            step={1 / LAMPORTS_PER_SOL}
            value={withdrawAmount}
            onChange={(event) => setWithdrawAmount(event.target.value)}
          />
          <div className="flex gap-2 mt-4 justify-center">
            <button
              disabled={isSubmitting}
              className="btn btn-error"
              onClick={() => {
                setIsSubmitting(true);
                withdrawFromManager(withdrawAmount)
                  .then((alertText?) => {
                    Alert.show(alertText ?? "Success");
                  })
                  .catch((err: Error) => Alert.error(err.message))
                  .finally(() => {
                    setIsSubmitting(false);
                    close();
                  });
              }}
            >
              Withdraw
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
          {isSubmitting && (
            <div>
              <Loader noText />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
