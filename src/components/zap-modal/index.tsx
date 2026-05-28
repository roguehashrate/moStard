import { useState, useCallback } from "react";
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
import { useBreakpointValue } from "../../providers/global/breakpoint-provider";
import useAppSettings from "../../hooks/use-user-app-settings";
import useZap from "../../hooks/use-zap";

const ZapStateMessages: Record<string, string> = {
  idle: "",
  resolving: "Resolving Lightning address...",
  creating: "Creating zap request...",
  "fetching-invoice": "Fetching invoice...",
  paying: "Paying via NWC...",
  done: "Zap sent successfully!",
  error: "",
};

export type ZapModalProps = Omit<ModalProps, "children"> & {
  recipientPubkey: string;
  event?: NostrEvent;
  payInvoice: (invoice: string) => Promise<any>;
};

const DEFAULT_ZAP_AMOUNTS = "21,50,100,500,1000";

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

  const amountsStr = (zapAmounts || DEFAULT_ZAP_AMOUNTS) as string;
  const [amount, setAmount] = useState<number>(
    Number.parseFloat(amountsStr.split(",")[0]) || 21,
  );
  const [comment, setComment] = useState("");

  const presetAmounts = amountsStr
    .split(",")
    .map((v) => Number.parseFloat(v))
    .filter((v) => !Number.isNaN(v) && v > 0);

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
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader>
          <Flex gap="2" alignItems="center">
            <span>⚡</span> Send Zap
          </Flex>
        </ModalHeader>
        <ModalBody p="4">
          <Flex direction="column" gap="4">
            <Text fontSize="sm" color="chakra-subtle-text">
              Send a Lightning zap to the author of this note.
            </Text>

            <FormControl>
              <FormLabel>Amount (sats)</FormLabel>
              <Flex gap="2" wrap="wrap">
                {presetAmounts.map((preset) => (
                  <Button
                    key={preset}
                    size="sm"
                    variant={amount === preset ? "solid" : "outline"}
                    colorScheme={amount === preset ? "primary" : "gray"}
                    onClick={() => setAmount(preset)}
                  >
                    {preset} sats
                  </Button>
                ))}
              </Flex>
            </FormControl>

            <FormControl>
              <FormLabel>Custom amount (sats)</FormLabel>
              <Input
                type="number"
                step={1}
                min={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                isDisabled={isSending}
              />
            </FormControl>

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
              leftIcon={<span>⚡</span>}
            >
              Zap {amount} sats
            </Button>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
