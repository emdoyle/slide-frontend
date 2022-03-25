import { BasicCombobox } from "components/BasicCombobox";
import { RealmItem } from "types";

export const RealmsCombobox = ({
  realms,
  selectedRealm,
  setSelectedRealm,
  disabled,
  label,
}: {
  realms: RealmItem[];
  selectedRealm: RealmItem | null;
  setSelectedRealm: (realm: RealmItem | null) => void;
  disabled: boolean;
  label?: string;
}) => {
  const getDisplayable = (realm: RealmItem | null) => {
    if (realm) {
      return `${realm.account.name.trimEnd()} (${realm.pubkey
        .toString()
        .slice(0, 6)}...)`;
    }
    return "";
  };
  const getFilterable = (realm: RealmItem) => {
    // full pubkey should be searchable
    return `${realm.account.name.trimEnd()} (${realm.pubkey.toString()})`;
  };

  return (
    <BasicCombobox
      label={label ?? "Realms"}
      value={selectedRealm}
      setValue={setSelectedRealm}
      options={realms}
      disabled={disabled}
      getDisplayable={getDisplayable}
      getFilterable={getFilterable}
    />
  );
};
