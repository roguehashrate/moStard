import { EventStore } from "applesauce-core";
import { isFromCache } from "applesauce-core/helpers";
import verifyEvent from "./verify-event";
import { logger } from "../helpers/debug";

export const eventStore = new EventStore();
const log = logger.extend("EventStore");

// verify all events added to the store
eventStore.verifyEvent = (event) => {
  return isFromCache(event) || verifyEvent(event);
};

// Prune old events every 2 minutes to prevent OOM on mobile
setInterval(() => {
  const pruned = eventStore.prune(5000);
  if (pruned > 0) log(`Pruned ${pruned} events from store`);
}, 120_000);

if (import.meta.env.DEV) {
  // @ts-expect-error debug
  window.eventStore = eventStore;
}
