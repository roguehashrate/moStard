import { IconButton, Button, type IconButtonProps, useDisclosure, Flex } from "@chakra-ui/react";
import TipModal from "../../../components/event-tip-modal";
import ZapModal from "../../../components/zap-modal";
import useUserPaymentTargets from "../../../hooks/use-user-payment-targets";
import useAppSettings from "../../../hooks/use-user-app-settings";
import { nwcManager } from "../../../services/nwc-manager";
import PaytoIcon from "../../../components/payment/payto-icon";

export default function UserZapButton({ pubkey, ...props }: { pubkey: string } & Omit<IconButtonProps, "aria-label">) {
  const targets = useUserPaymentTargets(pubkey);
  const { enableAlternativePayments, nwcEnabled } = useAppSettings();
  const tipModal = useDisclosure();
  const zapModal = useDisclosure();
  const primary = targets[0];

  if (!primary) return null;

  const showZap = enableAlternativePayments && nwcEnabled && nwcManager.status === "connected" && targets.some((t) => t.type === "lightning");

  return (
    <>
      <Flex gap="2" alignItems="center">
        <IconButton
          onClick={tipModal.onOpen}
          aria-label="Tip User"
          title="Tip User"
          icon={<PaytoIcon type={primary.type} />}
          borderRadius="xl"
          transition="all 0.15s"
          _hover={{ bg: "glass-bg-hover" }}
          {...props}
        />
        {showZap && (
          <Button
            leftIcon={<span>⚡</span>}
            onClick={zapModal.onOpen}
            aria-label="Zap User"
            title="Send Lightning Zap"
            variant="outline"
            size="sm"
            borderRadius="xl"
            transition="all 0.15s"
            _hover={{ bg: "glass-bg-hover" }}
          >
            Zap
          </Button>
        )}
      </Flex>
      {tipModal.isOpen && <TipModal isOpen={tipModal.isOpen} onClose={tipModal.onClose} pubkey={pubkey} />}
      {zapModal.isOpen && (
        <ZapModal isOpen={zapModal.isOpen} onClose={zapModal.onClose} recipientPubkey={pubkey} payInvoice={nwcManager.payInvoice.bind(nwcManager)} />
      )}
    </>
  );
}
