import {
  Box,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useColorModeValue,
  usePrefersReducedMotion,
  useToast,
} from "@chakra-ui/react";
import { Rumor } from "applesauce-core/helpers";
import { useActiveAccount } from "applesauce-react/hooks";
import { kinds, NostrEvent } from "nostr-tools";
import { memo, useMemo, useState } from "react";
import dayjs from "dayjs";

import DebugEventMenuItem from "../../../components/debug-modal/debug-event-menu-item";
import { CopyToClipboardIcon, ReplyIcon } from "../../../components/icons";
import DotsHorizontal from "../../../components/icons/dots-horizontal";
import DeleteEventMenuItem from "../../../components/menu/delete-event";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import { useLegacyMessagePlaintext } from "../../../hooks/use-legacy-message-plaintext";
import DirectMessageContent from "./direct-message-content";

function DirectMessageActionsMenu({
  message,
  onReply,
  account,
  toast,
  placement,
}: {
  message: NostrEvent;
  onReply?: (message: NostrEvent) => void;
  account: any;
  toast: any;
  placement: "top-start" | "top-end";
}) {
  const { plaintext } = useLegacyMessagePlaintext(message);
  const isOwnMessage = message.pubkey === account.pubkey;
  const canDelete = isOwnMessage && message.kind === kinds.EncryptedDirectMessage;

  const handleCopyText = async () => {
    if (!plaintext) return;
    try {
      await navigator.clipboard.writeText(plaintext);
      toast({ title: "Text copied", status: "success", duration: 2000 });
    } catch (error) {
      toast({ title: "Failed to copy", status: "error", duration: 2000 });
    }
  };

  return (
    <Menu placement={placement} gutter={4} isLazy>
      <MenuButton
        as={IconButton}
        icon={<DotsHorizontal />}
        aria-label="Message actions"
        size="xs"
        variant="ghost"
      />
      <MenuList fontSize="sm" minW="40">
        {onReply && (
          <MenuItem icon={<ReplyIcon />} onClick={() => onReply(message)}>
            Reply
          </MenuItem>
        )}
        <MenuItem icon={<CopyToClipboardIcon />} onClick={handleCopyText}>
          Copy text
        </MenuItem>
        {canDelete && <DeleteEventMenuItem event={message} />}
        <DebugEventMenuItem event={message} />
      </MenuList>
    </Menu>
  );
}

function isDifferentDay(a: number, b: number) {
  const da = dayjs.unix(a);
  const db = dayjs.unix(b);
  return !da.isSame(db, "day");
}

function formatDateSeparator(ts: number) {
  const d = dayjs.unix(ts);
  const now = dayjs();
  if (d.isSame(now, "day")) return "Today";
  if (d.isSame(now.subtract(1, "day"), "day")) return "Yesterday";
  if (now.diff(d, "week") <= 2) return d.format("dddd");
  return d.format("MMMM D, YYYY");
}

