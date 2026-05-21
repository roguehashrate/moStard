import { Card, CardProps, Flex, LinkBox, Spacer, Text } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import { nip25 } from "nostr-tools";
import { ContentSettingsProvider } from "../../../providers/local/content-settings";
import DebugEventButton from "../../debug-modal/debug-event-button";
import ReactionIcon from "../../event-reactions/reaction-icon";
import { NoteLink } from "../../note/note-link";
import Timestamp from "../../timestamp";
import UserAvatarLink from "../../user/user-avatar-link";
import UserLink from "../../user/user-link";
import { getTagValue } from "applesauce-core/helpers";

export default function EmbeddedReaction({ event, ...props }: Omit<CardProps, "children"> & { event: NostrEvent }) {
  const isKind30 = event.kind === 30;

  // Kind 7 uses nip25, kind 30 uses the "e" tag directly
  const pointer = isKind30 ? { id: getTagValue(event, "e") || "" } : nip25.getReactedEventPointer(event);

  // Kind 30 content is wrapped in colons, strip them for display
  const emoji = isKind30 ? event.content.replace(/^:+|:+$/g, "") : event.content;

  return (
    <ContentSettingsProvider event={event}>
      <Card as={LinkBox} {...props}>
        <Flex p="2" gap="2" alignItems="center">
          <UserAvatarLink pubkey={event.pubkey} size="xs" />
          <UserLink pubkey={event.pubkey} fontWeight="bold" isTruncated fontSize="lg" />
          <Text as="span">Reacted with</Text>
          <ReactionIcon emoji={emoji} url={event.tags.find((t) => t[0] === "emoji")?.[2]} />
          <Text as="span">to</Text>
          {pointer?.id && <NoteLink noteId={pointer.id} />}
          <Spacer />
          <Timestamp timestamp={event.created_at} />
          <DebugEventButton event={event} variant="ghost" size="xs" />
        </Flex>
      </Card>
    </ContentSettingsProvider>
  );
}
