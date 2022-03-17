import type { NextPage } from "next";
import Head from "next/head";
import { AccessView } from "views";

const Access: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Slide</title>
        <meta name="description" content="DAO Expense Management" />
      </Head>
      <AccessView />
    </div>
  );
};

export default Access;
