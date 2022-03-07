import type { NextPage } from "next";
import Head from "next/head";
import { TransactionView } from "../views";

const Home: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>DAO Expense Management</title>
        <meta name="description" content="This site will fly high 🦤" />
      </Head>
      <TransactionView />
    </div>
  );
};

export default Home;
