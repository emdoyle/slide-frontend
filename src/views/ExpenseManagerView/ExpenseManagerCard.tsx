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
            <h2 className="text-lg text-black">
              {expenseManager.account.name}
            </h2>
            <span
              className={`badge badge-outline ${
                usingSPL ? "badge-secondary" : "badge-primary"
              }`}
            >
              {usingSPL ? "SPL Gov" : "Squads"}
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
