import type { NextPage } from "next";
import Head from "next/head";
import { TransactionView } from "../views";

const Home: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>DAO Expense Management</title>
        <meta name="description" content="Expense packages" />
      </Head>
      <TransactionView />
    </div>
  );
};

export default Home;
