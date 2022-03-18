import { FC } from "react";
import { ExpenseManagerItem, ExpensePackageItem } from "types";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSlideProgram } from "utils/useSlide";
import { getTokenOwnerRecordAddress } from "@solana/spl-governance";
import { SPL_GOV_PROGRAM_ID } from "@slidexyz/slide-sdk/constants";
import { getAccessRecordAddressAndBump } from "@slidexyz/slide-sdk/address";
import { SLIDE_PROGRAM_ID } from "../../constants";

type Props = {
  expenseManager: ExpenseManagerItem;
  expensePackage: ExpensePackageItem;
  canApproveAndDeny?: boolean;
};

export const ExpensePackageCard: FC<Props> = ({
  expenseManager,
  expensePackage,
  canApproveAndDeny,
}) => {
  const { publicKey: userPublicKey } = useWallet();
  const { program } = useSlideProgram();
  const packageData = expensePackage.account;
  const managerData = expenseManager.account;
  const quantityDisplay = (
    packageData.quantity.toNumber() / LAMPORTS_PER_SOL
  ).toFixed(6);

  const updatePackage = async () => {};
  const submitPackage = async () => {
    if (program && userPublicKey && managerData.realm) {
      const tokenOwnerRecord = await getTokenOwnerRecordAddress(
        SPL_GOV_PROGRAM_ID,
        managerData.realm,
        managerData.membershipTokenMint,
        userPublicKey
      );
      await program.methods
        .splGovSubmitExpensePackage(managerData.realm, packageData.nonce)
        .accounts({
          expensePackage: expensePackage.publicKey,
          expenseManager: expenseManager.publicKey,
          tokenOwnerRecord,
          owner: userPublicKey,
        })
        .rpc();
    }
  };
  const approvePackage = async () => {
    if (program && userPublicKey && managerData.realm) {
      const tokenOwnerRecord = await getTokenOwnerRecordAddress(
        SPL_GOV_PROGRAM_ID,
        managerData.realm,
        managerData.membershipTokenMint,
        userPublicKey
      );
      const [accessRecord] = getAccessRecordAddressAndBump(
        SLIDE_PROGRAM_ID,
        expenseManager.publicKey,
        userPublicKey
      );
      await program.methods
        .splGovApproveExpensePackage(managerData.realm, packageData.nonce)
        .accounts({
          expensePackage: expensePackage.publicKey,
          expenseManager: expenseManager.publicKey,
          tokenOwnerRecord,
          accessRecord,
          authority: userPublicKey,
        })
        .rpc();
    }
  };
  const denyPackage = async () => {
    if (program && userPublicKey && managerData.realm) {
      const tokenOwnerRecord = await getTokenOwnerRecordAddress(
        SPL_GOV_PROGRAM_ID,
        managerData.realm,
        managerData.membershipTokenMint,
        userPublicKey
      );
      const [accessRecord] = getAccessRecordAddressAndBump(
        SLIDE_PROGRAM_ID,
        expenseManager.publicKey,
        userPublicKey
      );
      await program.methods
        .splGovDenyExpensePackage(managerData.realm, packageData.nonce)
        .accounts({
          expensePackage: expensePackage.publicKey,
          expenseManager: expenseManager.publicKey,
          tokenOwnerRecord,
          accessRecord,
          authority: userPublicKey,
        })
        .rpc();
    }
  };
  const withdrawPackage = async () => {};

  const packageOwnedByUser =
    userPublicKey && packageData.owner.equals(userPublicKey);
  return (
    <div className="bordered w-full compact rounded-md bg-white">
      <div className="flex justify-between items-center p-4">
        <h2 className="text-lg text-black">
          {packageData.name} {quantityDisplay}◎
        </h2>
        {packageData.state.created && (
          <div className="flex gap-2">
            <button
              className="btn btn-primary w-24"
              onClick={() =>
                updatePackage()
                  .then(() => alert("Hooray!"))
                  .catch(alert)
              }
            >
              Update
            </button>
            <button
              className="btn btn-primary w-24"
              onClick={() =>
                submitPackage()
                  .then(() => alert("Hooray!"))
                  .catch(alert)
              }
            >
              Submit
            </button>
          </div>
        )}
        {canApproveAndDeny && !packageOwnedByUser && packageData.state.pending && (
          <div className="flex gap-2">
            <button
              className="btn btn-success w-24"
              onClick={() =>
                approvePackage()
                  .then(() => alert("Hooray!"))
                  .catch(alert)
              }
            >
              Approve
            </button>
            <button
              className="btn btn-error w-24"
              onClick={() =>
                denyPackage()
                  .then(() => alert("Hooray!"))
                  .catch(alert)
              }
            >
              Deny
            </button>
          </div>
        )}
        {!canApproveAndDeny && packageData.state.pending && (
          <button className="btn btn-primary btn-outline btn-disabled w-24">
            Pending
          </button>
        )}
        {packageData.state.approved && (
          <div className="flex gap-2">
            <button className="btn btn-primary btn-outline btn-disabled w-24">
              Approved
            </button>
            {packageOwnedByUser && (
              <button
                className="btn btn-primary w-24"
                onClick={() =>
                  withdrawPackage()
                    .then(() => alert("Hooray!"))
                    .catch(alert)
                }
              >
                Withdraw
              </button>
            )}
          </div>
        )}
        {packageData.state.denied && (
          <button className="btn btn-error btn-disabled btn-outline w-24">
            Denied
          </button>
        )}
      </div>
    </div>
  );
};
