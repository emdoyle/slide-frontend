import { FC, useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";

import { fetcher } from "utils/fetcher";

type Props = {
  details: any;
};

export const ExpenseManagerCard: FC<Props> = ({ details }) => {
  return (
    <div className="bordered w-full compact rounded-md bg-white">
      <div className="flex justify-between items-center p-4">
        <h2 className="text-lg text-black">{details.name}</h2>
        <div className="flex gap-2">
          <Link href="/packages">
            <button className="btn w-24">View</button>
          </Link>
          <Link href="/settings">
            <button className="btn w-24">Settings</button>
          </Link>
        </div>
      </div>
    </div>
  );
};
