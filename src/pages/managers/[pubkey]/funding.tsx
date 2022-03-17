import type { NextPage } from "next";
import Head from "next/head";
import { FundingView } from "views";

const Funding: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Slide</title>
        <meta name="description" content="DAO Expense Management" />
      </Head>
      <FundingView />
    </div>
  );
};

export default Funding;
