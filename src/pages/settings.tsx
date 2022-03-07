import type { NextPage } from "next";
import Head from "next/head";
import { SettingsView } from "../views";

const Settings: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Slide</title>
        <meta
          name="description"
          content="DAO Expense Management"
        />
      </Head>
      <SettingsView />
    </div>
  );
};

export default Settings;
