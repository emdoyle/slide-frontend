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

export const capitalize = (word: string): string => {
  if (!word.length) return word;
  return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
};
