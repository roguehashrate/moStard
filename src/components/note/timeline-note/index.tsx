import {
  Box,
  ButtonGroup,
  Flex,
  IconButton,
  Link,
  useDisclosure,
} from "@chakra-ui/react";
import type { NostrEvent } from "nostr-tools";
import { memo, type ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";

import { getThreadReferences } from "../../../helpers/nostr/event";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import useAppSettings from "../../../hooks/use-user-app-settings";
import { useBreakpointValue } from "../../../providers/global/breakpoint-provider";
import { ExpandProvider } from "../../../providers/local/expanded";
import { ContentSettingsProvider } from "../../../providers/local/content-settings";
import { getSharableEventAddress } from "../../../services/relay-hints";
import ReplyForm from "../../../views/thread/components/reply-form";
import { ReplyIcon } from "../../icons";
import POWIcon from "../../pow/pow-icon";
import Timestamp from "../../timestamp";
import UserAvatarLink from "../../user/user-avatar-link";
import UserLink from "../../user/user-link";
import EventTipButton from "../../tip/event-tip-button";
import EventZapButton from "../../zap/event-zap-button";
import BookmarkEventButton from "../bookmark-button";
import EventQuoteButton from "../event-quote-button";
import NoteMenu from "../note-menu";
import NotePublishedUsing from "../note-published-using";
import ShowMoreContainer from "../show-more-container";
import EventShareButton from "./components/event-share-button";
import NoteProxyLink from "./components/note-proxy-link";
import NoteReactions from "./components/note-reactions";
import ZapReactions from "./components/zap-reactions";
import ReplyContext from "./components/reply-context";
import NoteContentWithWarning from "./note-content-with-warning";

export type TimelineNoteProps = {
  event: NostrEvent;
  variant?: string;
  showReplyButton?: boolean;
  showReplyLine?: boolean;
  hideDrawerButton?: boolean;
  registerIntersectionEntity?: boolean;
  clickable?: boolean;
  body?: ReactNode;
  showMore?: boolean;
};
export function TimelineNote({
  event,
  showReplyButton,
  showReplyLine = true,
  registerIntersectionEntity = true,
  body,
  showMore = true,
}: TimelineNoteProps) {
  const { showReactions } = useAppSettings();
  const replyForm = useDisclosure();

  const ref = useEventIntersectionRef(event);

  const showReactionsOnNewLine = useBreakpointValue({ base: true, lg: false });

  const reactionButtons = showReactions && (
    <NoteReactions event={event} flexWrap="wrap" variant="ghost" size="sm" />
  );

  return (
    <ContentSettingsProvider event={event}>
      <ExpandProvider>
        <Flex
          direction="column"
          px="4"
          pt="3"
          pb="2"
          borderBottomWidth="0.5px"
          borderBottomColor="chakra-border-color"
          ref={registerIntersectionEntity ? ref : undefined}
          data-event-id={event.id}
        >
          <Flex gap="3" alignItems="center" mb="1">
            <UserAvatarLink pubkey={event.pubkey} size="md" />
            <Box flex="1" minW="0">
              <Flex alignItems="center" gap="2">
                <UserLink pubkey={event.pubkey} isTruncated fontWeight="semibold" fontSize="sm" />
                <Link
                  as={RouterLink}
                  whiteSpace="nowrap"
                  color="chakra-subtle-text"
                  fontSize="xs"
                  to={`/n/${getSharableEventAddress(event)}`}
                  flexShrink={0}
                >
                  <Timestamp timestamp={event.created_at} />
                </Link>
              </Flex>
              {showReplyLine && <ReplyContext event={event} />}
            </Box>
            <POWIcon event={event} boxSize={3.5} />
            <NotePublishedUsing event={event} />
            <NoteMenu event={event} aria-label="More options" />
          </Flex>
          <Box pl="0" mb="1">
            {showMore ? (
              <ShowMoreContainer>
                {body ?? <NoteContentWithWarning event={event} />}
              </ShowMoreContainer>
            ) : (
              body ?? <NoteContentWithWarning event={event} />
            )}
          </Box>
          {showReactionsOnNewLine && reactionButtons && (
            <Box mb="1">{reactionButtons}</Box>
          )}
          <ZapReactions event={event} />
          <Flex gap="2" alignItems="center" pt="1" wrap="wrap">
            <ButtonGroup size="sm" variant="ghost" spacing={0}>
              {showReplyButton && (
                <IconButton icon={<ReplyIcon />} aria-label="Reply" title="Reply" onClick={replyForm.onOpen} minW="36px" minH="36px" />
              )}
              <EventShareButton event={event} />
              <EventQuoteButton event={event} />
              <EventTipButton event={event} />
              <EventZapButton event={event} />
            </ButtonGroup>
            {!showReactionsOnNewLine && reactionButtons}
            <Box flexGrow={1} />
            <ButtonGroup size="sm" variant="ghost" spacing={0}>
              <NoteProxyLink event={event} />
              <BookmarkEventButton event={event} aria-label="Bookmark note" />
            </ButtonGroup>
          </Flex>
        </Flex>
      </ExpandProvider>
      {replyForm.isOpen && (
        <ReplyForm
          item={{ event, replies: new Set(), refs: getThreadReferences(event) }}
          onCancel={replyForm.onClose}
          onSubmitted={replyForm.onClose}
        />
      )}
    </ContentSettingsProvider>
  );
}

export default memo(TimelineNote);
