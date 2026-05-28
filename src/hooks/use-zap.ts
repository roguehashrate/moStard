import { useState, useCallback } from "react";
import { useActiveAccount, useEventFactory, useEventStore } from "applesauce-react/hooks";
import { kinds } from "nostr-tools";
import type { NostrEvent } from "nostr-tools";
import { map } from "rxjs/operators";
import { useObservableMemo } from "applesauce-react/hooks";

import { resolveLnurlp, createZapRequestTemplate, getZapInvoice } from "../helpers/zap";
import useAppSettings from "./use-user-app-settings";

export type ZapState = "idle" | "resolving" | "creating" | "fetching-invoice" | "paying" | "done" | "error";

export interface UseZapReturn {
  state: ZapState;
  error: string | null;
  sendZap: (params: {
    recipientPubkey: string;
    event?: NostrEvent;
    amount: number;
    comment?: string;
    payInvoice: (invoice: string) => Promise<any>;
  }) => Promise<boolean>;
}

export default function useZap(): UseZapReturn {
  const [state, setState] = useState<ZapState>("idle");
  const [error, setError] = useState<string | null>(null);
  const account = useActiveAccount();
  const factory = useEventFactory();
  const eventStore = useEventStore();
  const { writeRelays } = useAppSettings() as any;
  const userRelays = useObservableMemo(
    () => eventStore.replaceable(kinds.RelayList, account?.pubkey || "").pipe(map((e) => e?.tags?.map((t) => t[1]) || [])),
    [account?.pubkey, eventStore],
  );

  const sendZap = useCallback(
    async ({
      recipientPubkey,
      event,
      amount,
      comment = "",
      payInvoice,
    }: {
      recipientPubkey: string;
      event?: NostrEvent;
      amount: number;
      comment?: string;
      payInvoice: (invoice: string) => Promise<any>;
    }): Promise<boolean> => {
      if (!account) {
        setError("No active account");
        setState("error");
        return false;
      }

      setState("resolving");
      setError(null);

      try {
        const metadata = await new Promise<NostrEvent | null>((resolve) => {
          eventStore.replaceable(kinds.Metadata, recipientPubkey)
            .pipe(map((e) => e ?? null))
            .subscribe((e) => resolve(e));
        });

        if (!metadata) {
          setError("Could not find recipient profile");
          setState("error");
          return false;
        }

        const zapInfo = await resolveLnurlp(metadata);
        if (!zapInfo) {
          setError("Recipient does not support zaps");
          setState("error");
          return false;
        }

        setState("creating");

        const relays = userRelays?.length ? userRelays : (writeRelays || ["wss://relay.damus.io"]);
        const amountMsat = Math.round(amount * 1000);
        const zapRequestTemplate = createZapRequestTemplate(
          recipientPubkey,
          event || null,
          amountMsat,
          relays,
          comment,
          zapInfo.lnurl,
        );

        const signedZapRequest = await factory.stamp(zapRequestTemplate);
        const zapEvent = await account.signEvent(signedZapRequest);

        setState("fetching-invoice");

        const invoice = await getZapInvoice(zapInfo.callback, zapEvent, zapInfo.lnurl);
        if (!invoice) {
          setError("Failed to get invoice from LNURL service");
          setState("error");
          return false;
        }

        setState("paying");

        await payInvoice(invoice);

        setState("done");
        return true;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error sending zap";
        setError(msg);
        setState("error");
        return false;
      }
    },
    [account, factory, eventStore, userRelays, writeRelays],
  );

  return { state, error, sendZap };
}
