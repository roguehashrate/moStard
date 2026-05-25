import {
  Box,
  ButtonGroup,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useColorModeValue,
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

function DirectMessageActions({
  message,
  onReply,
  account,
  toast,
}: {
  message: NostrEvent;
  onReply?: (message: NostrEvent) => void;
  account: any;
  toast: any;
}) {
  const { plaintext } = useLegacyMessagePlaintext(message);
  const isOwnMessage = message.pubkey === account.pubkey;
  const canDelete = isOwnMessage && message.kind === kinds.EncryptedDirectMessage;

  const handleReply = () => {
    onReply?.(message);
  };

  const handleCopyText = async () => {
    if (plaintext) {
      try {
        await navigator.clipboard.writeText(plaintext);
        toast({
          title: "Text copied to clipboard",
          status: "success",
          duration: 2000,
        });
      } catch (error) {
        toast({
          title: "Failed to copy text",
          status: "error",
          duration: 2000,
        });
      }
    }
  };

  return (
    <ButtonGroup size="xs" variant="ghost" gap="0">
      <IconButton aria-label="Reply" icon={<ReplyIcon />} onClick={handleReply} size="xs" />
      <Menu>
        <MenuButton as={IconButton} aria-label="More actions" icon={<DotsHorizontal />} size="xs" />
        <MenuList fontSize="sm">
          <MenuItem icon={<CopyToClipboardIcon />} onClick={handleCopyText}>
            Copy text
          </MenuItem>
          {canDelete && <DeleteEventMenuItem event={message} />}
          <DebugEventMenuItem event={message} />
        </MenuList>
      </Menu>
    </ButtonGroup>
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
  const [hover, setHover] = useState(false);

  return (
    <Flex
      justify={isOwn ? "flex-end" : "flex-start"}
      px="2"
      mb="1"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      position="relative"
    >
      {hover && (
        <Box
          position="absolute"
          top="-5"
          zIndex="1"
          bg="var(--chakra-colors-chakra-body-bg)"
          borderWidth="1px"
          borderRadius="md"
          px="1"
          py="0.5"
          boxShadow="md"
          {...(isOwn ? { right: "2" } : { left: "8" })}
        >
          <DirectMessageActions message={message as NostrEvent} onReply={onReply} account={account} toast={toast} />
        </Box>
      )}

      <Flex gap="1" maxW="80%" align="flex-end">
        {!isOwn && isGroupStart && (
          <UserAvatarLink pubkey={message.pubkey} size="xs" mb="auto" mt="1" flexShrink={0} />
        )}
        {!isOwn && !isGroupStart && <Box w="6" flexShrink={0} />}

        <Box>
          <Box
            bg={isOwn ? "primary.500" : otherBg}
            color={isOwn ? "white" : undefined}
            px="3"
            py="2"
            borderRadius="lg"
            borderBottomRightRadius={isOwn && isGroupStart ? 0 : "lg"}
            borderBottomLeftRadius={!isOwn && isGroupStart ? 0 : "lg"}
            maxW="100%"
          >
            <DirectMessageContent message={message} />
          </Box>
          <Flex justify={isOwn ? "flex-end" : "flex-start"} mt="0.5" px="1">
            <Text fontSize="10px" color="gray.500">
              {dayjs.unix(message.created_at).format("h:mm A")}
            </Text>
          </Flex>
        </Box>

        {isOwn && isGroupStart && (
          <UserAvatarLink pubkey={message.pubkey} size="xs" mb="auto" mt="1" flexShrink={0} />
        )}
        {isOwn && !isGroupStart && <Box w="6" flexShrink={0} />}
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
  const otherBg = useColorModeValue("gray.100", "whiteAlpha.200");

  // Messages are newest-first; reverse for chronological display (oldest first, newest at bottom)
  const sorted = useMemo(() => [...messages].reverse(), [messages]);

  return (
    <Flex direction="column">
      {sorted.map((message, i, arr) => {
        const isOwn = message.pubkey === account.pubkey;
        const prev = arr[i - 1];
        const isGroupStart = !prev || prev.pubkey !== message.pubkey;
        const showDate = !prev || isDifferentDay(prev.created_at, message.created_at);

        return (
          <Box key={message.id}>
            {showDate && (
              <Flex justify="center" my="2">
                <Text fontSize="xs" color="gray.500" bg="var(--chakra-colors-chakra-body-bg)" px="3" py="1" borderRadius="full">
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
