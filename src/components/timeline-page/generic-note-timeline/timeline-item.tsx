import { Box, Spinner } from "@chakra-ui/react";
import { PICTURE_POST_KIND } from "applesauce-core/helpers";
import { type NostrEvent, kinds } from "nostr-tools";
import { type ReactNode, Suspense, lazy, memo } from "react";
import { motion } from "framer-motion";

import { isReply } from "../../../helpers/nostr/event";
import { FLARE_VIDEO_KIND } from "../../../helpers/nostr/video";
import { SOFTWARE_APP_KIND } from "../../../helpers/nostr/software";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import ArticleCard from "../../../views/articles/components/article-card";
import EmbeddedUnknown from "../../embed-event/card/embedded-unknown";
import { ErrorBoundary } from "../../error-boundary";
import { TimelineNote } from "../../note/timeline-note";
import PicturePost from "../../picture-post/picture-post-card";
import ReplyNote from "./reply-note";
import ShareEvent from "./share-event";

// other stuff
const StreamNote = lazy(() => import("./stream-note"));
const BadgeAwardCard = lazy(() => import("../../../views/badges/components/badge-award-card"));
const EmbeddedFlareVideo = lazy(() => import("../../embed-event/card/embedded-flare-video"));
const EmbeddedNip71Video = lazy(() => import("../../embed-event/card/embedded-nip71-video"));
const HighlightCard = lazy(() => import("../../highlight/highlight-card"));
const PollCard = lazy(() => import("../../poll/poll-card"));
const EmbeddedSoftware = lazy(() => import("../../embed-event/card/embedded-software"));

function TimelineItem({ event, visible, minHeight }: { event: NostrEvent; visible: boolean; minHeight?: number }) {
  const ref = useEventIntersectionRef(event);

  let content: ReactNode | null = null;
  switch (event.kind) {
    case kinds.ShortTextNote:
      content = isReply(event) ? <ReplyNote event={event} /> : <TimelineNote event={event} showReplyButton />;
      break;
    case kinds.Repost:
    case kinds.GenericRepost:
      content = <ShareEvent event={event} />;
      break;
    case kinds.LiveEvent:
      content = <StreamNote stream={event} />;
      break;
    case kinds.BadgeAward:
      content = <BadgeAwardCard award={event} />;
      break;
    case FLARE_VIDEO_KIND:
      content = <EmbeddedFlareVideo video={event} />;
      break;
    case kinds.LongFormArticle:
      content = <ArticleCard article={event} />;
      break;
    case PICTURE_POST_KIND:
      content = <PicturePost post={event} />;
      break;
    case 21:
    case 22:
      content = <EmbeddedNip71Video video={event} />;
      break;
    case 1068:
      content = <PollCard event={event} />;
      break;
    case 9802:
      content = <HighlightCard event={event} />;
      break;
    case SOFTWARE_APP_KIND:
      content = <EmbeddedSoftware app={event} />;
      break;
    default:
      content = <EmbeddedUnknown event={event} />;
      break;
  }

  return (
    <ErrorBoundary event={event}>
      <Box minHeight={`${minHeight}px`} ref={ref}>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Suspense fallback={<Spinner />}>{content}</Suspense>
          </motion.div>
        )}
      </Box>
    </ErrorBoundary>
  );
}

export default memo(TimelineItem);
