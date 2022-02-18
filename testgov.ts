import { getGovernanceAccounts, SignatoryRecord } from '@solana/spl-governance';
import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection("https://api.mainnet-beta.solana.com", 'recent');
const programId = new PublicKey('GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw');
(async function() {
  console.log(await getGovernanceAccounts(connection, programId, SignatoryRecord));
}());