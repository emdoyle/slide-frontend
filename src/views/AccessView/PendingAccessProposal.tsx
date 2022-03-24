import {
  getSquadMintAddressAndBump,
  ProposalItem,
  SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
} from "@slidexyz/squads-sdk";
import { ExpenseManagerItem } from "types";
import { FC, useState } from "react";
import { Program } from "@project-serum/anchor";
import { Slide } from "@slidexyz/slide-sdk";
import { PublicKey } from "@solana/web3.js";
import { getAccessRecordAddressAndBump } from "@slidexyz/slide-sdk/lib/address";
import { Loader } from "../../components";
import { useSlideProgram } from "../../utils/useSlide";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAlert } from "react-alert";

type Props = {
  proposal: ProposalItem;
  expenseManager: ExpenseManagerItem;
};

const executeAccessProposal = async (
  program: Program<Slide>,
  user: PublicKey,
  proposal: ProposalItem,
  expenseManager: ExpenseManagerItem
): Promise<string | undefined> => {
  const [accessRecord] = getAccessRecordAddressAndBump(
    program.programId,
    expenseManager.publicKey,
    user
  );
  const [squadMint] = await getSquadMintAddressAndBump(
    SQUADS_CUSTOM_DEVNET_PROGRAM_ID,
    proposal.account.squad
  );
  await program.methods
    .squadsExecuteAccessProposal()
    .accounts({
      proposal: proposal.pubkey,
      accessRecord,
      expenseManager: expenseManager.publicKey,
      squad: proposal.account.squad,
      squadMint,
      member: user,
      signer: user,
    })
    .rpc();
  return `Access Proposal: ${proposal} executed! User: ${user.toString()} should now have access`;
};

export const PendingAccessProposal: FC<Props> = ({
  proposal,
  expenseManager,
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
        proposal,
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
        <h2 className="text-lg text-black">
          {proposal.account.title.trimEnd()}
        </h2>
        {isLoading && (
          <div>
            <Loader noText color="black" />
          </div>
        )}
        {/* TODO: More state logic (failed, executed) */}
        {/* Slightly complicated because the execution happens on slide... */}
        {/* Is there any protection against multiple execution? */}
        {/* Withdraw absolutely is a problem */}
        {!isLoading && proposal.account.executeReady ? (
          <button
            className="btn w-24"
            onClick={() => {
              executeProposal();
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
