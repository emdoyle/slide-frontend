import type { NextPage } from "next";
import Head from "next/head";
import { AccessView } from "views";
import { useRouter } from "next/router";
import { ExpenseManagerNav } from "components";

const Access: NextPage = (props) => {
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
        <AccessView />
      </div>
    </div>
  );
};

export default Access;
