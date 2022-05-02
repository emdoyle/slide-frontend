import { PublicKey } from "@solana/web3.js";

export const displayPubkey = (
  pubkey: string | PublicKey,
  previewLength: number = 4
): string => {
  let pubKeyStr;
  if (pubkey instanceof PublicKey) {
    pubKeyStr = pubkey.toString();
  } else {
    pubKeyStr = pubkey;
  }

  return `${pubKeyStr.slice(0, previewLength)}..${pubKeyStr.slice(
    -previewLength
  )}`;
};

export const displayBalance = (balance: number | null | undefined): string => {
  if (balance && Number(balance.toFixed(2))) {
    return `(Balance: ~${balance.toFixed(2)}◎)`;
  }
  return "";
};

export const capitalize = (word: string): string => {
  if (!word.length) return word;
  return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
};
