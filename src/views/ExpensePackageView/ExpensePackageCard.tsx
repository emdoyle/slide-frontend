import { FC } from "react";
import { ExpenseManagerItem, ExpensePackageItem } from "types";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSlideProgram } from "utils/useSlide";
import { getTokenOwnerRecordAddress } from "@solana/spl-governance";
import { constants, address, Slide } from "@slidexyz/slide-sdk";
import { useRouter } from "next/router";
import { Program } from "@project-serum/anchor";
import {
  getMemberEquityAddressAndBump,
  SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
} from "@slidexyz/squads-sdk";

type Props = {
  expenseManager: ExpenseManagerItem;
  expensePackage: ExpensePackageItem;
  canApproveAndDeny?: boolean;
};

const submitSPLPackage = async (
  program: Program<Slide>,
  user: PublicKey,
  expenseManager: ExpenseManagerItem,
  expensePackage: ExpensePackageItem
) => {
  const packageData = expensePackage.account;
  const managerData = expenseManager.account;
  if (!managerData.realm || !managerData.governanceAuthority) {
    alert("Manager not setup for SPL");
    return;
  }
  const tokenOwnerRecord = await getTokenOwnerRecordAddress(
    constants.SPL_GOV_PROGRAM_ID,
    managerData.realm,
    managerData.membershipTokenMint,
    user
  );
  await program.methods
    .splGovSubmitExpensePackage(managerData.realm, packageData.nonce)
    .accounts({
      expensePackage: expensePackage.publicKey,
      expenseManager: expenseManager.publicKey,
      tokenOwnerRecord,
      owner: user,
    })
    .rpc();
};

const approveSPLPackage = async (
  program: Program<Slide>,
  user: PublicKey,
  expenseManager: ExpenseManagerItem,
  expensePackage: ExpensePackageItem
) => {
  const packageData = expensePackage.account;
  const managerData = expenseManager.account;
  if (!managerData.realm || !managerData.governanceAuthority) {
    alert("Manager not setup for SPL");
    return;
  }
  const tokenOwnerRecord = await getTokenOwnerRecordAddress(
    constants.SPL_GOV_PROGRAM_ID,
    managerData.realm,
    managerData.membershipTokenMint,
    user
  );
  const [accessRecord] = address.getAccessRecordAddressAndBump(
    program.programId,
    expenseManager.publicKey,
    user
  );
  await program.methods
    .splGovApproveExpensePackage(managerData.realm, packageData.nonce)
    .accounts({
      expensePackage: expensePackage.publicKey,
      expenseManager: expenseManager.publicKey,
      tokenOwnerRecord,
      accessRecord,
      authority: user,
    })
    .rpc();
};

const denySPLPackage = async (
  program: Program<Slide>,
  user: PublicKey,
  expenseManager: ExpenseManagerItem,
  expensePackage: ExpensePackageItem
) => {
  const packageData = expensePackage.account;
  const managerData = expenseManager.account;
  if (!managerData.realm || !managerData.governanceAuthority) {
    alert("Manager not setup for SPL");
    return;
  }
  const tokenOwnerRecord = await getTokenOwnerRecordAddress(
    constants.SPL_GOV_PROGRAM_ID,
    managerData.realm,
    managerData.membershipTokenMint,
    user
  );
  const [accessRecord] = address.getAccessRecordAddressAndBump(
    program.programId,
    expenseManager.publicKey,
    user
  );
  await program.methods
    .splGovDenyExpensePackage(managerData.realm, packageData.nonce)
    .accounts({
      expensePackage: expensePackage.publicKey,
      expenseManager: expenseManager.publicKey,
      tokenOwnerRecord,
      accessRecord,
      authority: user,
    })
    .rpc();
};

