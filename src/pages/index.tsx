import type { NextPage } from "next";
import Head from "next/head";
import { HomeView } from "../views";
import { constants } from "@slidexyz/slide-sdk";

const Home: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Slide</title>
        <meta
          name="description"
          content={`DAO Expense Management ${constants.SQUADS_PROGRAM_ID}`}
        />
      </Head>
      <HomeView />
    </div>
  );
};

export default Home;
