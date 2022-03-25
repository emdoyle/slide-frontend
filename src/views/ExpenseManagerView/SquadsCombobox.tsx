import { SquadItem } from "@slidexyz/squads-sdk";
import { BasicCombobox } from "components/BasicCombobox";

export const SquadsCombobox = ({
  squads,
  selectedSquad,
  setSelectedSquad,
  disabled,
}: {
  squads: SquadItem[];
  selectedSquad: SquadItem | null;
  setSelectedSquad: (squad: SquadItem | null) => void;
  disabled: boolean;
}) => {
  const getDisplayable = (squad: SquadItem | null) => {
    if (squad) {
      return `${squad.account.squadName.trimEnd()} (${squad.pubkey
        .toString()
        .slice(0, 6)}...)`;
    }
    return "";
  };
  const getFilterable = (squad: SquadItem) => {
    // full pubkey should be searchable
    return `${squad.account.squadName.trimEnd()} (${squad.pubkey.toString()})`;
  };

  return (
    <BasicCombobox
      value={selectedSquad}
      setValue={setSelectedSquad}
      options={squads}
      disabled={disabled}
      getDisplayable={getDisplayable}
      getFilterable={getFilterable}
    />
  );
};
