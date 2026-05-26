import {
  AvatarGroup,
  Badge,
  Box,
  Button,
  ButtonGroup,
  Flex,
  Icon,
  IconButton,
  LinkBox,
  LinkOverlay,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { mergeRelaySets, type Rumor } from "applesauce-core/helpers";
import { GiftWrapsModel, LegacyMessagesGroups, WrappedMessagesGroups } from "applesauce-core/models";
import { useActiveAccount, useEventModel, useObservableEagerState, useObservableState } from "applesauce-react/hooks";
import { type NostrEvent, kinds } from "nostr-tools";
import { npubEncode } from "nostr-tools/nip19";
import { useEffect, useMemo } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList, type ListChildComponentProps } from "react-window";

import { SettingsIcon } from "../../components/icons";
import Lightning01 from "../../components/icons/lightning-01";
import SimpleParentView from "../../components/layout/presets/simple-parent-view";
import RequireActiveAccount from "../../components/router/require-active-account";
import Timestamp from "../../components/timestamp";
import UserAvatar from "../../components/user/user-avatar";
import UserName from "../../components/user/user-name";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";
import { useLegacyMessagePlaintext } from "../../hooks/use-legacy-message-plaintext";
import useScrollRestoreRef from "../../hooks/use-scroll-restore";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useUserInbox } from "../../hooks/use-user-mailboxes";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import RequireDecryptionCache from "../../providers/route/require-decryption-cache";
import { legacyMessageSubscription, wrappedMessageSubscription } from "../../services/lifecycle";
import localSettings from "../../services/preferences";
import { DirectMessageRelays } from "../../models/messages";
import ReadAuthRequiredAlert from "./components/read-auth-required-alert";

function MessagePreview({ message }: { message: NostrEvent }) {
  const { plaintext } = useLegacyMessagePlaintext(message);
  return plaintext ? (
    <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.300" }} noOfLines={1}>
      {plaintext || "<Encrypted>"}
    </Text>
  ) : (
    <Badge variant="subtle" colorScheme="purple">
      Encrypted
    </Badge>
  );
}

function ConversationCard({ index, style, data }: ListChildComponentProps<(LegacyGroup | WrappedGroup)[]>) {
  const account = useActiveAccount()!;
  const conversation = data[index];

  const location = useLocation();
  const lastMessage = conversation.lastMessage;
  const surfaceBg = useColorModeValue("white", "whiteAlpha.100");
  const surfaceRing = useColorModeValue("blackAlpha.50", "whiteAlpha.100");
  const surfaceHover = useColorModeValue("white", "whiteAlpha.200");

  const ref = useEventIntersectionRef(lastMessage as NostrEvent);
  const others = conversation.participants.filter((p) => p !== account.pubkey);
  const isGroup = others.length > 1;
  const linkTarget = isGroup
    ? `/messages/group/${others.map(npubEncode).join(":")}`
    : `/messages/${others.map(npubEncode).join(":")}` + location.search;

  const isLegacy = lastMessage.kind === kinds.EncryptedDirectMessage;
  const preview = isLegacy ? (
    <MessagePreview message={lastMessage as NostrEvent} />
  ) : (
    <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.300" }} noOfLines={1}>
      {lastMessage.content || "<Encrypted>"}
    </Text>
  );

  return (
    <LinkBox as={Flex} ref={ref} style={style} px={{ base: "1.5", md: "3" }} py="2" w="full">
      <Flex
        w="full"
        gap={{ base: "3", md: "4" }}
        align="center"
        bg={surfaceBg}
        borderRadius="2xl"
        boxShadow="lg"
        borderWidth="1px"
        borderColor={surfaceRing}
        px={{ base: "3", md: "4" }}
        py={{ base: "3", md: "4" }}
        transition="all 0.2s ease"
        _hover={{ bg: surfaceHover, transform: "translateY(-2px)", boxShadow: "xl" }}
      >
        <AvatarGroup size="md" max={3}>
          {others.map((pubkey) => (
            <UserAvatar key={pubkey} pubkey={pubkey} />
          ))}
        </AvatarGroup>
        <Stack flex={1} spacing="1" overflow="hidden">
          <Flex align="center" gap="2" w="full">
            <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
              {others.map((pubkey, index) => (
                <span key={pubkey}>
                  <UserName pubkey={pubkey} />
                  {index < others.length - 1 && ", "}
                </span>
              ))}
            </Text>
            {isGroup && (
              <Badge colorScheme="primary" variant="subtle">
                Group
              </Badge>
            )}
            <Timestamp flexShrink={0} fontSize="xs" color="gray.500" ml="auto" timestamp={lastMessage.created_at} />
          </Flex>
          {preview}
        </Stack>
        <Icon as={Lightning01} color={isLegacy ? "yellow.400" : "primary.400"} boxSize="5" opacity={0.7} aria-hidden />
        <LinkOverlay as={RouterLink} to={linkTarget} />
      </Flex>
    </LinkBox>
  );
}

