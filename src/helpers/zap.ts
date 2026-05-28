import { nip57, type EventTemplate, type NostrEvent } from "nostr-tools";
import { bech32 } from "@scure/base";

export interface LnurlpResponse {
  callback: string;
  minSendable: number;
  maxSendable: number;
  allowsNostr?: boolean;
  nostrPubkey?: string;
  commentAllowed?: number;
  metadata: string;
  tag: string;
  status: "OK" | "ERROR";
}

export interface ZapInfo {
  callback: string;
  minSendable: number;
  maxSendable: number;
  commentAllowed: number;
  nostrPubkey: string;
  lnurl: string;
}

export async function resolveLnurlp(
  metadata: NostrEvent,
): Promise<ZapInfo | null> {
  let lnurlUrl: string;
  let lnurlValue: string;
  try {
    const parsed = JSON.parse(metadata.content);
      if (parsed.lud06) {
        const decoded = bech32.decode(parsed.lud06, 1000);
      const data = bech32.fromWords(decoded.words);
      const decoder = new TextDecoder();
      lnurlUrl = decoder.decode(data);
      lnurlValue = parsed.lud06;
    } else if (parsed.lud16) {
      const [name, domain] = parsed.lud16.split("@");
      lnurlUrl = new URL(`/.well-known/lnurlp/${name}`, `https://${domain}`).toString();
      lnurlValue = parsed.lud16;
    } else {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const res = await fetch(lnurlUrl);
    const body: LnurlpResponse = await res.json();
    if (body.status === "ERROR" || !body.allowsNostr || !body.nostrPubkey) return null;

    return {
      callback: body.callback,
      minSendable: body.minSendable,
      maxSendable: body.maxSendable,
      commentAllowed: body.commentAllowed ?? 0,
      nostrPubkey: body.nostrPubkey,
      lnurl: lnurlValue,
    };
  } catch {
    return null;
  }
}

export function createZapRequestTemplate(
  profile: string,
  event: NostrEvent | null,
  amount: number,
  relays: string[],
  comment: string,
  lnurl: string,
): EventTemplate {
  const template = nip57.makeZapRequest({
    profile,
    event,
    amount,
    relays,
    comment: comment || "",
  });
  template.tags.push(["lnurl", lnurl]);
  return template;
}

export async function getZapInvoice(
  callback: string,
  zapRequest: NostrEvent,
  lnurl: string,
): Promise<string | null> {
  const params = new URLSearchParams({
    amount: zapRequest.tags?.find(([t]) => t === "amount")?.[1] || "0",
    nostr: JSON.stringify(zapRequest),
    lnurl,
  });

  const comment = zapRequest.content;
  if (comment) {
    params.set("comment", comment);
  }

  try {
    const url = `${callback}?${params.toString()}`;
    const res = await fetch(url);
    const body = await res.json();

    if (body.status === "ERROR" || !body.pr) {
      return null;
    }

    return body.pr;
  } catch {
    return null;
  }
}

export function getSatsFromBolt11(bolt11: string): number {
  return nip57.getSatoshisAmountFromBolt11(bolt11);
}

export function getZapAmountFromReceipt(receipt: NostrEvent): number {
  const bolt11Tag = receipt.tags?.find(([t]) => t === "bolt11");
  if (!bolt11Tag) return 0;
  return nip57.getSatoshisAmountFromBolt11(bolt11Tag[1]);
}
