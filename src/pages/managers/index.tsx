import type { NextPage } from "next";
import Head from "next/head";
import { ExpenseManagerView } from "views";
import { NextPageContext } from "next";
import { SPL_GOV_PROGRAM_ID } from "@slidexyz/slide-sdk/lib/constants";
import { PublicKey } from "@solana/web3.js";

const ExpenseManagers: NextPage<{
  realmsProgramIds: string[];
}> = ({ realmsProgramIds }) => {
  return (
    <div>
      <Head>
        <title>Slide</title>
        <meta name="description" content="Expense managers" />
      </Head>
      <ExpenseManagerView
        realmsProgramIds={realmsProgramIds.map((arr) => new PublicKey(arr))}
      />
    </div>
  );
};

export default ExpenseManagers;

export async function getStaticProps(context: NextPageContext) {
  const certifiedRealmsJSONResponse = await fetch(
    "https://realms.today/realms/mainnet-beta.json"
  );
  if (!certifiedRealmsJSONResponse.ok) {
    return {
      props: { realmsProgramIds: [SPL_GOV_PROGRAM_ID.toJSON()] },
      revalidate: 60, // revalidate more often if we're getting a failing response
    };
  }
  const certifiedRealms = await certifiedRealmsJSONResponse.json();
  const realmsProgramIds = new Set();
  certifiedRealms.forEach((realm: any) => {
    if (realm.programId) {
      realmsProgramIds.add(realm.programId);
    }
  });
  return {
    props: {
      realmsProgramIds: Array.from(realmsProgramIds.values()),
    },
    revalidate: 300,
  };
}