type LegacyGroup = NonNullable<{
  id: string;
  participants: string[];
  lastMessage: NostrEvent;
}>;
type WrappedGroup = NonNullable<{
  id: string;
  participants: string[];
  lastMessage: Rumor;
}>;

function Groups() {
  const account = useActiveAccount()!;

  // Subscribe to incoming messages
  useObservableState(legacyMessageSubscription);
  useObservableState(wrappedMessageSubscription);

  // Create a timeline loader for legacy messages
  const legacyInboxes = useUserInbox(account.pubkey);
  const messagesInboxes = useEventModel(DirectMessageRelays, [account.pubkey]);
  const inboxes = useMemo(() => mergeRelaySets(legacyInboxes, messagesInboxes), [legacyInboxes, messagesInboxes]);
  const { loader } = useTimelineLoader(`${account.pubkey}-legacy-messages`, legacyInboxes ?? [], [
    { authors: [account.pubkey], kinds: [kinds.EncryptedDirectMessage] },
    { "#p": [account.pubkey], kinds: [kinds.EncryptedDirectMessage] },
  ]);

  // Start the legacy messages timeline
  useEffect(() => {
    loader?.();
  }, [loader]);

  const legacyGroups = useEventModel(LegacyMessagesGroups, [account.pubkey]);
  const wrappedGroups = useEventModel(WrappedMessagesGroups, [account.pubkey]);

  const groups = useMemo(() => {
    const byId = new Map<string, LegacyGroup | WrappedGroup>();
    const all: (LegacyGroup | WrappedGroup)[] = [...(legacyGroups ?? []), ...(wrappedGroups ?? [])];

    for (const group of all) {
      const existing = byId.get(group.id);
      if (existing) {
        if (existing.lastMessage.created_at < group.lastMessage.created_at) byId.set(group.id, group);
      } else byId.set(group.id, group);
    }

    return Array.from(byId.values()).sort((a, b) => b.lastMessage.created_at - a.lastMessage.created_at);
  }, [legacyGroups, wrappedGroups]);

  const scroll = useScrollRestoreRef("chats");
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <IntersectionObserverProvider callback={callback}>
      <ReadAuthRequiredAlert relays={inboxes} flexShrink={0} />
      <Flex
        flex={1}
        overflow="hidden"
        position="relative"
        bgGradient={useColorModeValue(
          "linear(to-b, gray.50, gray.100)",
          "linear(to-b, blackAlpha.700, blackAlpha.900)",
        )}
        px={{ base: "2", md: "4" }}
        py={{ base: "4", md: "6" }}
      >
        <AutoSizer>
          {({ width, height }) => (
            <FixedSizeList
              height={height}
              width={width}
              itemData={groups ?? []}
              itemCount={groups?.length ?? 0}
              itemKey={(i, data) => data[i].id}
              itemSize={96}
              innerRef={scroll}
              overscanCount={10}
            >
              {ConversationCard}
            </FixedSizeList>
          )}
        </AutoSizer>
      </Flex>
    </IntersectionObserverProvider>
  );
}

function MessagesHomePage() {
  const account = useActiveAccount()!;

  // Automatically decrypt new wrapped messages
  const autoDecryptMessages = useObservableEagerState(localSettings.autoDecryptMessages);
  const locked = useEventModel(GiftWrapsModel, [account.pubkey, true]);

  return (
    <SimpleParentView
      path="/messages"
      width="md"
      title="Messages"
      scroll={false}
      actions={
        <ButtonGroup variant="ghost" ms="auto">
          <Button as={RouterLink} to="/messages/inbox" variant="ghost">
            Inbox{locked && locked.length > 0 && ` (${locked.length})`}
          </Button>
          <IconButton
            as={RouterLink}
            to="/settings/messages"
            aria-label="Settings"
            icon={<SettingsIcon boxSize={5} />}
          />
        </ButtonGroup>
      }
    >
      <Groups />
    </SimpleParentView>
  );
}

export default function MessagesHomeView() {
  return (
    <RequireActiveAccount>
      <RequireDecryptionCache>
        <MessagesHomePage />
      </RequireDecryptionCache>
    </RequireActiveAccount>
  );
}
