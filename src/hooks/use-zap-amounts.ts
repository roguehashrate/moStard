import { useMemo, useState, useEffect } from "react";
import { useEventStore } from "applesauce-react/hooks";
import type { NostrEvent } from "nostr-tools";
import { Subscription } from "rxjs";
import { onlyEvents } from "applesauce-relay";
import { mapEventsToStore } from "applesauce-core";

import { getZapAmountFromReceipt } from "../helpers/zap";
import pool from "../services/pool";
import { useReadRelays } from "./use-client-relays";

export interface ZapAmountInfo {
  totalSats: number;
  count: number;
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
      return { totalSats: 0, count: 0 };
    }

    let totalSats = 0;
    for (const receipt of receipts) {
      totalSats += getZapAmountFromReceipt(receipt);
    }

    return {
      totalSats: Math.round(totalSats),
      count: receipts.size,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id, eventStore, version]);
}
