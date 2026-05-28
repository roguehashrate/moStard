import { nip47, nip04, getPublicKey, type EventTemplate } from "nostr-tools";
import { hexToBytes } from "@noble/hashes/utils";

export interface NWCConfig {
  pubkey: string;
  relay: string;
  secret: string;
}

export interface NWCResponse {
  result_type: string;
  error?: { code: string; message: string };
  result?: Record<string, unknown>;
}

export function parseNWCConnectionString(str: string): NWCConfig {
  return nip47.parseConnectionString(str);
}

export function getNWCClientPubkey(secret: string): string {
  return getPublicKey(hexToBytes(secret));
}

export function decryptNWCResponse(
  secretKey: string,
  pubkey: string,
  content: string,
): NWCResponse {
  const decrypted = nip04.decrypt(secretKey, pubkey, content);
  return JSON.parse(decrypted);
}

export async function createNWCPayInvoiceEvent(
  secretKey: Uint8Array,
  walletPubkey: string,
  invoice: string,
) {
  return nip47.makeNwcRequestEvent(walletPubkey, secretKey, invoice);
}

export async function fetchNWCInfo(
  secretKey: Uint8Array,
  walletPubkey: string,
): Promise<EventTemplate> {
  const content = JSON.stringify({ method: "get_info", params: {} });
  const encryptedContent = nip04.encrypt(secretKey, walletPubkey, content);
  return {
    kind: 23194,
    created_at: Math.round(Date.now() / 1000),
    content: encryptedContent,
    tags: [["p", walletPubkey]],
  };
}
