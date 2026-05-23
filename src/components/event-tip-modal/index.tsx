import { useState } from "react";
import {
  type CardProps,
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  type ModalProps,
  ButtonGroup,
} from "@chakra-ui/react";

import type { NostrEvent } from "nostr-tools";
import InputStep from "./input-step";
import UserLink from "../user/user-link";
import useUserPaymentTargets from "../../hooks/use-user-payment-targets";
import PaytoIcon from "../payment/payto-icon";
import { useBreakpointValue } from "../../providers/global/breakpoint-provider";
import { getPaytoTypeInfo, type PaymentTarget } from "../../helpers/payto-types";

export type TipModalContentsProps = {
  description?: string;
  address?: string;
  pubkey?: string;
  amount?: number;
  event?: NostrEvent;
  relays?: string[];
  initialComment?: string;
  initialAmount?: number;
  allowComment?: boolean;
  showEmbed?: boolean;
  embedProps?: CardProps;
  additionalRelays?: Iterable<string>;
  onTipped?: () => void;
  paymentTargets?: PaymentTarget[];
};

export type TipModalProps = Omit<ModalProps, "children"> & TipModalContentsProps;

export function TipModalContents({
  description,
  event,
  address: addressParam,
  amount: defaultAmount,
  pubkey,
  initialComment,
  initialAmount,
  showEmbed = true,
  embedProps,
  paymentTargets: targetsProp,
}: TipModalContentsProps) {
  const pubkeyOrEvent = event?.pubkey || pubkey || "";
  const profileTargets = useUserPaymentTargets(pubkeyOrEvent);

  const filteredTargets = targetsProp && targetsProp.length > 0 ? targetsProp : profileTargets;

  let address = addressParam;
  if (!address && filteredTargets.length > 0) {
    address = filteredTargets[0].address;
  }

  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <ModalBody p="4">
      {description && (
        <ModalHeader px={0} pt={0} pb={4}>
          {description}
        </ModalHeader>
      )}

      {filteredTargets.length > 1 ? (
        <Flex direction="column" gap="4">
          <ButtonGroup spacing="1" isAttached>
            {filteredTargets.map((target, i) => {
              const info = getPaytoTypeInfo(target.type);
              return (
                <Button
                  key={`${target.type}-${target.address}`}
                  gap="1"
                  variant={i === selectedIndex ? "solid" : "outline"}
                  colorScheme={i === selectedIndex ? "primary" : "gray"}
                  onClick={() => setSelectedIndex(i)}
                  flex={1}
                  size="sm"
                >
                  <PaytoIcon type={target.type} boxSize={4} />
                  {info?.label || target.type}
                </Button>
              );
            })}
          </ButtonGroup>
          <InputStep
            address={filteredTargets[selectedIndex].address}
            paymentType={filteredTargets[selectedIndex].type}
            pubkey={pubkey}
            event={event}
            initialComment={initialComment}
            initialAmount={initialAmount}
            defaultAmount={defaultAmount}
            showEmbed={showEmbed}
            embedProps={embedProps}
          />
        </Flex>
      ) : (
        <InputStep
          address={address}
          paymentType={filteredTargets[0]?.type || "monero"}
          pubkey={pubkey}
          event={event}
          initialComment={initialComment}
          initialAmount={initialAmount}
          defaultAmount={defaultAmount}
          showEmbed={showEmbed}
          embedProps={embedProps}
        />
      )}
    </ModalBody>
  );
}

export function TipModalHeader({ event, pubkey }: { event?: NostrEvent; pubkey?: string }) {
  return (
    <ModalHeader p="4">
      {event ? (
        "Tip Event"
      ) : pubkey ? (
        <>
          Tip <UserLink pubkey={pubkey} fontWeight="bold" />
        </>
      ) : (
        "Tip Address"
      )}
    </ModalHeader>
  );
}

export default function TipModal({
  description,
  address: addressParam,
  event,
  pubkey,
  relays,
  onClose,
  initialComment,
  initialAmount,
  allowComment = true,
  showEmbed = true,
  embedProps,
  additionalRelays = [],
  paymentTargets,
  ...props
}: TipModalProps) {
  const isMobile = useBreakpointValue({ base: true, md: false });
  return (
    <Modal onClose={onClose} size={isMobile ? "full" : "xl"} {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />

        <TipModalHeader />

        <TipModalContents
          description={description}
          event={event}
          address={addressParam}
          pubkey={pubkey}
          initialComment={initialComment}
          initialAmount={initialAmount}
          showEmbed={showEmbed}
          embedProps={embedProps}
          paymentTargets={paymentTargets}
        />
      </ModalContent>
    </Modal>
  );
}
