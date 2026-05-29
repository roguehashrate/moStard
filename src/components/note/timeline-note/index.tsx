import {
  Box,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  type CardProps,
  Flex,
  IconButton,
  Link,
  LinkBox,
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
import HoverLinkOverlay from "../../hover-link-overlay";
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
import ReplyContext from "./components/reply-context";
import NoteContentWithWarning from "./note-content-with-warning";

export type TimelineNoteProps = Omit<CardProps, "children"> & {
  event: NostrEvent;
  variant?: CardProps["variant"];
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
  variant = "unstyled",
  showReplyButton,
  showReplyLine = true,
  hideDrawerButton,
  registerIntersectionEntity = true,
  clickable = true,
  body,
  showMore = true,
  ...props
}: TimelineNoteProps) {
  const { showReactions } = useAppSettings();
  const replyForm = useDisclosure();

  const ref = useEventIntersectionRef(event);

  const showReactionsOnNewLine = useBreakpointValue({ base: true, lg: false });

  const reactionButtons = showReactions && (
    <NoteReactions event={event} flexWrap="wrap" variant="ghost" size="sm" zIndex={1} />
  );

  return (
    <ContentSettingsProvider event={event}>
      <ExpandProvider>
        <Flex
          direction="column"
          borderWidth="1px"
          rounded="2xl"
          borderColor="chakra-border-color"
          bg="chakra-subtle-bg"
          transition="all 0.2s"
          _hover={{
            borderColor: "primary.400",
            boxShadow: "0 0 0 1px var(--chakra-colors-primary-400)",
            _dark: {
              borderColor: "primary.400",
              boxShadow: "0 0 12px var(--chakra-colors-primary-400)",
            },
          }}
          {...props}
        >
          <Card
            as={LinkBox}
            variant={variant}
            bg="transparent"
            borderWidth={0}
            ref={registerIntersectionEntity ? ref : undefined}
            data-event-id={event.id}
          >
            {clickable && <HoverLinkOverlay as={RouterLink} to={`/n/${getSharableEventAddress(event)}`} />}
            <CardHeader p="3" pb="1">
              <Flex flex="1" gap="2.5" alignItems="center">
                <UserAvatarLink pubkey={event.pubkey} size="xs" />
                <UserLink pubkey={event.pubkey} isTruncated fontWeight="bold" fontSize="sm" />
                <Link as={RouterLink} whiteSpace="nowrap" color="chakra-subtle-text" fontSize="xs" to={`/n/${getSharableEventAddress(event)}`}>
                  <Timestamp timestamp={event.created_at} />
                </Link>
                <POWIcon event={event} boxSize={3.5} />
                <NotePublishedUsing event={event} />
                <Flex grow={1} />
              </Flex>
              {showReplyLine && <ReplyContext event={event} />}
            </CardHeader>
            <CardBody as={showMore ? ShowMoreContainer : undefined} px="3" py="1.5">
              {body ?? <NoteContentWithWarning event={event} />}
            </CardBody>
            <CardFooter p="3" pt="1" display="flex" gap="2" flexDirection="column" alignItems="flex-start">
              {showReactionsOnNewLine && reactionButtons}
            </CardFooter>
          </Card>
          <Flex gap="1" w="full" alignItems="center" pt="1" px="2.5" pb="2.5">
            <ButtonGroup size="sm" variant="ghost" spacing={0} zIndex={1}>
              {showReplyButton && (
                <IconButton icon={<ReplyIcon />} aria-label="Reply" title="Reply" onClick={replyForm.onOpen} />
              )}
              <EventShareButton event={event} />
              <EventQuoteButton event={event} />
              <EventTipButton event={event} />
              <EventZapButton event={event} />
            </ButtonGroup>
            {!showReactionsOnNewLine && reactionButtons}
            <Box flexGrow={1} />
            <ButtonGroup size="sm" variant="ghost" spacing={0} zIndex={1}>
              <NoteProxyLink event={event} />
              <BookmarkEventButton event={event} aria-label="Bookmark note" />
              <NoteMenu event={event} aria-label="More Options" />
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
