import type { NextPage } from "next";
import Head from "next/head";
import { ExpensePackageView } from "views";
import { ExpenseManagerNav, Nav } from "components";
import { useRouter } from "next/router";

const ExpensePackages: NextPage = (props) => {
  const router = useRouter();
  const query = router.query;
  return (
    <div>
      <Head>
        <title>Slide</title>
        <meta name="description" content="Expense packages" />
      </Head>
      <div className="container mx-auto max-w-6xl p-8 2xl:px-0">
        <ExpenseManagerNav expensePackagePublicKey={query?.pubkey as string} />
        <ExpensePackageView />
      </div>
    </div>
  );
};

export default ExpensePackages;
