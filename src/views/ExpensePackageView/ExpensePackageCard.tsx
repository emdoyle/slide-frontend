import { FC } from "react";
import { ExpenseManagerItem, ExpensePackageItem } from "types";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSlideProgram } from "utils/useSlide";
import { getTokenOwnerRecordAddress } from "@solana/spl-governance";
import { constants, address } from "@slidexyz/slide-sdk";
import { SLIDE_PROGRAM_ID } from "../../constants";
import { useRouter } from "next/router";

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
  const router = useRouter();
  const { publicKey: userPublicKey } = useWallet();
  const { program } = useSlideProgram();
  const packageData = expensePackage.account;
  const managerData = expenseManager.account;
  const quantityDisplay = (
    packageData.quantity.toNumber() / LAMPORTS_PER_SOL
  ).toFixed(6);

  const submitPackage = async () => {
    if (program && userPublicKey && managerData.realm) {
      const tokenOwnerRecord = await getTokenOwnerRecordAddress(
        constants.SPL_GOV_PROGRAM_ID,
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
        constants.SPL_GOV_PROGRAM_ID,
        managerData.realm,
        managerData.membershipTokenMint,
        userPublicKey
      );
      const [accessRecord] = address.getAccessRecordAddressAndBump(
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
        constants.SPL_GOV_PROGRAM_ID,
        managerData.realm,
        managerData.membershipTokenMint,
        userPublicKey
      );
      const [accessRecord] = address.getAccessRecordAddressAndBump(
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
  const withdrawPackage = async () => {
    if (program && userPublicKey && managerData.realm) {
      await program.methods
        .withdrawFromExpensePackage(packageData.nonce)
        .accounts({
          expensePackage: expensePackage.publicKey,
          owner: userPublicKey,
        })
        .rpc();
    }
  };

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
                submitPackage()
                  .then(() => router.reload())
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
                  .then(() => router.reload())
                  .catch(alert)
              }
            >
              Approve
            </button>
            <button
              className="btn btn-error w-24"
              onClick={() =>
                denyPackage()
                  .then(() => router.reload())
                  .catch(alert)
              }
            >
              Deny
            </button>
          </div>
        )}
        {(!canApproveAndDeny || packageOwnedByUser) &&
          packageData.state.pending && (
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
                    .then(() => router.reload())
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
        {packageData.state.paid && (
          <button className="btn btn-primary btn-outline btn-disabled w-24">
            Paid
          </button>
        )}
      </div>
    </div>
  );
};
