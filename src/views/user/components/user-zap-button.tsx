import { IconButton, type IconButtonProps, useDisclosure } from "@chakra-ui/react";
import TipModal from "../../../components/event-tip-modal";
import useUserPaymentTargets from "../../../hooks/use-user-payment-targets";
import PaytoIcon from "../../../components/payment/payto-icon";

export default function UserZapButton({ pubkey, ...props }: { pubkey: string } & Omit<IconButtonProps, "aria-label">) {
  const targets = useUserPaymentTargets(pubkey);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const primary = targets[0];

  if (!primary) return null;

  return (
    <>
      <IconButton onClick={onOpen} aria-label="Tip User" title="Tip User" icon={<PaytoIcon type={primary.type} />} {...props} />
      {isOpen && <TipModal isOpen={isOpen} onClose={onClose} pubkey={pubkey} />}
    </>
  );
}
