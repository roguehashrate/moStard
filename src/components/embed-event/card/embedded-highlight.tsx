import type { NostrEvent } from "nostr-tools";
import HighlightCard from "../../highlight/highlight-card";

export default function EmbeddedHighlight({ event, ...props }: { event: NostrEvent }) {
  return <HighlightCard event={event} {...props} />;
}
