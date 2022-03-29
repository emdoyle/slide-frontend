import type { NextPage } from "next";
import Head from "next/head";
import { FundingView } from "views";
import { ExpenseManagerNav } from "components";
import { useRouter } from "next/router";

const Funding: NextPage = (props) => {
  const router = useRouter();
  const query = router.query;
  return (
    <div>
      <Head>
        <title>Slide</title>
        <meta name="description" content="DAO Expense Management" />
      </Head>
      <div className="container mx-auto max-w-6xl p-8 2xl:px-0">
        <ExpenseManagerNav expensePackagePublicKey={query?.pubkey as string} />
        <FundingView />
      </div>
    </div>
  );
};

export default Funding;
