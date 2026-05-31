import { useMemo, useState, useEffect } from "react";
import { useEventStore } from "applesauce-react/hooks";
import type { NostrEvent } from "nostr-tools";
import { Subscription } from "rxjs";
import { onlyEvents } from "applesauce-relay";
import { mapEventsToStore } from "applesauce-core";

import { getZapAmountFromReceipt } from "../helpers/zap";
import pool from "../services/pool";
import { useReadRelays } from "./use-client-relays";

export interface ZapReceiptInfo {
  pubkey: string;
  amount: number;
  comment?: string;
  created_at: number;
}

export interface ZapAmountInfo {
  totalSats: number;
  count: number;
  zapperPubkeys: Set<string>;
  zaps: ZapReceiptInfo[];
}

export default function useZapAmounts(event: NostrEvent, relays?: string[]): ZapAmountInfo {
  const eventStore = useEventStore();
  const [version, setVersion] = useState(0);
  const readRelays = useReadRelays();
  const targetRelays = relays ?? readRelays;

  useEffect(() => {
    const sub = new Subscription();

    sub.add(
      pool.subscription(targetRelays, [{ kinds: [9735], "#e": [event.id] }]).pipe(
        onlyEvents(),
        mapEventsToStore(eventStore),
      ).subscribe(),
    );

    sub.add(
      eventStore.insert$.subscribe((e) => {
        if (
          e.kind === 9735 &&
          e.tags?.some(([t, v]) => t === "e" && v === event.id)
        ) {
          setVersion((v) => v + 1);
        }
      }),
    );
    return () => sub.unsubscribe();
  }, [event.id, eventStore, targetRelays]);

  return useMemo(() => {
    const receipts = eventStore.getByFilters([
      { kinds: [9735], "#e": [event.id] },
    ]);

    if (!receipts || receipts.size === 0) {
      return { totalSats: 0, count: 0, zapperPubkeys: new Set<string>(), zaps: [] };
    }

    let totalSats = 0;
    const zapperPubkeys = new Set<string>();
    const zaps: ZapReceiptInfo[] = [];
    for (const receipt of receipts) {
      const amount = getZapAmountFromReceipt(receipt);
      totalSats += amount;
      const sender = receipt.tags?.find(([t]) => t === "P");
      const pubkey = sender?.[1];
      if (pubkey) {
        zapperPubkeys.add(pubkey);
        let comment: string | undefined;
        const desc = receipt.tags?.find(([t]) => t === "description");
        if (desc?.[1]) {
          try {
            const zapRequest = JSON.parse(desc[1]);
            if (zapRequest.content) comment = zapRequest.content;
          } catch {}
        }
        zaps.push({ pubkey, amount: Math.round(amount), comment, created_at: receipt.created_at });
      }
    }

    return {
      totalSats: Math.round(totalSats),
      count: receipts.size,
      zapperPubkeys,
      zaps,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id, eventStore, version]);
}
