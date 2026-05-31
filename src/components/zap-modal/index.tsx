import { useState, useCallback, useMemo } from "react";
import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  Textarea,
  type ModalProps,
  useToast,
} from "@chakra-ui/react";
import type { NostrEvent } from "nostr-tools";
import { useActiveAccount } from "applesauce-react/hooks";
import { useBreakpointValue } from "../../providers/global/breakpoint-provider";
import useAppSettings from "../../hooks/use-user-app-settings";
import useZap from "../../hooks/use-zap";
import UserAvatarLink from "../user/user-avatar-link";
import UserName from "../user/user-name";
import { LightningIcon } from "../icons";

const ZapStateMessages: Record<string, string> = {
  idle: "",
  resolving: "Resolving Lightning address...",
  creating: "Creating zap request...",
  "fetching-invoice": "Fetching invoice...",
  paying: "Paying via NWC...",
  done: "Zap sent successfully!",
  error: "",
};

const PRESET_AMOUNTS = [21, 42, 210, 420, 1000, 2100, 4200, 10000, 21000, 42000, 100000, 210000];

export type ZapModalProps = Omit<ModalProps, "children"> & {
  recipientPubkey: string;
  event?: NostrEvent;
  payInvoice: (invoice: string) => Promise<any>;
};

export default function ZapModal({
  recipientPubkey,
  event,
  payInvoice,
  onClose,
  ...props
}: ZapModalProps) {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { zapAmounts } = useAppSettings();
  const { state, error, sendZap } = useZap();
  const toast = useToast();
  const account = useActiveAccount();

  const amountsStr = (zapAmounts || "21,50,100,500,1000") as string;
  const defaultAmount = Number.parseFloat(amountsStr.split(",")[0]) || 21;
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [comment, setComment] = useState("");

  const isSelfZap = useMemo(() => account?.pubkey === recipientPubkey, [account?.pubkey, recipientPubkey]);

  const handleZap = useCallback(async () => {
    if (amount <= 0) return;

    const success = await sendZap({
      recipientPubkey,
      event,
      amount,
      comment,
      payInvoice,
    });

    if (success) {
      toast({
        title: "Zap sent!",
        description: `Successfully zapped ${recipientPubkey.slice(0, 8)}...`,
        status: "success",
        duration: 5000,
      });
      setTimeout(() => onClose(), 1500);
    }
  }, [amount, comment, recipientPubkey, event, payInvoice, sendZap, toast, onClose]);

  const isSending = state !== "idle" && state !== "done" && state !== "error";

  return (
    <Modal onClose={onClose} size={isMobile ? "full" : "md"} {...props}>
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(8px)" />
      <ModalContent borderRadius="3xl">
        <ModalCloseButton />
        <ModalHeader>
          <Flex gap="2" alignItems="center">
            <LightningIcon />
            Zap to
            <UserAvatarLink pubkey={recipientPubkey} size="xs" />
            <UserName pubkey={recipientPubkey} />
          </Flex>
        </ModalHeader>
        <ModalBody p="4">
          <Flex direction="column" gap="4">
            <FormControl>
              <Flex direction="column" align="center" gap="2">
                <Input
                  type="number"
                  step={1}
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  isDisabled={isSending}
                  textAlign="center"
                  fontSize="4xl"
                  fontWeight="bold"
                  border="none"
                  p="0"
                  _focus={{ boxShadow: "none" }}
                  h="auto"
                />
                <FormLabel mb="0" fontSize="sm" color="chakra-subtle-text">
                  Sats
                </FormLabel>
              </Flex>
            </FormControl>

            {isSelfZap && (
              <Text fontSize="sm" color="yellow.400" textAlign="center">
                You are about to zap yourself
              </Text>
            )}

            <Flex gap="2" wrap="wrap" justify="center">
              {PRESET_AMOUNTS.map((preset) => (
                <Button
                  key={preset}
                  size="sm"
                  variant={amount === preset ? "solid" : "outline"}
                  colorScheme={amount === preset ? "primary" : "gray"}
                  onClick={() => setAmount(preset)}
                  borderRadius="xl"
                  transition="all 0.15s"
                >
                  {preset >= 1000 ? `${(preset / 1000).toFixed(0)}k` : preset}
                </Button>
              ))}
            </Flex>

            <FormControl>
              <FormLabel>Message (optional)</FormLabel>
              <Textarea
                placeholder="Add a message to your zap..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={250}
                isDisabled={isSending}
              />
              <Text fontSize="xs" color="chakra-subtle-text" textAlign="right">
                {comment.length}/250
              </Text>
            </FormControl>

            {error && (
              <Text color="red.400" fontSize="sm">
                {error}
              </Text>
            )}

            {state !== "idle" && state !== "error" && (
              <Text color="primary.400" fontSize="sm">
                {ZapStateMessages[state] || state}
              </Text>
            )}

            <Button
              colorScheme="primary"
              onClick={handleZap}
              isLoading={isSending}
              loadingText={ZapStateMessages[state] || "Sending..."}
              isDisabled={amount <= 0 || isSending}
              leftIcon={<LightningIcon />}
              borderRadius="full"
              transition="all 0.15s"
              _hover={{ transform: "translateY(-1px)", boxShadow: "lg" }}
            >
              Zap {amount} sats
            </Button>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
