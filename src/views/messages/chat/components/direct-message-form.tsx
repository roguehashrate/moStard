import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Flex,
  FlexProps,
  Heading,
  IconButton,
  IconButtonProps,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useBreakpointValue,
  useColorModeValue,
} from "@chakra-ui/react";
import { SendLegacyMessage, SendWrappedMessage } from "applesauce-actions/actions";
import {
  createConversationIdentifier,
  getDisplayName,
  getTagValue,
  mergeRelaySets,
  unixNow,
} from "applesauce-core/helpers";
import { useActionHub, useActiveAccount, useEventModel, useObservableEagerState } from "applesauce-react/hooks";
import { kinds } from "nostr-tools";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { lastValueFrom, toArray } from "rxjs";

import InsertGifButton from "../../../../components/gif/insert-gif-button";
import EyeOff from "../../../../components/icons/eye-off";
import Lock01 from "../../../../components/icons/lock-01";
import MagicTextArea, { RefType } from "../../../../components/magic-textarea";
import InsertReactionButton from "../../../../components/reactions/insert-reaction-button";
import useCacheForm from "../../../../hooks/use-cache-form";
import useTextAreaUploadFile, { useTextAreaInsertTextWithForm } from "../../../../hooks/use-textarea-upload-file";
import useUserDmRelays from "../../../../hooks/use-user-dm-relays";
import { useUserInbox } from "../../../../hooks/use-user-mailboxes";
import { GroupMessageInboxes } from "../../../../models/messages";
import { PublishLogEntry, usePublishEvent } from "../../../../providers/global/publish-provider";
import { eventStore } from "../../../../services/event-store";
import localSettings from "../../../../services/preferences";
import ExpirationToggleButton from "../../components/expiration-toggle-button";
import SendingStatus from "../../components/sending-status";

