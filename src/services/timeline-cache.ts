import { LRU } from "applesauce-core/helpers";
import { TimelessFilter } from "applesauce-loaders";
import { createTimelineLoader, TimelineLoader } from "applesauce-loaders/loaders";
import hash_sum from "hash-sum";

import { logger } from "../helpers/debug";
import { cacheRequest } from "./event-cache";
import { eventStore } from "./event-store";
import pool from "./pool";

const MAX_CACHE = 30;
const TTL = 5 * 60 * 1000; // 5 minutes
const BATCH_LIMIT = 100;

class TimelineCacheService {
  protected timelines = new LRU<TimelineLoader>(MAX_CACHE, TTL);
  protected log = logger.extend("TimelineCacheService");

  createTimeline(key: string, relays: string[], filters: TimelessFilter[]) {
    // Derive internal key from key + filters hash + relays hash to bust cache on filter/relay changes
    const internalKey = `${key}-${hash_sum(filters)}-${hash_sum(relays)}`;

    let timeline = this.timelines.get(internalKey);

    if (!timeline && relays.length > 0 && filters.length > 0) {
      this.log(`Creating ${internalKey}`);
      timeline = createTimelineLoader(pool, relays, filters, {
        limit: BATCH_LIMIT,
        cache: cacheRequest,
        eventStore,
      });
      this.timelines.set(internalKey, timeline);
    }

    return timeline;
  }
}

const timelineCacheService = new TimelineCacheService();

if (import.meta.env.DEV) {
  //@ts-ignore
  window.timelineCacheService = timelineCacheService;
}

export default timelineCacheService;
