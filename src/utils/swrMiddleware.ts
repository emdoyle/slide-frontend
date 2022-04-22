import { PublicKey } from "@solana/web3.js";
import { Key, Middleware, SWRConfiguration } from "swr";

const PUBKEY_SENTINEL = "$PUBKEY$";

const serializeKey = (key: Key) => {
  let finalKey;
  if (typeof key === "function") {
    try {
      finalKey = key();
    } catch (err) {
      // dependencies not ready
      finalKey = "";
    }
  }
  if (Array.isArray(finalKey)) {
    return finalKey.map((item) =>
      item instanceof PublicKey ? `${PUBKEY_SENTINEL}${item.toString()}` : item
    );
  }
  return finalKey;
};

const deserializeKey = (key: Key) => {
  if (Array.isArray(key)) {
    return key.map((item) =>
      typeof item === "string" && item.startsWith(PUBKEY_SENTINEL)
        ? new PublicKey(item.slice(PUBKEY_SENTINEL.length))
        : item
    );
  }
  return key;
};

export const serializePubkeysForCache: Middleware = (useSWRNext: Function) => {
  return (key: Key, fetcher, config: SWRConfiguration) => {
    return useSWRNext(
      serializeKey(key),
      (...k: any[]) => {
        const finalFetcher = fetcher ?? config.fetcher;
        if (!finalFetcher) return null;
        const deserializedKey =
          k.length === 1 ? deserializeKey(k[0]) : deserializeKey(k);
        if (Array.isArray(deserializedKey)) {
          return finalFetcher(...deserializedKey);
        }
        return finalFetcher(deserializedKey);
      },
      config
    );
  };
};