const submitSquadsPackage = async (
  program: Program<Slide>,
  user: PublicKey,
  expenseManager: ExpenseManagerItem,
  expensePackage: ExpensePackageItem
) => {
  const packageData = expensePackage.account;
  const managerData = expenseManager.account;
  if (!managerData.squad) {
    alert("Manager not setup for Squads");
    return;
  }
  const [memberEquity] = await getMemberEquityAddressAndBump(
    SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
    user,
    managerData.squad
  );
  await program.methods
    .squadsSubmitExpensePackage(packageData.nonce)
    .accounts({
      expensePackage: expensePackage.publicKey,
      expenseManager: expenseManager.publicKey,
      squad: managerData.squad,
      memberEquity,
      owner: user,
    })
    .rpc();
};

const approveSquadsPackage = async (
  program: Program<Slide>,
  user: PublicKey,
  expenseManager: ExpenseManagerItem,
  expensePackage: ExpensePackageItem
) => {
  const packageData = expensePackage.account;
  const managerData = expenseManager.account;
  if (!managerData.squad) {
    alert("Manager not setup for Squads");
    return;
  }
  const [memberEquity] = await getMemberEquityAddressAndBump(
    SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
    user,
    managerData.squad
  );
  const [accessRecord] = address.getAccessRecordAddressAndBump(
    program.programId,
    expenseManager.publicKey,
    user
  );
  await program.methods
    .squadsApproveExpensePackage(packageData.nonce)
    .accounts({
      expensePackage: expensePackage.publicKey,
      expenseManager: expenseManager.publicKey,
      accessRecord,
      memberEquity,
      squad: managerData.squad,
      authority: user,
    })
    .rpc();
};

const denySquadsPackage = async (
  program: Program<Slide>,
  user: PublicKey,
  expenseManager: ExpenseManagerItem,
  expensePackage: ExpensePackageItem
) => {
  const packageData = expensePackage.account;
  const managerData = expenseManager.account;
  if (!managerData.squad) {
    alert("Manager not setup for Squads");
    return;
  }
  const [memberEquity] = await getMemberEquityAddressAndBump(
    SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
    user,
    managerData.squad
  );
  const [accessRecord] = address.getAccessRecordAddressAndBump(
    program.programId,
    expenseManager.publicKey,
    user
  );
  await program.methods
    .squadsDenyExpensePackage(packageData.nonce)
    .accounts({
      expensePackage: expensePackage.publicKey,
      expenseManager: expenseManager.publicKey,
      accessRecord,
      memberEquity,
      squad: managerData.squad,
      authority: user,
    })
    .rpc();
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
    if (!program || !userPublicKey) {
      alert("Please connect your wallet");
      return;
    }
    if (managerData.realm && managerData.governanceAuthority) {
      await submitSPLPackage(
        program,
        userPublicKey,
        expenseManager,
        expensePackage
      );
    } else {
      await submitSquadsPackage(
        program,
        userPublicKey,
        expenseManager,
        expensePackage
      );
    }
  };
  const approvePackage = async () => {
    if (!program || !userPublicKey) {
      alert("Please connect your wallet");
      return;
    }
    if (managerData.realm && managerData.governanceAuthority) {
      await approveSPLPackage(
        program,
        userPublicKey,
        expenseManager,
        expensePackage
      );
    } else {
      await approveSquadsPackage(
        program,
        userPublicKey,
        expenseManager,
        expensePackage
      );
    }
  };
  const denyPackage = async () => {
    if (!program || !userPublicKey) {
      alert("Please connect your wallet");
      return;
    }
    if (managerData.realm && managerData.governanceAuthority) {
      await denySPLPackage(
        program,
        userPublicKey,
        expenseManager,
        expensePackage
      );
    } else {
      await denySquadsPackage(
        program,
        userPublicKey,
        expenseManager,
        expensePackage
      );
    }
  };
  const withdrawPackage = async () => {
    if (!program || !userPublicKey) {
      alert("Please connect your wallet");
      return;
    }
    await program.methods
      .withdrawFromExpensePackage(packageData.nonce)
      .accounts({
        expensePackage: expensePackage.publicKey,
        owner: userPublicKey,
      })
      .rpc();
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