function DirectMessageBubble({
  message,
  isOwn,
  isGroupStart,
  otherBg,
  onReply,
  account,
  toast,
}: {
  message: NostrEvent | Rumor;
  isOwn: boolean;
  isGroupStart: boolean;
  otherBg: string;
  onReply?: (message: NostrEvent | Rumor) => void;
  account: any;
  toast: any;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const bubbleGradient = isOwn ? "linear(to-br, primary.500, primary.400)" : undefined;
  const bubbleBg = isOwn ? undefined : otherBg;
  const bubbleColor = isOwn ? "white" : "gray.900";
  const timeLabel = dayjs.unix(message.created_at).format("h:mm A");

  return (
    <Flex justify={isOwn ? "flex-end" : "flex-start"} px={{ base: "3", md: "4" }} mb="3">
      <Flex gap="3" maxW="88%" align="flex-end" position="relative">
        {!isOwn && (
          <Box transition="opacity 0.2s" opacity={isGroupStart ? 1 : 0} w="8">
            <UserAvatarLink
              pubkey={message.pubkey}
              size="sm"
              mb="auto"
              flexShrink={0}
              border="2px solid"
              borderColor="whiteAlpha.600"
            />
          </Box>
        )}

        <Box position="relative" flex="1" px={isOwn ? 0 : 0} display="flex" justifyContent={isOwn ? "flex-end" : "flex-start"}>
          <Box
            position="relative"
            px="4"
            py="3"
            borderRadius="xl"
            borderBottomRightRadius={isOwn ? "md" : "2xl"}
            borderBottomLeftRadius={isOwn ? "2xl" : "md"}
            bg={bubbleBg}
            bgGradient={bubbleGradient}
            boxShadow="lg"
            color={bubbleColor}
            backdropFilter={!isOwn ? "saturate(120%)" : undefined}
            _after={{
              content: '""',
              position: "absolute",
              width: "3",
              height: "3",
              bottom: "1",
              right: isOwn ? "-1.5" : undefined,
              left: isOwn ? undefined : "-1.5",
              transform: isOwn ? "rotate(45deg)" : "rotate(-45deg)",
              bg: isOwn ? undefined : otherBg,
              bgGradient: bubbleGradient,
              borderRadius: "sm",
              boxShadow: "md",
            }}
            transition={prefersReducedMotion ? undefined : "transform 0.2s ease, box-shadow 0.2s ease"}
            _hover={prefersReducedMotion ? undefined : { transform: "translateY(-1px)", boxShadow: "xl" }}
          >
            <DirectMessageContent message={message} />
            <Flex justify="space-between" align="center" mt="2" opacity={0.85} gap="3">
              <Text fontSize="xs" color={isOwn ? "whiteAlpha.800" : "gray.500"}>
                {timeLabel}
              </Text>
              <DirectMessageActionsMenu
                message={message as NostrEvent}
                onReply={onReply as (msg: NostrEvent) => void}
                account={account}
                toast={toast}
                placement={isOwn ? "top-end" : "top-start"}
              />
            </Flex>
          </Box>
        </Box>

        {isOwn && (
          <Box w="8" display={isGroupStart ? "block" : "none"}>
            <UserAvatarLink pubkey={message.pubkey} size="sm" mb="auto" flexShrink={0} border="2px solid" borderColor="primary.200" />
          </Box>
        )}
      </Flex>
    </Flex>
  );
}

function DirectMessageGroup({
  onReply,
  messages,
}: {
  messages: (NostrEvent | Rumor)[];
  onReply?: (message: NostrEvent | Rumor) => void;
}) {
  const account = useActiveAccount()!;
  const toast = useToast();
  const otherBg = useColorModeValue("whiteAlpha.900", "whiteAlpha.200");

  // Messages are newest-first; reverse for chronological display (oldest first, newest at bottom)
  const sorted = useMemo(() => [...messages].reverse(), [messages]);

  return (
    <Flex direction="column" gap="1.5">
      {sorted.map((message, i, arr) => {
        const isOwn = message.pubkey === account.pubkey;
        const prev = arr[i - 1];
        const isGroupStart = !prev || prev.pubkey !== message.pubkey;
        const showDate = !prev || isDifferentDay(prev.created_at, message.created_at);

        return (
          <Box key={message.id}>
            {showDate && (
              <Flex justify="center" my="3">
                <Text fontSize="xs" color="gray.600" bg="whiteAlpha.700" px="4" py="1" borderRadius="full" boxShadow="sm">
                  {formatDateSeparator(message.created_at)}
                </Text>
              </Flex>
            )}
            <DirectMessageBubble
              message={message}
              isOwn={isOwn}
              isGroupStart={isGroupStart}
              otherBg={otherBg}
              onReply={onReply}
              account={account}
              toast={toast}
            />
          </Box>
        );
      })}
    </Flex>
  );
}

export default memo(DirectMessageGroup);
