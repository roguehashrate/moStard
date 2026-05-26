import { useState } from "react";
import {
  Button,
  Flex,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
  Text,
  type ModalProps,
  useDisclosure,
} from "@chakra-ui/react";

import { ExternalLinkIcon } from "../icons";
import QrCodeSvg from "../qr-code/qr-code-svg";
import { CopyIconButton } from "../copy-icon-button";
import { useBreakpointValue } from "../../providers/global/breakpoint-provider";
import PaytoIcon from "./payto-icon";
import {
  buildPaytoUri,
  getPaytoTypeInfo,
  getWalletApp,
  resolveWalletDeepLink,
  resolveNativeUri,
  type PaymentTarget,
} from "../../helpers/payto-types";

type PaymentTargetDialogProps = {
  target: PaymentTarget;
  onClose: () => void;
} & Omit<ModalProps, "children">;

export default function PaymentTargetDialog({ target, onClose, ...props }: PaymentTargetDialogProps) {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const showQr = useDisclosure({ isOpen: true });
  const [payingApp, setPayingApp] = useState(false);
  const [selectedApp, setSelectedApp] = useState("");
  const info = getPaytoTypeInfo(target.type);

  const uri = buildPaytoUri(target.authority, target.address);
  const nativeUri = resolveNativeUri(target.type, target.address);

  const walletAppIds = info?.walletOpen?.walletApps ?? [];

  const payWithApp = async () => {
    const href = selectedApp ? resolveWalletDeepLink(target.type, target.address, selectedApp) : nativeUri;
    if (!href) return;

    setPayingApp(true);
    window.open(href);

    const listener = () => {
      if (document.visibilityState === "visible") {
        document.removeEventListener("visibilitychange", listener);
        setPayingApp(false);
      }
    };
    setTimeout(() => {
      document.addEventListener("visibilitychange", listener);
    }, 2000);
  };

  return (
    <Modal onClose={onClose} size={isMobile ? "full" : "xl"} {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader>
          <Flex gap="2" alignItems="center">
            <PaytoIcon type={target.type} boxSize={6} />
            <Text>{info?.label || target.type}</Text>
          </Flex>
        </ModalHeader>
        <ModalBody p="4">
          <Flex gap="2" direction="column">
            {showQr.isOpen && <QrCodeSvg content={uri} coinIcon={target.type} />}
            <Text fontSize="sm" color="gray.500" wordBreak="break-all">
              {target.address}
            </Text>
            <Flex gap="2">
              <Input value={uri} readOnly />
              <CopyIconButton value={uri} aria-label="Copy URI" variant="solid" size="md" />
            </Flex>
            {walletAppIds.length > 0 && (
              <Flex gap="2" alignItems="center">
                <Select
                  placeholder="Open in wallet..."
                  value={selectedApp}
                  onChange={(e) => setSelectedApp(e.target.value)}
                  flex={1}
                >
                  {walletAppIds.map((appId) => {
                    const app = getWalletApp(appId);
                    if (!app) return null;
                    return (
                      <option key={appId} value={appId}>
                        {app.label}
                      </option>
                    );
                  })}
                </Select>
                <Button
                  leftIcon={<ExternalLinkIcon />}
                  onClick={payWithApp}
                  variant="solid"
                  size="md"
                  isLoading={payingApp}
                  isDisabled={!selectedApp}
                >
                  Open
                </Button>
              </Flex>
            )}
            {nativeUri && walletAppIds.length === 0 && (
              <Flex gap="2">
                <Button
                  leftIcon={<ExternalLinkIcon />}
                  onClick={payWithApp}
                  flex={1}
                  variant="solid"
                  size="md"
                  isLoading={payingApp}
                >
                  Open in Wallet
                </Button>
              </Flex>
            )}
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
