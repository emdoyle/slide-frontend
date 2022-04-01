import {
  getSquadMintAddressAndBump,
  SQUADS_PROGRAM_ID,
} from "@slidexyz/squads-sdk";
import { ExpenseManagerItem, ProposalInfo } from "types";
import { FC, useState } from "react";
import { Program } from "@project-serum/anchor";
import { Slide } from "@slidexyz/slide-sdk";
import { PublicKey } from "@solana/web3.js";
import {
  getAccessRecordAddressAndBump,
  getProposalExecutionAddressAndBump,
} from "@slidexyz/slide-sdk/lib/address";
import { Loader } from "components";
import { useSlideProgram } from "utils/useSlide";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAlert } from "react-alert";
import { overflowEllipses, overflowEllipsesPerLine } from "utils/proposals";

type Props = {
  proposal: ProposalInfo;
  expenseManager: ExpenseManagerItem;
  // TODO: need to do some state rearranging to get this - SWR abstraction might
  //  be worth it if there is caching by key/manual invalidation etc.
  refetchAccessRecords?: () => void;
};

const executeAccessProposal = async (
  program: Program<Slide>,
  user: PublicKey,
  proposal: PublicKey,
  expenseManager: ExpenseManagerItem
): Promise<string | undefined> => {
  if (expenseManager.account.squad) {
    const [accessRecord] = getAccessRecordAddressAndBump(
      program.programId,
      expenseManager.publicKey,
      user
    );
    const [proposalExecution] = getProposalExecutionAddressAndBump(
      program.programId,
      expenseManager.publicKey,
      proposal
    );
    const [squadMint] = await getSquadMintAddressAndBump(
      SQUADS_PROGRAM_ID,
      expenseManager.account.squad
    );
    await program.methods
      .squadsExecuteAccessProposal()
      .accounts({
        proposal,
        accessRecord,
        expenseManager: expenseManager.publicKey,
        squad: expenseManager.account.squad,
        squadMint,
        proposalExecution,
        member: user,
        signer: user,
      })
      .rpc();
    return `Access Proposal executed!`;
  }
};

export const PendingAccessProposal: FC<Props> = ({
  proposal,
  expenseManager,
  refetchAccessRecords,
}) => {
  const Alert = useAlert();
  const { program } = useSlideProgram();
  const { publicKey: userPublicKey } = useWallet();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const executeProposal = async () => {
    if (!program || !userPublicKey) {
      Alert.show("Please connect your wallet");
      return;
    }
    setIsLoading(true);
    try {
      const alertText = await executeAccessProposal(
        program,
        userPublicKey,
        proposal.pubkey,
        expenseManager
      );
      Alert.show(alertText);
    } catch (err) {
      if (err instanceof Error) {
        Alert.error(err.message);
      } else {
        Alert.error("An unknown error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bordered w-full compact rounded-md bg-white">
      <div className="flex justify-between items-center p-4">
        <div className="flex justify-start items-center p-4">
          {proposal.description.trimEnd() ? (
            <div
              className="tooltip"
              data-tip={overflowEllipsesPerLine(proposal.description, 30)}
            >
              <h2 className="text-lg text-black">
                {overflowEllipses(proposal.title.trimEnd(), 50)}
              </h2>
            </div>
          ) : (
            <h2 className="text-lg text-black">
              {overflowEllipses(proposal.title.trimEnd(), 50)}
            </h2>
          )}
        </div>
        {isLoading && (
          <div>
            <Loader noText color="black" />
          </div>
        )}
        {/* TODO: More state logic (failed) */}
        {!isLoading && proposal.executeReady ? (
          <button
            className="btn w-24"
            onClick={() => {
              executeProposal().then(() => {
                if (refetchAccessRecords) {
                  refetchAccessRecords();
                }
              });
            }}
          >
            Execute
          </button>
        ) : (
          <button className="btn btn-outline btn-disabled w-24">Pending</button>
        )}
      </div>
    </div>
  );
};
