import { FC, useState } from "react";
import { ExpenseManagerItem, ExpensePackageItem } from "types";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSlideProgram } from "utils/useSlide";
import { getTokenOwnerRecordAddress } from "@solana/spl-governance";
import { constants, address, Slide } from "@slidexyz/slide-sdk";
import { Program } from "@project-serum/anchor";
import {
  getMemberEquityAddressAndBump,
  SQUADS_PROGRAM_ID,
} from "@slidexyz/squads-sdk";
import { Loader } from "components";
import { useAlert } from "react-alert";
import { displayPubkey } from "../../utils/formatting";

type Props = {
  expenseManager: ExpenseManagerItem;
  expensePackage: ExpensePackageItem;
  canApproveAndDeny?: boolean;
  refetchExpensePackage?: () => void;
  openUpdateModal?: () => void;
};

const submitSPLPackage = async (
  program: Program<Slide>,
  user: PublicKey,
  expenseManager: ExpenseManagerItem,
  expensePackage: ExpensePackageItem
): Promise<string | undefined> => {
  const packageData = expensePackage.account;
  const managerData = expenseManager.account;
  if (!managerData.realm || !managerData.governanceAuthority) {
    return "Manager not setup for Realms";
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
): Promise<string | undefined> => {
  const packageData = expensePackage.account;
  const managerData = expenseManager.account;
  if (!managerData.realm || !managerData.governanceAuthority) {
    return "Manager not setup for Realms";
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
): Promise<string | undefined> => {
  const packageData = expensePackage.account;
  const managerData = expenseManager.account;
  if (!managerData.realm || !managerData.governanceAuthority) {
    return "Manager not setup for Realms";
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
): Promise<string | undefined> => {
  const packageData = expensePackage.account;
  const managerData = expenseManager.account;
  if (!managerData.squad) {
    return "Manager not setup for Squads";
  }
  const [memberEquity] = await getMemberEquityAddressAndBump(
    SQUADS_PROGRAM_ID,
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
): Promise<string | undefined> => {
  const packageData = expensePackage.account;
  const managerData = expenseManager.account;
  if (!managerData.squad) {
    return "Manager not setup for Squads";
  }
  const [memberEquity] = await getMemberEquityAddressAndBump(
    SQUADS_PROGRAM_ID,
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
): Promise<string | undefined> => {
  const packageData = expensePackage.account;
  const managerData = expenseManager.account;
  if (!managerData.squad) {
    return "Manager not setup for Squads";
  }
  const [memberEquity] = await getMemberEquityAddressAndBump(
    SQUADS_PROGRAM_ID,
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
  refetchExpensePackage,
  openUpdateModal,
}) => {
  const Alert = useAlert();
  const { publicKey: userPublicKey } = useWallet();
  const { program } = useSlideProgram();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const packageData = expensePackage.account;
  const managerData = expenseManager.account;
  const quantityDisplay = (
    packageData.quantity.toNumber() / LAMPORTS_PER_SOL
  ).toFixed(6);

  const submitPackage = async () => {
    if (!program || !userPublicKey) {
      Alert.show("Please connect your wallet");
      return;
    }
    let alertText;
    if (managerData.realm && managerData.governanceAuthority) {
      alertText = await submitSPLPackage(
        program,
        userPublicKey,
        expenseManager,
        expensePackage
      );
    } else {
      alertText = await submitSquadsPackage(
        program,
        userPublicKey,
        expenseManager,
        expensePackage
      );
    }
    if (alertText) {
      Alert.show(alertText);
    }
  };
  const approvePackage = async () => {
    if (!program || !userPublicKey) {
      Alert.show("Please connect your wallet");
      return;
    }
    let alertText;
    if (managerData.realm && managerData.governanceAuthority) {
      alertText = await approveSPLPackage(
        program,
        userPublicKey,
        expenseManager,
        expensePackage
      );
    } else {
      alertText = await approveSquadsPackage(
        program,
        userPublicKey,
        expenseManager,
        expensePackage
      );
    }
    if (alertText) {
      Alert.show(alertText);
    }
  };
  const denyPackage = async () => {
    if (!program || !userPublicKey) {
      Alert.show("Please connect your wallet");
      return;
    }
    let alertText;
    if (managerData.realm && managerData.governanceAuthority) {
      alertText = await denySPLPackage(
        program,
        userPublicKey,
        expenseManager,
        expensePackage
      );
    } else {
      alertText = await denySquadsPackage(
        program,
        userPublicKey,
        expenseManager,
        expensePackage
      );
    }
    if (alertText) {
      Alert.show(alertText);
    }
  };
  const withdrawPackage = async () => {
    if (!program || !userPublicKey) {
      Alert.show("Please connect your wallet");
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
        <div className="flex flex-col text-left">
          <h2 className="text-lg text-black">
            {packageData.name} {quantityDisplay}◎
          </h2>
          {packageData.description.trim() && (
            <p className="text-md text-gray-500 text-opacity-95 pl-3">
              Description: {packageData.description}
            </p>
          )}
          <p className="text-md text-gray-500 text-opacity-95 pl-3">
            Owner: {displayPubkey(packageData.owner)}
          </p>
        </div>
        {isLoading && (
          <div>
            <Loader noText color="black" />
          </div>
        )}
        {!isLoading && packageData.state.created && (
          <div className="flex gap-2">
            {packageOwnedByUser && (
              <button
                className="btn btn-outline btn-primary w-24"
                onClick={openUpdateModal}
              >
                Update
              </button>
            )}
            <button
              className="btn btn-primary w-24"
              onClick={() => {
                setIsLoading(true);
                submitPackage()
                  .then(() => {
                    if (refetchExpensePackage) {
                      refetchExpensePackage();
                    }
                  })
                  .catch((err: Error) => Alert.error(err.message))
                  .finally(() => setIsLoading(false));
              }}
            >
              Submit
            </button>
          </div>
        )}
        {!isLoading &&
          canApproveAndDeny &&
          !packageOwnedByUser &&
          packageData.state.pending && (
            <div className="flex gap-2">
              <button
                className="btn btn-success w-24"
                onClick={() => {
                  setIsLoading(true);
                  approvePackage()
                    .then(() => {
                      if (refetchExpensePackage) {
                        refetchExpensePackage();
                      }
                    })
                    .catch((err: Error) => Alert.error(err.message))
                    .finally(() => setIsLoading(false));
                }}
              >
                Approve
              </button>
              <button
                className="btn btn-error w-24"
                onClick={() => {
                  setIsLoading(true);
                  denyPackage()
                    .then(() => {
                      if (refetchExpensePackage) {
                        refetchExpensePackage();
                      }
                    })
                    .catch((err: Error) => Alert.error(err.message))
                    .finally(() => setIsLoading(false));
                }}
              >
                Deny
              </button>
            </div>
          )}
        {!isLoading &&
          (!canApproveAndDeny || packageOwnedByUser) &&
          packageData.state.pending && (
            <button className="btn btn-primary btn-outline btn-disabled w-24">
              Pending
            </button>
          )}
        {!isLoading && packageData.state.approved && (
          <div className="flex gap-2">
            <button className="btn btn-primary btn-outline btn-disabled w-24">
              Approved
            </button>
            {packageOwnedByUser && (
              <button
                className="btn btn-primary w-24"
                onClick={() => {
                  setIsLoading(true);
                  withdrawPackage()
                    .then(() => {
                      if (refetchExpensePackage) {
                        refetchExpensePackage();
                      }
                    })
                    .catch((err: Error) => Alert.error(err.message))
                    .finally(() => setIsLoading(false));
                }}
              >
                Withdraw
              </button>
            )}
          </div>
        )}
        {!isLoading && packageData.state.denied && (
          <button className="btn btn-error btn-disabled btn-outline w-24">
            Denied
          </button>
        )}
        {!isLoading && packageData.state.paid && (
          <button className="btn btn-primary btn-outline btn-disabled w-24">
            Paid
          </button>
        )}
      </div>
    </div>
  );
};
