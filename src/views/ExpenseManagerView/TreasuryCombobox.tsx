import { BasicCombobox } from "components/BasicCombobox";
import { TreasuryWithGovernance } from "types";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export const TreasuryCombobox = ({
  treasuries,
  selectedTreasury,
  setSelectedTreasury,
  disabled,
}: {
  treasuries: TreasuryWithGovernance[];
  selectedTreasury: TreasuryWithGovernance | null;
  setSelectedTreasury: (treasury: TreasuryWithGovernance | null) => void;
  disabled: boolean;
}) => {
  const getDisplayable = (treasury: TreasuryWithGovernance | null) => {
    if (treasury) {
      const stringifiedPubkey = treasury.pubkey.toString();
      const solBalance = (treasury.account.lamports / LAMPORTS_PER_SOL).toFixed(
        2
      );
      return `${stringifiedPubkey.slice(0, 4)}...${stringifiedPubkey.slice(
        -4
      )} (${solBalance}◎)`;
    }
    return "";
  };
  const getFilterable = (treasury: TreasuryWithGovernance) => {
    const solBalance = (treasury.account.lamports / LAMPORTS_PER_SOL).toFixed(
      2
    );
    // full pubkey should be searchable
    return `${treasury.pubkey.toString()} (${solBalance}◎)`;
  };

  return (
    <BasicCombobox
      value={selectedTreasury}
      setValue={setSelectedTreasury}
      options={treasuries}
      disabled={disabled}
      getDisplayable={getDisplayable}
      getFilterable={getFilterable}
    />
  );
};
