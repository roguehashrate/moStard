import { useEffect } from "react";
import { Button, type ButtonProps, useDisclosure } from "@chakra-ui/react";
import type { NostrEvent } from "nostr-tools";
import { kinds } from "nostr-tools";
import { useEventStore } from "applesauce-react/hooks";
import { useObservableMemo } from "applesauce-react/hooks";
import { map } from "rxjs/operators";

import useAppSettings from "../../hooks/use-user-app-settings";
import { nwcManager } from "../../services/nwc-manager";
import { profileLoader } from "../../services/loaders";
import ZapModal from "../zap-modal";

export type EventZapButtonProps = Omit<ButtonProps, "children"> & {
  event: NostrEvent;
};

export default function EventZapButton({ event, ...props }: EventZapButtonProps) {
  const settings = useAppSettings();
  const eventStore = useEventStore();
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    if (!eventStore.hasReplaceable(kinds.Metadata, event.pubkey)) {
      profileLoader({ kind: kinds.Metadata, pubkey: event.pubkey }).subscribe({ error: () => {} });
    }
  }, [event.pubkey, eventStore]);

  const authorMeta = useObservableMemo(
    () => eventStore.replaceable(kinds.Metadata, event.pubkey).pipe(map((e) => e ?? undefined)),
    [event.pubkey, eventStore],
  );

  const hasLightning = (() => {
    if (!authorMeta) return false;
    try {
      const content = JSON.parse(authorMeta.content);
      return typeof content.lud06 === "string" || typeof content.lud16 === "string";
    } catch {
      return false;
    }
  })();

  const enableAlternativePayments =
    "enableAlternativePayments" in settings ? (settings as any).enableAlternativePayments : false;
  const nwcEnabled = "nwcEnabled" in settings ? (settings as any).nwcEnabled : false;
  const isActive =
    enableAlternativePayments && nwcEnabled && nwcManager.status === "connected" && hasLightning;

  if (!isActive) return null;

  return (
    <>
      <Button
        m={0}
        leftIcon={<span>⚡</span>}
        aria-label="Zap"
        title="Send Lightning Zap"
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
        variant="ghost"
        size="sm"
        {...props}
      >
        Zap
      </Button>
      {isOpen && (
        <ZapModal
          isOpen={isOpen}
          onClose={onClose}
          recipientPubkey={event.pubkey}
          event={event}
          payInvoice={nwcManager.payInvoice.bind(nwcManager)}
        />
      )}
    </>
  );
}
