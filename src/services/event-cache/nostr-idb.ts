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

const indexeddbCache: EventCache = {
  type: "nostr-idb",
  read: (filters) => {
    if (!filters || filters.length === 0) return EMPTY;
    return from(getEventsForFilters(database, filters, indexes)).pipe(
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
