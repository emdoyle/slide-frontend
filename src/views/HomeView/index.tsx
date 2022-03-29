import { FC } from "react";
import Link from "next/link";
import { Nav } from "components";

import styles from "./index.module.css";
import { useRouter } from "next/router";
import { LightBulbIcon } from "@heroicons/react/outline";
import { AcademicCapIcon } from "@heroicons/react/solid";

export const HomeView: FC = ({}) => {
  const router = useRouter();
  return (
    <div className="container mx-auto max-w-6xl p-8 2xl:px-0">
      <div className={styles.container}>
        <Nav />

        <div className="text-center pt-2">
          <div className="hero min-h-16 py-4">
            <div className="flex flex-col items-start text-center hero-content">
              <h1 className="mb-2 text-6xl font-bold w-full text-center text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-pink-500 via-violet-800 animate-gradient-x">
                Expenses, Simplified
              </h1>
              <div className="flex w-full justify-center items-center">
                <p className="mb-2 text-2xl w-1/2 text-center">
                  Slide offers a new way for your DAO to manage expenses and
                  reimbursements.
                </p>
              </div>
              <div className="mb-4 flex w-full justify-center items-center">
                <Link href="/managers">
                  <button className="btn text-white bg-gradient-to-tl from-blue-400 to-pink-500 via-violet-800 hover:scale-105 hover:shadow-md">
                    Get Started
                  </button>
                </Link>
              </div>
              <div className="mb-10 card text-black bg-gray-200 w-2/3 m-auto shadow-xl">
                <div className="card-body">
                  <div className="flex items-center gap-6">
                    <span>
                      <LightBulbIcon className="w-16 h-16" />
                    </span>
                    <p className="mb-2 text-3xl">
                      Spinning up a Slide{" "}
                      <span
                        className="link hover:text-accent"
                        onClick={() => router.push("/managers")}
                      >
                        Expense Manager
                      </span>{" "}
                      allows you to handle day-to-day payments and
                      reimbursements without needing the whole DAO to vote every
                      time.
                    </p>
                  </div>
                </div>
              </div>
              <br />
              <div className="flex gap-4 items-center">
                <AcademicCapIcon className="w-16 h-16" />
                <h3 className="mb-2 text-4xl font-semibold text-left">
                  How it works
                </h3>
              </div>
              <div className="mb-10 w-full flex justify-between items-center">
                <div className="card text-black bg-gray-200 w-2/3 shadow-xl">
                  <div className="card-body">
                    <p className="text-3xl text-left">
                      Once your DAO has voted to fund your Expense Manager and
                      assigned a few Reviewers, any DAO member can submit their
                      Expenses for reimbursement.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mb-10 w-full flex justify-between items-center">
                <div />
                <div className="card text-black bg-gray-200 w-2/3 shadow-xl">
                  <div className="card-body">
                    <p className="text-3xl text-left">
                      Slide is deeply integrated with DAO primitives from both{" "}
                      <span
                        className="link hover:text-accent"
                        onClick={() =>
                          router.push(
                            "https://realms.today/realms?cluster=devnet"
                          )
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
                  </div>
                </div>
              </div>
              <div className="mb-10 w-full flex justify-between items-center">
                <div className="card text-black bg-gray-200 w-2/3 shadow-xl">
                  <div className="card-body">
                    <p className="text-3xl text-left">
                      Slide will create Proposals using these tools, so that
                      your DAO&apos;s existing governance process remains in
                      control of all privileged actions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
