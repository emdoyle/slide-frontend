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
import { useSWRConfig } from "swr";
import { SQUADS_PROGRAM_ID } from "@slidexyz/squads-sdk";
import { SPL_GOV_PROPOSALS_KEY, SQUADS_PROPOSALS_KEY } from "../../utils/api";
import { SPL_GOV_PROGRAM_ID } from "@slidexyz/slide-sdk/lib/constants";

export const CreateWithdrawProposalModal = ({
  open,
  close,
  expenseManager,
  managerBalance,
}: {
  open: boolean;
  close: () => void;
  expenseManager: ExpenseManagerItem;
  managerBalance: number;
}) => {
  const Alert = useAlert();
  const { connection } = useConnection();
  const { publicKey: userPublicKey } = useWallet();
  const { mutate } = useSWRConfig();
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
      alertText = await createSPLWithdrawalProposal(
        program,
        connection,
        userPublicKey,
        expenseManager,
        lamports
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
                    setIsSubmitting(false);
                    Alert.show(alertText ?? "Success");
                    if (expenseManager.account.squad) {
                      mutate([
                        [
                          connection,
                          SQUADS_PROGRAM_ID,
                          SQUADS_PROPOSALS_KEY,
                          program?.programId,
                          expenseManager.publicKey,
                          expenseManager.account.squad,
                        ],
                      ]);
                    } else {
                      mutate([
                        connection,
                        SPL_GOV_PROGRAM_ID,
                        SPL_GOV_PROPOSALS_KEY,
                        expenseManager.publicKey,
                        expenseManager.account.realm,
                      ]);
                    }
                    close();
                  })
                  .catch((err: Error) => {
                    setIsSubmitting(false);
                    Alert.error(err.message);
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
