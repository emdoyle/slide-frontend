import { FC, useState, useEffect } from "react";
import useSWR from "swr";

import { fetcher } from "utils/fetcher";

type Props = {
  details: any;
};

export const TransactionCard: FC<Props> = ({ details }) => {
  return (
    <div className="bordered w-full compact rounded-md bg-white">
      <div className="flex justify-between items-center p-4">
        <h2 className="text-lg text-black">
          {details.name} {details.amount}◎
        </h2>
        {details.status === "pending" && (
          <div className="flex gap-2">
            <button className="btn btn-success w-24">Approve</button>
            <button className="btn btn-error w-24">Deny</button>
          </div>
        )}
        {details.status === "approved" && (
          <div className="flex gap-2">
            <button className="btn btn-success btn-disabled w-24">
              Approved
            </button>
            <button className="btn btn-primary w-24">Withdraw</button>
          </div>
        )}
        {details.status === "denied" && (
          <button className="btn btn-error btn-disabled w-24">Denied</button>
        )}
      </div>
    </div>
  );
};
