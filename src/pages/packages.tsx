import type { NextPage } from "next";
import Head from "next/head";
import { ExpensePackageView } from "../views";

const Home: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>DAO Expense Management</title>
        <meta name="description" content="Expense packages" />
      </Head>
      <ExpensePackageView />
    </div>
  );
};

export default Home;
