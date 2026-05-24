import {
  Box,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Flex,
  IconButton,
  Link,
  Progress,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import type { NostrEvent } from "nostr-tools";
import { memo, useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";

import Timestamp from "../timestamp";
import UserAvatarLink from "../user/user-avatar-link";
import UserLink from "../user/user-link";
import { getThreadReferences } from "../../helpers/nostr/event";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";
import useAppSettings from "../../hooks/use-user-app-settings";
import { useBreakpointValue } from "../../providers/global/breakpoint-provider";
import { ContentSettingsProvider } from "../../providers/local/content-settings";
import { ExpandProvider } from "../../providers/local/expanded";
import { getSharableEventAddress } from "../../services/relay-hints";
import { useReadRelays } from "../../hooks/use-client-relays";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import ReplyForm from "../../views/thread/components/reply-form";
import HoverLinkOverlay from "../hover-link-overlay";
import { ReplyIcon } from "../icons";
import POWIcon from "../pow/pow-icon";
import EventTipButton from "../tip/event-tip-button";
import BookmarkEventButton from "../note/bookmark-button";
import EventQuoteButton from "../note/event-quote-button";
import NoteMenu from "../note/note-menu";
import NotePublishedUsing from "../note/note-published-using";
import EventShareButton from "../note/timeline-note/components/event-share-button";
import NoteProxyLink from "../note/timeline-note/components/note-proxy-link";
import NoteReactions from "../note/timeline-note/components/note-reactions";

function getPollMetadata(event: NostrEvent) {
  const options = event.tags
    .filter((t) => t[0] === "option" && t[1] && t[2])
    .map((t) => ({ id: t[1], label: t[2] }));

  const pollType = event.tags.find((t) => t[0] === "polltype")?.[1] || "singlechoice";
  const endsAt = event.tags.find((t) => t[0] === "endsAt")?.[1];
  const endsAtTime = endsAt ? parseInt(endsAt) * 1000 : undefined;
  const hasEnded = endsAtTime ? Date.now() > endsAtTime : false;

  return { options, pollType, endsAtTime, hasEnded };
}

function countResponses(responses: NostrEvent[], optionIds: Set<string>) {
  const counts: Record<string, number> = {};
  for (const id of optionIds) counts[id] = 0;

  for (const resp of responses) {
    for (const tag of resp.tags) {
      if (tag[0] === "response" && tag[1] && optionIds.has(tag[1])) {
        counts[tag[1]] = (counts[tag[1]] || 0) + 1;
      }
    }
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return { counts, total };
}

function PollCard({ event, showReplyButton }: { event: NostrEvent; showReplyButton?: boolean }) {
  const replyForm = useDisclosure();
  const { showReactions } = useAppSettings();
  const ref = useEventIntersectionRef(event);
  const showReactionsOnNewLine = useBreakpointValue({ base: true, lg: false });

  const { options, pollType, hasEnded } = useMemo(() => getPollMetadata(event), [event]);

  const relayTags = event.tags.filter((t) => t[0] === "relay").map((t) => t[1]);
  const readRelays = useReadRelays(relayTags);

  const { timeline: responses } = useTimelineLoader(
    `poll-${event.id}`,
    readRelays,
    { kinds: [1018], "#e": [event.id] },
  );

  const optionIds = useMemo(() => new Set(options.map((o) => o.id)), [options]);
  const { counts, total } = useMemo(() => countResponses(responses, optionIds), [responses, optionIds]);

  const reactionButtons = showReactions && (
    <NoteReactions event={event} flexWrap="wrap" variant="ghost" size="sm" zIndex={1} />
  );

  if (options.length === 0) return null;

  return (
    <ContentSettingsProvider event={event}>
      <ExpandProvider>
        <Flex direction="column" borderWidth="0 2px 0 2px" rounded="none" borderColor="var(--chakra-colors-chakra-border-color)">
          <Card variant="unstyled" ref={ref} data-event-id={event.id}>
            <HoverLinkOverlay as={RouterLink} to={`/n/${getSharableEventAddress(event)}`} />
            <CardHeader p="2">
              <Flex flex="1" gap="2" alignItems="center">
                <UserAvatarLink pubkey={event.pubkey} size="sm" />
                <UserLink pubkey={event.pubkey} isTruncated fontWeight="bold" fontSize="lg" />
                <Link as={RouterLink} whiteSpace="nowrap" color="current" to={`/n/${getSharableEventAddress(event)}`}>
                  <Timestamp timestamp={event.created_at} />
                </Link>
                <POWIcon event={event} boxSize={5} />
                <NotePublishedUsing event={event} />
                <Flex grow={1} />
              </Flex>
            </CardHeader>

            <CardBody px="2">
              {event.content && (
                <Text fontWeight="bold" mb="3" whiteSpace="pre-wrap">
                  {event.content}
                </Text>
              )}

              {(hasEnded || pollType === "multiplechoice") && (
                <Flex gap="2" mb="2">
                  {hasEnded && (
                    <Text fontSize="sm" color="orange.500" fontWeight="bold">
                      Poll has ended
                    </Text>
                  )}
                  {pollType === "multiplechoice" && (
                    <Text fontSize="sm" color="gray.500">
                      Multiple choice
                    </Text>
                  )}
                </Flex>
              )}

              <Flex direction="column" gap="3">
                {options.map((option) => {
                  const count = counts[option.id] || 0;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <Box key={option.id}>
                      <Flex justify="space-between" mb="1">
                        <Text fontSize="sm">{option.label}</Text>
                        <Text fontSize="sm" fontWeight="bold">
                          {pct}% ({count})
                        </Text>
                      </Flex>
                      <Progress value={pct} size="lg" colorScheme="primary" borderRadius="md" />
                    </Box>
                  );
                })}
              </Flex>

              <Flex gap="2" mt="3" alignItems="center">
                <Text fontSize="sm" color="gray.500">
                  {total} vote{total !== 1 ? "s" : ""} · {options.length} option{options.length !== 1 ? "s" : ""}
                </Text>
              </Flex>
            </CardBody>

            <CardFooter p="2" display="flex" gap="2" flexDirection="column" alignItems="flex-start">
              {showReactionsOnNewLine && reactionButtons}
            </CardFooter>
          </Card>

          <Flex gap="2" w="full" alignItems="center" pt="2" px="2">
            <ButtonGroup size="sm" variant="ghost" zIndex={1}>
              {showReplyButton && (
                <IconButton icon={<ReplyIcon />} aria-label="Reply" title="Reply" onClick={replyForm.onOpen} />
              )}
              <EventShareButton event={event} />
              <EventQuoteButton event={event} />
              <EventTipButton event={event} />
            </ButtonGroup>
            {!showReactionsOnNewLine && reactionButtons}
            <Box flexGrow={1} />
            <ButtonGroup size="sm" variant="ghost" zIndex={1}>
              <NoteProxyLink event={event} />
              <BookmarkEventButton event={event} aria-label="Bookmark note" />
              <NoteMenu event={event} aria-label="More Options" />
            </ButtonGroup>
          </Flex>
        </Flex>
        {replyForm.isOpen && (
          <ReplyForm
            item={{ event, replies: new Set(), refs: getThreadReferences(event) }}
            onCancel={replyForm.onClose}
            onSubmitted={replyForm.onClose}
          />
        )}
      </ExpandProvider>
    </ContentSettingsProvider>
  );
}

export default memo(PollCard);
