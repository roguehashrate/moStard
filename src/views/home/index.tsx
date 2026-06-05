import { useCallback, useEffect } from "react";
import { Flex, IconButton, Spacer, Text, useDisclosure } from "@chakra-ui/react";
import { kinds } from "nostr-tools";
import { RepeatIcon } from "@chakra-ui/icons";

import { isReply, isRepost } from "../../helpers/nostr/event";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { NostrEvent } from "nostr-tools";
import TimelinePage, { useTimelinePageEventFilter } from "../../components/timeline-page";
import TimelineViewTypeButtons from "../../components/timeline-page/timeline-view-type";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import NoteFilterTypeButtons from "../../components/note-filter-type-buttons";
import KindSelectionProvider, { useKindSelectionContext } from "../../providers/local/kind-selection-provider";
import { useReadRelays } from "../../hooks/use-client-relays";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { TimelineSkeleton } from "../../components/note-skeleton";

const defaultKinds = [kinds.ShortTextNote, kinds.Repost, kinds.GenericRepost, 1068];

function HomePage() {
  const showReplies = useDisclosure({ defaultIsOpen: localStorage.getItem("show-replies") === "true" });
  const showReposts = useDisclosure({ defaultIsOpen: localStorage.getItem("show-reposts") !== "false" });

  // save toggles to localStorage when changed
  useEffect(() => {
    localStorage.setItem("show-replies", String(showReplies.isOpen));
    localStorage.setItem("show-reposts", String(showReposts.isOpen));
  }, [showReplies.isOpen, showReposts.isOpen]);

  const timelinePageEventFilter = useTimelinePageEventFilter();
  const muteFilter = useClientSideMuteFilter();
  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (muteFilter(event)) return false;
      if (!showReplies.isOpen && isReply(event)) return false;
      if (!showReposts.isOpen && isRepost(event)) return false;
      return timelinePageEventFilter(event);
    },
    [timelinePageEventFilter, showReplies.isOpen, showReposts.isOpen, muteFilter],
  );

  const relays = useReadRelays();
  const { listId, filter, isLoading } = usePeopleListContext();
  const { kinds } = useKindSelectionContext();

  const { loader, timeline } = useTimelineLoader(
    `${listId}-home-feed`,
    relays,
    filter ? { ...filter, kinds } : undefined,
    {
      eventFilter,
    },
  );

  const handleRefresh = useCallback(() => {
    if (loader) loader(-Infinity);
  }, [loader]);

  const header = (
    <Flex gap="2" wrap="wrap" alignItems="center">
      <PeopleListSelection />
      <NoteFilterTypeButtons showReplies={showReplies} showReposts={showReposts} />
      <Spacer />
      <IconButton
        icon={<RepeatIcon />}
        aria-label="Refresh"
        title="Refresh timeline"
        variant="ghost"
        size="sm"
        onClick={handleRefresh}
      />
      <TimelineViewTypeButtons />
    </Flex>
  );

  if (isLoading) {
    return (
      <VerticalPageLayout maxW="6xl" mx="auto" gap="4" pt="2" pb="12" px="2">
        {header}
        <Text color="chakra-subtle-text" fontSize="sm" textAlign="center" py="4">
          Loading your contacts...
        </Text>
        <TimelineSkeleton count={5} />
      </VerticalPageLayout>
    );
  }

  return <TimelinePage loader={loader} timeline={timeline} header={header} pt="2" pb="12" px="2" />;
}

export default function HomeView() {
  return (
    <PeopleListProvider>
      <KindSelectionProvider initKinds={defaultKinds}>
        <HomePage />
      </KindSelectionProvider>
    </PeopleListProvider>
  );
}
