import type { NostrEvent } from "nostr-tools";
import PollCard from "../../poll/poll-card";

export default function EmbeddedPoll({ event, ...props }: { event: NostrEvent }) {
  return <PollCard event={event} {...props} />;
}
