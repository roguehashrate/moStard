import { Flex, Text } from "@chakra-ui/react";
import type { NostrEvent } from "nostr-tools";
import { useMemo } from "react";

import { LightningIconFilled } from "../../../icons";
import UserAvatar from "../../../user/user-avatar";
import useZapAmounts from "../../../../hooks/use-zap-amounts";

export default function ZapReactions({ event }: { event: NostrEvent }) {
  const { zaps } = useZapAmounts(event);

  const topZaps = useMemo(() => [...zaps].sort((a, b) => b.amount - a.amount).slice(0, 10), [zaps]);

  if (topZaps.length === 0) return null;

  return (
    <Flex gap="1.5" flexWrap="wrap" w="full" px="2.5" pb="1">
      {topZaps.map((zap) => (
        <Flex
          key={`${zap.pubkey}-${zap.created_at}`}
          align="center"
          gap="1"
          borderRadius="full"
          borderWidth="1px"
          borderColor="primary.200"
          bg="primary.50"
          pl="0.5"
          pr="2"
          py="0.5"
          fontSize="xs"
          title={`${zap.amount} sats${zap.comment ? `: ${zap.comment}` : ""}`}
          _dark={{
            borderColor: "primary.500",
            bg: "whiteAlpha.100",
          }}
        >
          <UserAvatar pubkey={zap.pubkey} size="xs" />
          <LightningIconFilled boxSize="2.5" />
          <Text fontWeight="semibold" color="primary.500" _dark={{ color: "primary.300" }}>
            {zap.amount}
          </Text>
        </Flex>
      ))}
    </Flex>
  );
}
