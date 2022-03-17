import type { NextPage } from "next";
import Head from "next/head";
import { ExpensePackageView } from "views";

const ExpensePackages: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Slide</title>
        <meta name="description" content="Expense packages" />
      </Head>
      <ExpensePackageView />
    </div>
  );
};

export default ExpensePackages;
