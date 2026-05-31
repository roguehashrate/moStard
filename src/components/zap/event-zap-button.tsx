import { useEffect, useState } from "react";
import { Button, useDisclosure } from "@chakra-ui/react";
import type { NostrEvent } from "nostr-tools";
import { kinds } from "nostr-tools";
import { useActiveAccount, useEventStore, useObservableMemo } from "applesauce-react/hooks";
import { map } from "rxjs/operators";

import { LightningIcon, LightningIconFilled } from "../icons";
import useZapAmounts from "../../hooks/use-zap-amounts";
import useAppSettings from "../../hooks/use-user-app-settings";
import { profileLoader } from "../../services/loaders";
import { nwcManager } from "../../services/nwc-manager";
import ZapModal from "../zap-modal";

export type EventZapButtonProps = {
  event: NostrEvent;
};

export default function EventZapButton({ event }: EventZapButtonProps) {
  const eventStore = useEventStore();
  const account = useActiveAccount();
  const { totalSats, zapperPubkeys } = useZapAmounts(event);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [hasLightning, setHasLightning] = useState(false);

  const hasZapped = account ? zapperPubkeys.has(account.pubkey) : false;
  const { enableAlternativePayments, nwcEnabled } = useAppSettings();
  const showZap = enableAlternativePayments && nwcEnabled && nwcManager.status === "connected";

  if (!showZap) return null;

  useEffect(() => {
    if (!eventStore.hasReplaceable(kinds.Metadata, event.pubkey)) {
      profileLoader({ kind: kinds.Metadata, pubkey: event.pubkey }).subscribe({ error: () => {} });
    }
  }, [event.pubkey, eventStore]);

  const authorMeta = useObservableMemo(
    () => eventStore.replaceable(kinds.Metadata, event.pubkey).pipe(map((e) => e ?? undefined)),
    [event.pubkey, eventStore],
  );

  useEffect(() => {
    if (!authorMeta) {
      setHasLightning(false);
      return;
    }
    try {
      const content = JSON.parse(authorMeta.content);
      setHasLightning(typeof content.lud06 === "string" || typeof content.lud16 === "string");
    } catch {
      setHasLightning(false);
    }
  }, [authorMeta]);

  return (
    <>
      <Button
        leftIcon={hasZapped ? <LightningIconFilled /> : <LightningIcon />}
        aria-label="Zap"
        title="Send Lightning Zap"
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
        isDisabled={!hasLightning}
        variant="ghost"
        size="sm"
        borderRadius="xl"
        transition="all 0.15s"
        _hover={hasLightning ? { bg: "glass-bg-hover" } : undefined}
      >
        {totalSats > 0 ? totalSats : null}
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
