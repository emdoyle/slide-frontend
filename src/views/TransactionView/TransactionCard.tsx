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
        <h2 className="text-lg text-black">{details.name}</h2>
        <button className="btn w-24" disabled>View</button>
      </div>
    </div>
  );
};
