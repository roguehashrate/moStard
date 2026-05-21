import { Model } from "applesauce-core";
import { defer, ignoreElements, mergeWith } from "rxjs";
import { customReactionsLoader } from "../services/loaders";
import { NostrEvent } from "nostr-tools";
import { isReplaceable, getEventUID } from "applesauce-core/helpers";

export function ReactionsQuery(event: NostrEvent, relays?: string[]): Model<NostrEvent[]> {
  return (events) =>
    defer(() => customReactionsLoader(event, relays)).pipe(
      ignoreElements(),
      mergeWith(
        events.timeline(
          isReplaceable(event.kind)
            ? [
                { kinds: [7, 30], "#e": [event.id] },
                { kinds: [7, 30], "#a": [getEventUID(event)] },
              ]
            : [{ kinds: [7, 30], "#e": [event.id] }],
        ),
      ),
    );
}
