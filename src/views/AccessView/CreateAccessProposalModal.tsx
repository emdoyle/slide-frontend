import { ExpenseManagerItem } from "types";
import { useAlert } from "react-alert";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useSlideProgram } from "utils/useSlide";
import { useState } from "react";
import { Loader } from "components";
import { createSPLAccessProposal, createSquadsAccessProposal } from "./actions";
import { getAccessRecordAddressAndBump } from "@slidexyz/slide-sdk";

export const CreateAccessProposalModal = ({
  open,
  close,
  expenseManager,
}: {
  open: boolean;
  close: (success?: boolean) => void;
  expenseManager: ExpenseManagerItem;
}) => {
  const Alert = useAlert();
  const { connection } = useConnection();
  const { publicKey: userPublicKey } = useWallet();
  const { program } = useSlideProgram();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [role, setRole] = useState<"reviewer" | "admin">("reviewer");

  const createAccessProposal = async (): Promise<string | undefined> => {
    if (!program || !expenseManager || !userPublicKey) return;
    const managerData = expenseManager.account;
    let alertText;
    const [accessRecord] = getAccessRecordAddressAndBump(
      expenseManager.publicKey,
      userPublicKey,
      program.programId
    );
    if (managerData.realm && managerData.governanceAuthority) {
      alertText = await createSPLAccessProposal(
        program,
        connection,
        userPublicKey,
        expenseManager,
        accessRecord,
        role
      );
    } else {
      alertText = await createSquadsAccessProposal(
        program,
        connection,
        userPublicKey,
        expenseManager,
        role
      );
    }
    return alertText;
  };

  return (
    <div className={`modal ${open && "modal-open"}`}>
      <div className="modal-box">
        <div className="flex flex-col gap-2 justify-center mt-10">
          <p className="text-xl">
            Create a Proposal to grant elevated permissions to your wallet
          </p>
          <label className="label">
            <span className="label-text">Role</span>
          </label>
          <select
            disabled={isSubmitting}
            className="select select-bordered"
            onChange={(event) =>
              // @ts-ignore
              setRole(event.target.value)
            }
          >
            <option disabled selected>
              Select a role...
            </option>
            <option value="reviewer">Reviewer</option>
            <option value="admin">Admin</option>
          </select>
          <div className="flex gap-2 mt-4 justify-center">
            <button
              disabled={isSubmitting}
              className="btn btn-primary"
              onClick={() => {
                setIsSubmitting(true);
                createAccessProposal()
                  .then((alertText?) => {
                    setIsSubmitting(false);
                    Alert.show(alertText ?? "Success");
                    close(true);
                  })
                  .catch((err: Error) => {
                    setIsSubmitting(false);
                    Alert.error(err.message);
                    close(false);
                  });
              }}
            >
              Request Access
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
