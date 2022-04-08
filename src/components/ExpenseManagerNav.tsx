import Link from "next/link";
import { Nav } from "./Nav";

type Tab = {
  path: string;
  displayName: string;
};

export const ExpenseManagerNav = ({
  expensePackagePublicKey,
}: {
  expensePackagePublicKey: string | undefined;
}) => {
  const TABS: Tab[] = [
    {
      path: `/managers/${expensePackagePublicKey}/packages`,
      displayName: "Expenses",
    },
    {
      path: `/managers/${expensePackagePublicKey}/funding`,
      displayName: "Funding",
    },
    {
      path: `/managers/${expensePackagePublicKey}/access`,
      displayName: "Access",
    },
  ];
  return (
    <Nav>
      {expensePackagePublicKey && (
        <div className="tabs gap-4">
          {TABS.map((tab) => (
            <Link key={tab.displayName} href={tab.path}>
              <a
                className={`tab ${
                  window.location.pathname === tab.path
                    ? "tab-active text-white bg-gray-600 rounded"
                    : "hover:bg-gray-800 hover:rounded"
                }`}
              >
                {tab.displayName}
              </a>
            </Link>
          ))}
        </div>
      )}
    </Nav>
  );
};
