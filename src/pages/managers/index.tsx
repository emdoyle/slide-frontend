import type { NextPage } from "next";
import Head from "next/head";
import { ExpenseManagerView } from "views";
import { NextPageContext } from "next";
import { PublicKey } from "@solana/web3.js";
import { SPL_GOV_SHARED_PROGRAM_ID } from "../../constants";

const ExpenseManagers: NextPage<{
  realmsProgramIds: Record<string, string[]>;
  cluster: string;
}> = ({ realmsProgramIds, cluster }) => {
  return (
    <div>
      <Head>
        <title>Slide</title>
        <meta name="description" content="Expense managers" />
      </Head>
      <ExpenseManagerView
        realmsProgramIds={
          realmsProgramIds[cluster]
            ? realmsProgramIds[cluster].map((arr) => new PublicKey(arr))
            : [SPL_GOV_SHARED_PROGRAM_ID]
        }
      />
    </div>
  );
};

export default ExpenseManagers;

export async function getStaticProps(context: NextPageContext) {
  const certifiedRealmsJSONEndpoints = [
    {
      key: "mainnet-beta",
      endpoint: "https://realms.today/realms/mainnet-beta.json",
    },
    { key: "devnet", endpoint: "https://realms.today/realms/devnet.json" },
  ];
  const realmsProgramIds: Record<string, string[]> = {};
  for (let i = 0; i < certifiedRealmsJSONEndpoints.length; i++) {
    const currEndpointData = certifiedRealmsJSONEndpoints[i];
    const JSONResponse = await fetch(currEndpointData.endpoint);
    if (!JSONResponse.ok) {
      realmsProgramIds[currEndpointData.key] = [
        SPL_GOV_SHARED_PROGRAM_ID.toJSON(),
      ];
    }
    const uniqueProgramIds = new Set<string>();
    const certifiedRealms = await JSONResponse.json();
    certifiedRealms.forEach((realm: any) => {
      if (realm.programId) {
        uniqueProgramIds.add(realm.programId);
      }
    });
    realmsProgramIds[currEndpointData.key] = Array.from(
      uniqueProgramIds.values()
    );
  }
  // This is the Slide custom deployment of SPL Governance on Devnet
  // This can be removed if the custom deployment DAO is certified.
  realmsProgramIds["devnet"].push(
    new PublicKey("HdQiqXnP9na6XMQs7P23g6sHkGQaR4mKmxJuCEt3ygif").toJSON()
  );

  return {
    props: {
      realmsProgramIds,
    },
    revalidate: 300,
  };
}
