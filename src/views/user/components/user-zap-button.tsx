import { IconButton, type IconButtonProps, useDisclosure } from "@chakra-ui/react";
import TipModal from "../../../components/event-tip-modal";
import useUserXMRMetadata from "../../../hooks/use-user-xmr-metadata";
import Monero from "../../../components/icons/monero";

export default function UserZapButton({ pubkey, ...props }: { pubkey: string } & Omit<IconButtonProps, "aria-label">) {
  const { address } = useUserXMRMetadata(pubkey);
  const { isOpen, onOpen, onClose } = useDisclosure();

  if (!address) return null;

  return (
    <>
      <IconButton onClick={onOpen} aria-label="Tip User" title="Tip User" icon={<Monero />} {...props} />
      {isOpen && <TipModal isOpen={isOpen} onClose={onClose} pubkey={pubkey} />}
    </>
  );
}
