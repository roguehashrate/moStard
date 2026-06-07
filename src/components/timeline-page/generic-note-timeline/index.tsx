import { memo, useState, useCallback, useEffect, useRef } from "react";
import { Box, Button, IconButton } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { getEventUID } from "nostr-idb";
import dayjs from "dayjs";
import { ChevronUpIcon } from "@chakra-ui/icons";

import useNumberCache from "../../../hooks/timeline/use-number-cache";
import useCacheEntryHeight from "../../../hooks/timeline/use-cache-entry-height";
import { useTimelineDates } from "../../../hooks/timeline/use-timeline-dates";
import useTimelineLocationCacheKey from "../../../hooks/timeline/use-timeline-cache-key";
import TimelineItem from "./timeline-item";
import { TimelineSkeleton } from "../../note-skeleton";

const INITIAL_NOTES = 10;
const NOTE_BUFFER = 5;

function GenericNoteTimeline({ timeline }: { timeline: NostrEvent[] }) {
  const [latest, setLatest] = useState(() => dayjs().unix());
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  const cacheKey = useTimelineLocationCacheKey();
  const numberCache = useNumberCache(cacheKey);
  const dates = useTimelineDates(timeline, numberCache, NOTE_BUFFER, INITIAL_NOTES);

  // measure and cache the hight of every entry
  useCacheEntryHeight(numberCache.set);

  const scrollToTop = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (typeof document !== "undefined" && document.scrollingElement) {
      document.scrollingElement.scrollTo({ top: 0, behavior: "smooth" });
    } else if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const container = document.querySelector('[aria-label="Main content"]');
    const targetElement = container instanceof HTMLElement ? container : null;
    const fallbackElement = document.scrollingElement instanceof HTMLElement ? document.scrollingElement : null;

    scrollContainerRef.current = targetElement ?? fallbackElement;

    const getScrollTop = () => {
      const elementScrollTop = targetElement?.scrollTop ?? fallbackElement?.scrollTop ?? 0;
      const windowScrollTop = window.scrollY ?? fallbackElement?.scrollTop ?? document.documentElement.scrollTop ?? 0;
      return Math.max(elementScrollTop, windowScrollTop);
    };

    const handleScroll = () => {
      const next = getScrollTop() > 200;
      setShowScrollTop((prev) => (prev === next ? prev : next));
    };

    handleScroll();

    targetElement?.addEventListener("scroll", handleScroll, { passive: true });
    fallbackElement?.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      targetElement?.removeEventListener("scroll", handleScroll);
      fallbackElement?.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scroll", handleScroll);
      if (scrollContainerRef.current === targetElement || scrollContainerRef.current === fallbackElement) {
        scrollContainerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (initialLoad && timeline.length > 0) setInitialLoad(false);
  }, [timeline.length, initialLoad]);

  useEffect(() => {
    const timer = setTimeout(() => setInitialLoad(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const newNotes: NostrEvent[] = [];
  const notes: NostrEvent[] = [];
  for (const note of timeline) {
    if (note.created_at > latest) newNotes.push(note);
    else if (note.created_at >= dates.cursor) notes.push(note);
  }

  return (
    <>
      {newNotes.length > 0 && (
        <Box h="0" overflow="visible" w="full" zIndex={100} display="flex" position="relative">
          <Button
            onClick={() => setLatest(newNotes[0].created_at + 10)}
            colorScheme="primary"
            size="lg"
            mx="auto"
            w={["50%", null, "30%"]}
          >
            Show {newNotes.length} new notes
          </Button>
        </Box>
      )}
      {initialLoad && notes.length === 0 && <TimelineSkeleton count={5} />}
      {notes.map((note) => (
        <TimelineItem
          key={note.id}
          event={note}
          visible={note.created_at <= dates.max && note.created_at >= dates.min}
          minHeight={numberCache.get(getEventUID(note))}
        />
      ))}
      {showScrollTop && (
        <IconButton
          aria-label="Scroll to top"
          icon={<ChevronUpIcon />}
          onClick={scrollToTop}
          position="fixed"
          bottom="calc(var(--safe-bottom-nav) + var(--chakra-space-4))"
          right="4"
          zIndex="banner"
          size="lg"
          isRound
          colorScheme="primary"
          boxShadow="lg"
        />
      )}
    </>
  );
}

export default memo(GenericNoteTimeline);
