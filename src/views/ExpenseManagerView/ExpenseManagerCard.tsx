import { FC } from "react";
import Link from "next/link";

import { ExpenseManagerItem } from "types";
import { useBalance } from "utils/useBalance";

type Props = {
  expenseManager: ExpenseManagerItem;
};

export const ExpenseManagerCard: FC<Props> = ({ expenseManager }) => {
  const { balance: managerBalance } = useBalance(expenseManager.publicKey);
  let balanceDisplay;
  if (managerBalance) {
    balanceDisplay = `(Balance: ~${managerBalance.toFixed(2)}◎)`;
  } else {
    balanceDisplay = "";
  }
  return (
    <div className="bordered w-full compact rounded-md bg-white">
      <div className="flex justify-between items-center p-4">
        <div className="flex w-full p-4 justify-between items-between">
          <h2 className="text-lg text-black">{expenseManager.account.name}</h2>
          <h2 className="text-lg text-black">{balanceDisplay}</h2>
        </div>
        <div className="flex gap-2">
          {/* TODO: need to pass a route parameter with the expenseManager pubkey
                or somehow get that data into the route (long string for the URL) */}
          <Link href="/packages">
            <button className="btn w-24">Expenses</button>
          </Link>
          <Link href="/funding">
            <button className="btn w-24">Funding</button>
          </Link>
        </div>
      </div>
    </div>
  );
};
