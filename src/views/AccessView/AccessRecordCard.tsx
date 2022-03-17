import { FC } from "react";
import { AccessRecordItem } from "types";

type Props = {
  accessRecord: AccessRecordItem;
};

export const AccessRecordCard: FC<Props> = ({ accessRecord }) => {
  // TODO: make this look much nicer
  return (
    <div className="bordered w-full compact rounded-md bg-white">
      <div className="flex justify-between items-center p-4">
        <div className="flex w-full p-4 justify-between items-between">
          <h2 className="text-lg text-black">
            {accessRecord.account.user.toString()}
          </h2>
        </div>
      </div>
    </div>
  );
};
