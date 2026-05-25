import { ActionHub } from "applesauce-actions";
import { getInboxes, getOutboxes } from "applesauce-core/helpers";
import { kinds } from "nostr-tools";

import { eventStore } from "./event-store";
import factory from "./event-factory";
import pool from "./pool";

const actions = new ActionHub(eventStore, factory, async (event) => {
  const mailboxes = eventStore.getReplaceable(kinds.RelayList, event.pubkey);
  const outboxes = mailboxes && getOutboxes(mailboxes);

  if (!outboxes) throw new Error("Failed to get outboxes");

  const relays = new Set(outboxes);

  // Also publish to mentioned users' NIP-65 inboxes for better delivery
  const pTags = event.tags.filter((t) => t[0] === "p").map((t) => t[1]);
  if (pTags.length > 0) {
    for (const pubkey of pTags) {
      const userMailboxes = eventStore.getReplaceable(kinds.RelayList, pubkey);
      if (userMailboxes) {
        const inboxes = getInboxes(userMailboxes);
        if (inboxes) {
          for (const relay of inboxes) {
            relays.add(relay);
          }
        }
      }
    }
  }

  // publish the event
  eventStore.add(event);
  pool.publish(Array.from(relays), event);
});

export default actions;
