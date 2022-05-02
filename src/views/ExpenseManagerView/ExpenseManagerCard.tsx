import { FC } from "react";
import Link from "next/link";

import { ExpenseManagerItem } from "types";

type Props = {
  expenseManager: ExpenseManagerItem;
};

export const ExpenseManagerCard: FC<Props> = ({ expenseManager }) => {
  let balanceDisplay;
  if (expenseManager.balance && Number(expenseManager.balance.toFixed(2))) {
    balanceDisplay = `(Balance: ~${expenseManager.balance.toFixed(2)}◎)`;
  } else {
    balanceDisplay = "";
  }

  const usingSPL = Boolean(
    expenseManager.account.realm && expenseManager.account.governanceAuthority
  );

  return (
    <div
      className={`bordered w-full compact rounded-md ${
        usingSPL ? "bg-pink-100" : "bg-purple-100"
      }`}
    >
      <div className="flex justify-between items-center p-4">
        <div className="flex w-full p-4 justify-between items-center">
          <div className="flex flex-col justify-start">
            <h2 className="text-lg text-black text-left pl-1">
              {expenseManager.account.name}
            </h2>
            <span
              className={`badge badge-outline ${
                usingSPL ? "badge-secondary" : "badge-primary"
              }`}
            >
              {usingSPL ? "Realms" : "Squads"}
            </span>
          </div>
          <h2 className="text-lg text-black">{balanceDisplay}</h2>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/managers/${expenseManager.publicKey.toString()}/packages`}
          >
            <button className="btn btn-outline text-black hover:border hover:border-black hover:bg-gray-600 hover:text-white shadow-md w-24">
              Expenses
            </button>
          </Link>
          <Link
            href={`/managers/${expenseManager.publicKey.toString()}/funding`}
          >
            <button className="btn btn-outline text-black hover:border hover:border-black hover:bg-gray-600 hover:text-white shadow-md w-24">
              Funding
            </button>
          </Link>
          <Link
            href={`/managers/${expenseManager.publicKey.toString()}/access`}
          >
            <button className="btn btn-outline text-black hover:border hover:border-black hover:bg-gray-600 hover:text-white shadow-md w-24">
              Access
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};
