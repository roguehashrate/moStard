import { markFromCache } from "applesauce-core/helpers";
import { addEvents, clearDB, getEventsForFilters, IndexCache, openDB, pruneLastUsed } from "nostr-idb";
import { NostrEvent } from "nostr-tools";
import { EMPTY, from, mergeMap, tap } from "rxjs";

import localSettings from "../preferences";
import { EventCache } from "./interface";

export const indexes = new IndexCache();
export const database = await openDB();

function sanitizeEvent(event: NostrEvent): NostrEvent {
  return {
    id: event.id,
    pubkey: event.pubkey,
    created_at: event.created_at,
    kind: event.kind,
    tags: event.tags.map((t) => [...t]),
    content: event.content,
    sig: event.sig,
  };
}

export async function saveEvents(events: NostrEvent[]) {
  try {
    await addEvents(database, events.map(sanitizeEvent));
  } catch (error) {
    console.error("Failed to save events to cache", error);
  }
}

const CACHE_LOOKBACK_SECONDS = 48 * 3600; // 48 hours

const indexeddbCache: EventCache = {
  type: "nostr-idb",
  read: (filters) => {
    if (!filters || filters.length === 0) return EMPTY;
    // Cap unbounded queries (no since, no until, no ids) to prevent flooding the
    // timeline with very old cached events before fresh relay data arrives.
    const bounded = filters.map((f) => {
      if (f.ids || f.since !== undefined || f.until !== undefined) return f;
      return { ...f, since: Math.floor(Date.now() / 1000) - CACHE_LOOKBACK_SECONDS };
    });
    return from(getEventsForFilters(database, bounded, indexes)).pipe(
      mergeMap((events) => from(events)),
      tap((e) => markFromCache(e)),
    );
  },
  async write(events) {
    const sanitized = events.map(sanitizeEvent);
    try {
      for (let event of sanitized) indexes.addEventToIndexes(event);
      await addEvents(database, sanitized);
    } catch (error) {
      console.error("Failed to write events to cache", error);
    }
  },
  async clear() {
    await clearDB(database);
  },
};

// Prune the database on startup
await pruneLastUsed(database, localSettings.idbMaxEvents.value);

export default indexeddbCache;
