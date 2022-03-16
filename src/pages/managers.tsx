import type { NextPage } from "next";
import Head from "next/head";
import { ExpenseManagerView } from "../views";

const Home: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>DAO Expense Management</title>
        <meta name="description" content="Expense managers" />
      </Head>
      <ExpenseManagerView />
    </div>
  );
};

export default Home;
