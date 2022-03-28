import { FC } from "react";
import { AccessRecordItem } from "types";
import { displayPubkey } from "utils/formatting";

type Props = {
  accessRecord: AccessRecordItem;
};

export const AccessRecordCard: FC<Props> = ({ accessRecord }) => {
  return (
    <div className="bordered w-full compact rounded-md bg-white">
      <div className="flex w-full p-4 justify-between items-between">
        <h2 className="text-lg text-black">
          {displayPubkey(accessRecord.account.user, 6)}
        </h2>
        {accessRecord.account.role.reviewer && (
          <p className="text-black">Reviewer</p>
        )}
        {accessRecord.account.role.admin && <p className="text-black">Admin</p>}
      </div>
    </div>
  );
};
