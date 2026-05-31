import { IconButton, useDisclosure } from "@chakra-ui/react";

import TipModal from "../event-tip-modal";

import type { NostrEvent } from "nostr-tools";
import useEventPaymentTargets from "~/hooks/use-event-payment-targets";
import { TipIcon } from "../icons";

export type NoteTipButtonProps = {
  event: NostrEvent;
  allowComment?: boolean;
  showEventPreview?: boolean;
};

export default function EventTipButton({ event, allowComment, showEventPreview }: NoteTipButtonProps) {
  const targets = useEventPaymentTargets(event);
  const nonLightningTargets = targets.filter((t) => t.type !== "lightning");
  const primaryTarget = nonLightningTargets[0];
  const { isOpen, onOpen, onClose } = useDisclosure();

  if (!primaryTarget) return null;

  return (
    <>
      <IconButton
        icon={<TipIcon />}
        aria-label="Tip"
        title="Tip"
        onClick={onOpen}
        variant="ghost"
        size="sm"
        borderRadius="xl"
        transition="all 0.15s"
        _hover={{ bg: "glass-bg-hover" }}
      />

      {isOpen && (
        <TipModal
          isOpen={isOpen}
          onClose={onClose}
          event={event}
          allowComment={allowComment}
          showEmbed={showEventPreview}
          paymentTargets={nonLightningTargets}
        />
      )}
    </>
  );
}
