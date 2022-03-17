import type { NextPage } from "next";
import Head from "next/head";
import { ExpenseManagerView } from "views";

const ExpenseManagers: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Slide</title>
        <meta name="description" content="Expense managers" />
      </Head>
      <ExpenseManagerView />
    </div>
  );
};

export default ExpenseManagers;
