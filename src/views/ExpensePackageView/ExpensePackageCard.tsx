import { FC, useState, useEffect } from "react";
import useSWR from "swr";

import { fetcher } from "utils/fetcher";
import { ExpensePackageItem } from "../../types";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";

type Props = {
  expensePackage: ExpensePackageItem;
  canApproveAndDeny?: boolean;
};

export const ExpensePackageCard: FC<Props> = ({
  expensePackage,
  canApproveAndDeny,
}) => {
  const { publicKey } = useWallet();
  const packageData = expensePackage.account;
  const quantityDisplay = (
    packageData.quantity.toNumber() / LAMPORTS_PER_SOL
  ).toFixed(6);
  const packageOwnedByUser = publicKey && packageData.owner.equals(publicKey);
  return (
    <div className="bordered w-full compact rounded-md bg-white">
      <div className="flex justify-between items-center p-4">
        <h2 className="text-lg text-black">
          {packageData.name} {quantityDisplay}◎
        </h2>
        {packageData.state.created && (
          <button className="btn btn-primary w-24">Update</button>
        )}
        {canApproveAndDeny && !packageOwnedByUser && packageData.state.pending && (
          <div className="flex gap-2">
            <button className="btn btn-success w-24">Approve</button>
            <button className="btn btn-error w-24">Deny</button>
          </div>
        )}
        {packageData.state.approved && (
          <div className="flex gap-2">
            <button className="btn btn-primary btn-outline btn-disabled w-24">
              Approved
            </button>
            {packageOwnedByUser && (
              <button className="btn btn-primary w-24">Withdraw</button>
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
