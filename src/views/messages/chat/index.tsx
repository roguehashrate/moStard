import {
  Box,
  ButtonGroup,
  Flex,
  IconButton,
  Stack,
  Text,
  useBreakpointValue,
  useColorModeValue,
} from "@chakra-ui/react";
import { getExpirationTimestamp, getRumorGiftWraps, isEvent, mergeRelaySets, Rumor } from "applesauce-core/helpers";
import { LegacyMessagesGroup, WrappedMessagesGroup } from "applesauce-core/models";
import { useActiveAccount, useEventModel, useObservableState } from "applesauce-react/hooks";
import { kinds, NostrEvent } from "nostr-tools";
import { memo, useCallback, useContext, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import { Navigate, UNSAFE_DataRouterContext, useLocation, useNavigate, useParams } from "react-router-dom";

import { SettingsIcon } from "../../../components/icons";
import RequireActiveAccount from "../../../components/router/require-active-account";
import TimelineActionAndStatus from "../../../components/timeline/timeline-action-and-status";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";
import { BackIconButton } from "../../../components/router/back-button";
import { groupMessages } from "../../../helpers/nostr/dms";
import { sortByDate } from "../../../helpers/nostr/event";
import { truncateId } from "../../../helpers/string";
import useParamsProfilePointer from "../../../hooks/use-params-pubkey-pointer";
import useRouterMarker from "../../../hooks/use-router-marker";
import useScrollRestoreRef from "../../../hooks/use-scroll-restore";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import { useUserInbox } from "../../../hooks/use-user-mailboxes";
import { DirectMessageRelays } from "../../../models/messages";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import { legacyMessageSubscription, wrappedMessageSubscription } from "../../../services/lifecycle";
import DirectMessageGroup from "../components/direct-message-group";
import PendingLockedAlert from "../components/pending-decryption-alert";
import ReadAuthRequiredAlert from "../components/read-auth-required-alert";
import SendMessageForm from "./components/direct-message-form";
import DirectMessageRelayConnectionsButton from "./components/direct-message-relay-connections";
import DirectMessageSettingsDrawer from "./components/direct-settings-drawer";

/** This is broken out from DirectMessageChatPage for performance reasons. Don't use outside of file */
const ChatLog = memo(({ messages }: { messages: (Rumor | NostrEvent)[] }) => {
  const grouped = useMemo(() => groupMessages(messages), [messages]);

  return (
    <>
      {grouped.map((group) => (
        <DirectMessageGroup key={group[0].id} messages={group} />
      ))}
    </>
  );
});

function DirectMessageChatPage({ pubkey }: { pubkey: string }) {
  const account = useActiveAccount()!;
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const chatBackground = useColorModeValue("linear(to-b, #eef2ff, #ffffff)", "linear(to-b, rgba(20, 22, 34, 0.94), rgba(25, 27, 38, 0.96))");
  const composerSurface = useColorModeValue("rgba(255, 255, 255, 0.92)", "rgba(26, 28, 38, 0.92)");
  const composerBorder = useColorModeValue("blackAlpha.100", "whiteAlpha.100");
  const headerMetaColor = useColorModeValue("gray.600", "gray.400");

  // Keep a subscription open for NIP-04 and NIP-17 messages
  useObservableState(legacyMessageSubscription);
  useObservableState(wrappedMessageSubscription);

  const { router } = useContext(UNSAFE_DataRouterContext)!;
  const marker = useRouterMarker(router);
  useEffect(() => {
    if (marker.index.current === null) {
      // the drawer just open, set the marker
      marker.set(1);
    }
  }, [location]);

  const openSettingsDrawer = useCallback(() => {
    marker.set(0);
    navigate(".", { state: { settings: true } });
  }, [navigate]);

  const closeDrawer = useCallback(() => {
    if (marker.index.current !== null && marker.index.current > 0) {
      navigate(-marker.index.current);
    } else navigate(".", { state: { settings: undefined } });
    marker.reset();
  }, [marker, navigate]);

  // NOTE: its probably not a great idea to read from the other users inboxes, but it does help load missing messages
  const otherLegacyInboxes = useUserInbox(pubkey);
  const selfLegacyInboxes = useUserInbox(account.pubkey);
  const legacyInboxes = useMemo(
    () => mergeRelaySets(selfLegacyInboxes, otherLegacyInboxes),
    [selfLegacyInboxes, otherLegacyInboxes],
  );

  const { loader } = useTimelineLoader(
    `${truncateId(pubkey)}-${truncateId(account.pubkey)}-messages`,
    legacyInboxes,
    [
      {
        kinds: [kinds.EncryptedDirectMessage],
        "#p": [account.pubkey],
        authors: [pubkey],
      },
      {
        kinds: [kinds.EncryptedDirectMessage],
        "#p": [pubkey],
        authors: [account.pubkey],
      },
    ],
    {},
  );

  const inboxes = useEventModel(DirectMessageRelays, [account.pubkey]);
  const allReadRelays = useMemo(() => mergeRelaySets(legacyInboxes, inboxes), [legacyInboxes, inboxes]);

  const legacyMessages = useEventModel(LegacyMessagesGroup, [account.pubkey, pubkey]);
  const wrappedMessages = useEventModel(WrappedMessagesGroup, [account.pubkey, pubkey]);
  const messages = useMemo<(NostrEvent | Rumor)[]>(
    () => [...(legacyMessages ?? []), ...(wrappedMessages ?? [])].sort(sortByDate),
    [legacyMessages, wrappedMessages],
  );

  // Get the last message from the other user or self
  const lastReceivedMessage = useMemo<NostrEvent | Rumor | undefined>(
    () => messages.find((m) => m.pubkey === pubkey) || messages[0],
    [messages, pubkey],
  );
  const lastExpiration = useMemo<number | undefined>(() => {
    for (const message of messages) {
      if (message.kind === kinds.EncryptedDirectMessage && isEvent(message)) {
        const ts = getExpirationTimestamp(message);
        if (ts) return ts - message.created_at;
      } else if (message.kind === kinds.EncryptedDirectMessage) {
        const giftWrap = getRumorGiftWraps(message)[0];
        const ts = getExpirationTimestamp(giftWrap);
        if (ts) return ts - message.created_at;
      } else if (message.kind === kinds.GiftWrap && isEvent(message)) {
        const ts = getExpirationTimestamp(message);
        if (ts) return ts - message.created_at;
      }
    }
    return undefined;
  }, [messages]);

  const lastActive = useMemo(() => {
    if (!lastReceivedMessage) return undefined;
    return dayjs.unix(lastReceivedMessage.created_at).fromNow();
  }, [lastReceivedMessage]);

  // Callback to timeline loading
  const callback = useTimelineCurserIntersectionCallback(loader);

  // restore scroll on navigation
  const scroll = useScrollRestoreRef();

  return (
    <IntersectionObserverProvider callback={callback}>
      <Flex
        direction="column"
        flex={1}
        minH="100%"
        bgGradient={chatBackground}
        position="relative"
      >
        <Flex
          as="header"
          align="center"
          gap={{ base: 3, md: 4 }}
          pt={`calc(var(--safe-top) + 0.75rem)`}
          pb={{ base: 3, md: 4 }}
          pl={{ base: "calc(var(--safe-left) + 1rem)", md: "calc(var(--safe-left) + 2.5rem)" }}
          pr={{ base: "calc(var(--safe-right) + 1rem)", md: "calc(var(--safe-right) + 2.5rem)" }}
          position="sticky"
          top="0"
          zIndex="tooltip"
          backdropFilter="blur(14px)"
          bgGradient={useColorModeValue(
            "linear(to-r, rgba(255,255,255,0.85), rgba(255,255,255,0.6))",
            "linear(to-r, rgba(24,26,38,0.9), rgba(24,26,38,0.7))",
          )}
          borderBottomWidth="1px"
          borderColor={composerBorder}
        >
          <BackIconButton display={{ base: "flex", lg: "none" }} />
          <UserAvatarLink pubkey={pubkey} size="sm" />
          <Stack spacing="0" minW={0} flex={1} overflow="hidden">
            <UserLink pubkey={pubkey} fontWeight="semibold" fontSize="sm" noOfLines={1} />
            {lastActive && (
              <Text fontSize="xs" color={headerMetaColor} noOfLines={1}>
                Active {lastActive}
              </Text>
            )}
          </Stack>
          <ButtonGroup variant="ghost" ml="auto" spacing={{ base: 1, md: 2 }}>
            <DirectMessageRelayConnectionsButton
              other={pubkey}
              variant="ghost"
              onClick={openSettingsDrawer}
              aria-label="Relay connections"
              display={{ base: "none", md: "inline-flex" }}
            />
            <IconButton
              aria-label="Conversation Settings"
              title="Conversation Settings"
              icon={<SettingsIcon boxSize={5} />}
              onClick={openSettingsDrawer}
              variant="ghost"
              borderRadius="full"
            />
          </ButtonGroup>
        </Flex>

        <Flex direction="column" flex={1} minH={0} position="relative">
          <Flex
            direction="column-reverse"
            gap="3"
            flexGrow={1}
            overflowX="hidden"
            overflowY="auto"
            ref={scroll}
            px={{ base: "calc(var(--safe-left) + 1rem)", md: "calc(var(--safe-left) + 3rem)" }}
            pr={{ base: "calc(var(--safe-right) + 1rem)", md: "calc(var(--safe-right) + 3rem)" }}
            py={{ base: 4, md: 8 }}
            position="relative"
            zIndex={0}
          >
            <PendingLockedAlert />
            <ChatLog messages={messages} />
            <TimelineActionAndStatus loader={loader} />
          </Flex>

          <Box
            position="sticky"
            bottom="0"
            zIndex={1}
            px={{ base: "calc(var(--safe-left) + 1rem)", md: "calc(var(--safe-left) + 3rem)" }}
            pr={{ base: "calc(var(--safe-right) + 1rem)", md: "calc(var(--safe-right) + 3rem)" }}
            pb={`calc(var(--safe-bottom-nav) + ${isMobile ? "1.25rem" : "2.25rem"})`}
            pt={{ base: 3, md: 4 }}
            backdropFilter="blur(18px)"
          >
            <Stack spacing="3">
              <ReadAuthRequiredAlert relays={allReadRelays} />
              <Box
                bg={composerSurface}
                borderRadius="3xl"
                borderWidth="1px"
                borderColor={composerBorder}
                boxShadow="2xl"
                px={{ base: 3, md: 4 }}
                py={{ base: 3, md: 4 }}
              >
                <SendMessageForm
                  flexShrink={0}
                  pubkey={pubkey}
                  w="full"
                  initialType={lastReceivedMessage?.kind === kinds.EncryptedDirectMessage ? "nip04" : "nip17"}
                  initialExpiration={lastExpiration}
                />
              </Box>
            </Stack>
          </Box>
        </Flex>

        <DirectMessageSettingsDrawer
          isOpen={!!location.state?.settings}
          onClose={closeDrawer}
          otherUserPubkey={pubkey}
        />
      </Flex>
    </IntersectionObserverProvider>
  );
}

export default function DirectMessageChatView() {
  const params = useParams();
  if (params.pubkey?.includes(":")) {
    return <Navigate to={`/messages/group/${params.pubkey}`} replace />;
  }

  const { pubkey } = useParamsProfilePointer();

  return (
    <RequireActiveAccount>
      <DirectMessageChatPage pubkey={pubkey} />
    </RequireActiveAccount>
  );
}
