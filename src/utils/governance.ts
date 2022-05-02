import { GovernanceAccountType } from "@solana/spl-governance";

export function govAccountToRPCEnum(
  accountType: GovernanceAccountType
): Record<string, {}> {
  if (
    accountType === GovernanceAccountType.GovernanceV1 ||
    accountType === GovernanceAccountType.GovernanceV2
  ) {
    return { account: {} };
  } else if (
    accountType === GovernanceAccountType.TokenGovernanceV1 ||
    accountType === GovernanceAccountType.TokenGovernanceV2
  ) {
    return { token: {} };
  } else if (
    accountType === GovernanceAccountType.MintGovernanceV1 ||
    accountType === GovernanceAccountType.MintGovernanceV2
  ) {
    return { mint: {} };
  } else if (
    accountType === GovernanceAccountType.ProgramGovernanceV1 ||
    accountType === GovernanceAccountType.ProgramGovernanceV2
  ) {
    return { program: {} };
  }
  throw new Error("Account type given was not a governance account.");
}
