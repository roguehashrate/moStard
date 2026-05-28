import { Button, IconButton, type ButtonProps } from "@chakra-ui/react";
import type { NostrEvent } from "nostr-tools";
import useZapAmounts from "../../hooks/use-zap-amounts";

export default function ZapBadge({
  event,
  ...props
}: Omit<ButtonProps, "children"> & { event: NostrEvent }) {
  const { totalSats, count } = useZapAmounts(event);

  if (totalSats <= 0) return null;

  const label = totalSats >= 1000 ? `${(totalSats / 1000).toFixed(1)}k` : `${totalSats}`;

  return (
    <Button
      leftIcon={<span>⚡</span>}
      title={`${totalSats} sats from ${count} zap${count > 1 ? "s" : ""}`}
      variant="ghost"
      size="sm"
      {...props}
    >
      {label}
    </Button>
  );
}
