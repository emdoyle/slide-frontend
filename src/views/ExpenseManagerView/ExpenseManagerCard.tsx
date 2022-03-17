import { FC } from "react";
import Link from "next/link";

import { ExpenseManager } from "types";

type Props = {
  expenseManager: ExpenseManager;
};

export const ExpenseManagerCard: FC<Props> = ({ expenseManager }) => {
  return (
    <div className="bordered w-full compact rounded-md bg-white">
      <div className="flex justify-between items-center p-4">
        <h2 className="text-lg text-black">{expenseManager.name}</h2>
        <div className="flex gap-2">
          {/* TODO: need to pass a route parameter with the expenseManager pubkey
                or somehow get that data into the route (long string for the URL) */}
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
