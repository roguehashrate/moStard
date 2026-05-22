import { type ButtonProps, Button, useDisclosure } from "@chakra-ui/react";

import TipModal from "../event-tip-modal";

import type { NostrEvent } from "nostr-tools";
import useEventPaymentTargets from "~/hooks/use-event-payment-targets";
import PaytoIcon from "../payment/payto-icon";

export type NoteTipButtonProps = Omit<ButtonProps, "children"> & {
  event: NostrEvent;
  allowComment?: boolean;
  showEventPreview?: boolean;
};

export default function EventTipButton({ event, allowComment, showEventPreview, ...props }: NoteTipButtonProps) {
  const targets = useEventPaymentTargets(event);
  const primaryTarget = targets[0];
  const { isOpen, onOpen, onClose } = useDisclosure();

  const title = primaryTarget ? "Tip User" : "Tip Note";

  return (
    <>
      <Button
        m={0}
        rightIcon={primaryTarget ? <PaytoIcon type={primaryTarget.type} /> : undefined}
        aria-label={title}
        title={title}
        {...props}
        onClick={onOpen}
        isDisabled={!primaryTarget}
        sx={
          primaryTarget
            ? {}
            : {
                "& .chakra-button__icon": {
                  margin: "0 !important",
                },
              }
        }
      >
        {primaryTarget ? "Tip" : ""}
      </Button>

      {isOpen && (
        <TipModal
          isOpen={isOpen}
          onClose={onClose}
          event={event}
          allowComment={allowComment}
          showEmbed={showEventPreview}
          paymentTargets={targets}
        />
      )}
    </>
  );
}