function MessageTypeToggleButton({
  value,
  onChange,
  ...props
}: { value: MessageType; onChange: (value: MessageType) => void } & Omit<
  IconButtonProps,
  "children" | "onClick" | "onChange" | "value" | "aria-label"
>) {
  const [isOpen, setIsOpen] = useState(false);

  const handleTypeChange = (newType: MessageType) => {
    onChange(newType);
    setIsOpen(false);
  };

  return (
    <>
      <IconButton
        variant="ghost"
        onClick={() => setIsOpen(true)}
        aria-label="Toggle message type"
        colorScheme={value === "nip04" ? "red" : "green"}
        {...props}
      >
        {value === "nip04" ? <EyeOff boxSize={6} /> : <Lock01 boxSize={6} />}
      </IconButton>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader p="4">Message Type</ModalHeader>
          <ModalCloseButton />
          <ModalBody px="4" py="2">
            {value === "nip04" ? (
              <>
                <Alert status="warning" mb={4}>
                  <Text>
                    If the other user does not have a compatible app, they won't see the messages when you switch to
                    private messaging.
                  </Text>
                </Alert>
                <Text>
                  Private messaging (NIP-17) provides better privacy by hiding message metadata from third parties.
                </Text>
              </>
            ) : (
              <>
                <Alert status="warning" mb={4}>
                  <Text>
                    If you switch to legacy messaging, third parties will be able to see who you are messaging and how
                    many messages you send, even though the content of the messages is encrypted.
                  </Text>
                </Alert>
                <Text>Legacy messaging (NIP-04) is less private but more widely supported across different apps.</Text>
              </>
            )}
          </ModalBody>
          <ModalFooter p="4">
            <Button variant="ghost" mr={3} onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              colorScheme={value === "nip04" ? "green" : "orange"}
              onClick={() => handleTypeChange(value === "nip04" ? "nip17" : "nip04")}
            >
              {value === "nip04" ? "Enable Private Messages" : "Switch to Legacy"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export type MessageType = "nip04" | "nip17";

export default function SendMessageForm({
  pubkey,
  rootId,
  initialType = "nip17",
  initialExpiration,
  ...props
}: { pubkey: string; rootId?: string; initialType?: MessageType; initialExpiration?: number } & Omit<
  FlexProps,
  "children"
>) {
  const account = useActiveAccount()!;
  const publish = usePublishEvent();
  const actions = useActionHub();
  const defaultMessageExpiration = useObservableEagerState(localSettings.defaultMessageExpiration);

  // These values are managed outside of the form because they are options the user toggles
  const [expiration, setExpiration] = useState<number | null>(initialExpiration ?? defaultMessageExpiration);
  const [type, setType] = useState<MessageType>(initialType);

  // Reset the type when initial values change
  useEffect(() => {
    setType(initialType);
  }, [initialType]);
  useEffect(() => {
    if (initialExpiration) setExpiration(initialExpiration);
  }, [initialExpiration]);

  const { getValues, setValue, watch, handleSubmit, formState, reset } = useForm({
    defaultValues: {
      content: "",
    },
    mode: "all",
  });
  watch("content");

  const clearCache = useCacheForm<{ content: string }>(`dm-${pubkey}`, getValues, reset, formState, {
    clearOnKeyChange: true,
  });

  const autocompleteRef = useRef<RefType | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const insertText = useTextAreaInsertTextWithForm(autocompleteRef, getValues, setValue);
  const { onPaste } = useTextAreaUploadFile(insertText);

  const [sending, setSending] = useState<PublishLogEntry[] | null>(null);
  const otherDmRelays = useUserDmRelays(pubkey);
  const otherInboxes = useUserInbox(pubkey);
  const selfDmRelays = useUserDmRelays(account.pubkey);
  const selfInboxes = useUserInbox(account.pubkey);
  const inboxes = useEventModel(GroupMessageInboxes, [createConversationIdentifier(account.pubkey, pubkey), false]);

  // Prefer kind 10050 DM relays, fallback to NIP-65 inboxes
  const otherDmTargets = otherDmRelays && otherDmRelays.length > 0 ? otherDmRelays : otherInboxes;
  const selfDmTargets = selfDmRelays && selfDmRelays.length > 0 ? selfDmRelays : selfInboxes;
  const sendMessage = handleSubmit(async (values) => {
    if (!values.content) return;

    const expirationTimestamp = expiration ? unixNow() + expiration : undefined;

    // Publish all wrapped message events
    const publishes: PublishLogEntry[] = [];
    if (type === "nip04") {
      // Create legacy direct message events
      const events = await lastValueFrom(
        actions.exec(SendLegacyMessage, pubkey, values.content, { expiration: expirationTimestamp }).pipe(toArray()),
      );

      // Send legacy direct messages to both users' DM relays, fallback to NIP-65 inboxes
      for (let event of events) {
        publishes.push(
          await publish("Send message", event, mergeRelaySets(otherDmTargets, selfDmTargets), false, true),
        );
      }
    } else {
      if (!inboxes) throw new Error("Missing both users inboxes");

      // Create all wrapped message events
      const events = await lastValueFrom(
        actions
          .exec(SendWrappedMessage, [account.pubkey, pubkey], values.content, { expiration: expirationTimestamp })
          .pipe(toArray()),
      );
      for (let e of events) {
        const pubkey = getTagValue(e, "p");
        if (!pubkey) return;
        const relays = inboxes?.[pubkey];
        const profile = eventStore.getReplaceable(kinds.Metadata, pubkey);

        const label = `Send message to ${getDisplayName(profile)}`;
        if (!relays) publishes.push(await publish(label, e, [], false));
        else publishes.push(await publish(label, e, relays, false, true));
      }
    }
    setSending(publishes);

    // Wait for all messages to be published
    await Promise.all(publishes.map((e) => lastValueFrom(e.publish$)));
    setSending(null);

    // Reset form
    clearCache();
    reset({ content: "" });

    // refocus input
    setTimeout(() => textAreaRef.current?.focus(), 50);
  });

  const skipPublishing = useCallback(() => {
    setSending(null);

    // Reset form
    clearCache();
    reset({ content: "" });

    // refocus input
    setTimeout(() => textAreaRef.current?.focus(), 50);
  }, [reset]);

  const formRef = useRef<HTMLFormElement | null>(null);

  const isCompact = useBreakpointValue({ base: true, sm: false });
  const inputBg = useColorModeValue("white", "whiteAlpha.200");
  const inputBorder = useColorModeValue("blackAlpha.100", "whiteAlpha.100");
  const inputHover = useColorModeValue("white", "whiteAlpha.300");

  return (
    <Flex as="form" direction="column" gap="3" onSubmit={sendMessage} ref={formRef} w="full" {...props}>
      {formState.isSubmitting ? (
        sending ? (
          <SendingStatus entries={sending} onSkip={skipPublishing} />
        ) : (
          <Heading size="md" mx="auto" my="4">
            Signing message...
          </Heading>
        )
      ) : (
        <Flex direction="column" gap="3">
          <Flex gap={{ base: 3, md: 4 }} align="flex-end" w="full">
            <Stack spacing={{ base: 1, md: 2 }} direction={isCompact ? "row" : "column"} align="center">
              <ExpirationToggleButton value={expiration} onChange={setExpiration} variant="ghost" size="sm" />
              <MessageTypeToggleButton value={type} onChange={setType} variant="ghost" size="sm" />
            </Stack>

            <Box
              flex="1"
              bg={inputBg}
              borderRadius="2xl"
              borderWidth="1px"
              borderColor={inputBorder}
              px={{ base: 3, md: 4 }}
              py={{ base: 2, md: 3 }}
              transition="background-color 0.2s ease"
              _hover={{ backgroundColor: inputHover }}
            >
              <MagicTextArea
                value={getValues().content}
                onChange={(e) => setValue("content", e.target.value, { shouldDirty: true, shouldTouch: true })}
                rows={isCompact ? 2 : 3}
                resize="none"
                isRequired
                instanceRef={(inst) => (autocompleteRef.current = inst)}
                ref={textAreaRef}
                onPaste={onPaste}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && formRef.current) formRef.current.requestSubmit();
                }}
              />

              <Flex align="center" justify="space-between" mt="2">
                <ButtonGroup size="sm" variant="ghost" colorScheme="purple">
                  <InsertGifButton onSelectURL={insertText} aria-label="Add gif" />
                  <InsertReactionButton onSelect={insertText} aria-label="Add emoji" />
                </ButtonGroup>
                <Text fontSize="xs" color="gray.500">
                  {getValues().content.length > 0 ? `${getValues().content.length} chars` : ""}
                </Text>
              </Flex>
            </Box>

            <Button
              type="submit"
              colorScheme="primary"
              borderRadius="full"
              size={isCompact ? "md" : "lg"}
              px={{ base: 5, md: 8 }}
              minW={isCompact ? "auto" : "4.5rem"}
            >
              Send
            </Button>
          </Flex>
        </Flex>
      )}
    </Flex>
  );
}
