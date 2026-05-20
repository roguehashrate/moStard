import {
  type CardProps,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  type ModalProps,
} from "@chakra-ui/react";

import type { NostrEvent } from "nostr-tools";
import InputStep from "./input-step";
import UserLink from "../user/user-link";
import useUserXMRMetadata from "../../hooks/use-user-xmr-metadata";
import { useBreakpointValue } from "../../providers/global/breakpoint-provider";

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
}: TipModalContentsProps) {
  let address = addressParam;

  if (!address) {
    const { address: userAddress } = useUserXMRMetadata(event?.pubkey || pubkey!);
    address = addressParam || userAddress;
  }

  return (
    <ModalBody p="4">
      {description && (
        <ModalHeader px={0} pt={0} pb={4}>
          {description}
        </ModalHeader>
      )}

      <InputStep
        address={address}
        pubkey={pubkey}
        event={event}
        initialComment={initialComment}
        initialAmount={initialAmount}
        defaultAmount={defaultAmount}
        showEmbed={showEmbed}
        embedProps={embedProps}
      />
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
        />
      </ModalContent>
    </Modal>
  );
}
