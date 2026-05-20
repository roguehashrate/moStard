import { forwardRef } from "react";
import { kinds, type NostrEvent } from "nostr-tools";
import { Flex, type FlexProps } from "@chakra-ui/react";
import { css } from "@emotion/react";

import useStreamChatTimeline from "./use-stream-chat-timeline";
import ChatMessage from "./chat-message";

const hideScrollbarCss = css`
  scrollbar-width: 0;

  ::-webkit-scrollbar {
    width: 0;
  }
`;

const StreamChatLog = forwardRef<
  HTMLDivElement,
  Omit<FlexProps, "children"> & { stream: NostrEvent; hideScrollbar?: boolean }
>(({ stream, hideScrollbar, ...props }, ref) => {
  const { timeline: events } = useStreamChatTimeline(stream);

  return (
    <Flex
      ref={ref}
      overflowY="scroll"
      overflowX="hidden"
      direction="column-reverse"
      gap="2"
      css={hideScrollbar && hideScrollbarCss}
      {...props}
    >
      {events.map((event) => (
        <ChatMessage key={event.id} event={event} stream={stream} />
      ))}
    </Flex>
  );
});

export default StreamChatLog;
