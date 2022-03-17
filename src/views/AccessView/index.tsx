import { FC, useEffect, useState } from "react";
import { Loader, Nav } from "components";

import styles from "./index.module.css";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSlideProgram } from "../../utils/useSlide";
import { PromptConnectWallet } from "../../components/PromptConnectWallet";
import { AccessRecordItem } from "../../types";
import { AccessRecordCard } from "./AccessRecordCard";

export const AccessView: FC = ({}) => {
  return (
    <div className="container mx-auto max-w-6xl p-8 2xl:px-0">
      <div className={styles.container}>
        <Nav />

        <div className="text-center pt-2">
          <div className="hero min-h-16 py-4">
            <div className="text-center hero-content">
              <div className="max-w-lg">
                <h1 className="mb-5 text-5xl">Expense Manager Access</h1>
                <p className="text-xl">
                  View who can approve and deny expenses
                </p>
                <div className="flex flex-col gap-2 justify-center mt-5">
                  <p className="text-xl">
                    Create Proposal to grant your wallet &apos;Reviewer&apos;
                    access
                  </p>
                  <button className="btn btn-primary">Create</button>
                </div>

                <AccessRecordContent />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AccessRecordContent = () => {
  const { connected } = useWallet();
  const { program } = useSlideProgram();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [accessRecords, setAccessRecords] = useState<any>([]);

  useEffect(() => {
    async function getAccessRecords() {
      if (program !== undefined && !isLoading) {
        setAccessRecords(await program.account.accessRecord.all());
      }
    }
    setIsLoading(true);
    getAccessRecords().finally(() => setIsLoading(false));
  }, [program?.programId]);

  if (!connected) {
    return <PromptConnectWallet />;
  }

  return (
    <div className="my-10">
      {isLoading ? (
        <div>
          <Loader />
        </div>
      ) : (
        <AccessRecordList accessRecords={accessRecords} />
      )}
    </div>
  );
};

type AccessRecordListProps = {
  accessRecords: AccessRecordItem[];
  error?: Error;
};

const AccessRecordList = ({ accessRecords }: AccessRecordListProps) => {
  return (
    <div className="flex flex-col gap-4">
      {accessRecords.map((accessRecord) => (
        <AccessRecordCard
          key={accessRecord.publicKey.toString()}
          accessRecord={accessRecord}
        />
      ))}
    </div>
  );
};
