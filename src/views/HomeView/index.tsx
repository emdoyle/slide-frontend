import { FC } from "react";
import { Nav } from "components";

import styles from "./index.module.css";
import { useRouter } from "next/router";

export const HomeView: FC = ({}) => {
  const router = useRouter();
  return (
    <div className="container mx-auto max-w-6xl p-8 2xl:px-0">
      <div className={styles.container}>
        <Nav />

        <div className="text-center pt-2">
          <div className="hero min-h-16 py-4">
            <div className="flex flex-col items-start text-center hero-content">
              <h1 className="mb-5 text-5xl font-bold w-full text-center">
                Welcome to Slide!
              </h1>
              <p className="mb-2 text-3xl text-left">
                Slide offers a new way to manage expenses and reimbursements for
                your DAO.
              </p>
              <p className="mb-2 text-3xl text-left">
                Spinning up a Slide{" "}
                <span
                  className="link hover:text-accent"
                  onClick={() => router.push("/managers")}
                >
                  Expense Manager
                </span>{" "}
                allows you to delegate the responsibility of managing
                reimbursements from your DAO&apos;s treasury to specific wallet
                addresses.
              </p>
              <p className="mb-2 text-3xl text-left">
                Once your DAO has voted to fund your Expense Manager and
                assigned a few Reviewers, any DAO member can submit their
                Expenses for reimbursement.
              </p>
              <p className="mb-2 text-3xl text-left">
                Slide is deeply integrated with DAO primitives from both{" "}
                <span
                  className="link hover:text-accent"
                  onClick={() =>
                    router.push("https://realms.today/realms?cluster=devnet")
                  }
                >
                  SPL Governance
                </span>{" "}
                and{" "}
                <span
                  className="link hover:text-accent"
                  onClick={() => router.push("https://app.squads.so/")}
                >
                  Squads
                </span>
                .
              </p>
              <p className="mb-2 text-3xl text-left">
                Slide will create Proposals using these tools, so that your
                DAO&apos;s existing governance process remains in control of all
                privileged actions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
