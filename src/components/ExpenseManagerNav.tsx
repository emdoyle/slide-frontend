import Link from "next/link";
import { Nav } from "./Nav";

export const ExpenseManagerNav = ({
  expensePackagePublicKey,
}: {
  expensePackagePublicKey: string | undefined;
}) => {
  return (
    <Nav>
      {expensePackagePublicKey && (
        <div className="tabs">
          <Link href={`/managers/${expensePackagePublicKey}/packages`}>
            <a className="tab text-white">Expenses</a>
          </Link>
          <Link href={`/managers/${expensePackagePublicKey}/funding`}>
            <a className="tab text-white">Funding</a>
          </Link>
          <Link href={`/managers/${expensePackagePublicKey}/access`}>
            <a className="tab text-white">Access</a>
          </Link>
        </div>
      )}
    </Nav>
  );
};
