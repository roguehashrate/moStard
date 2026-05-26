import { Box, Image, Text, type BoxProps } from "@chakra-ui/react";
import MoneroWhite from "../icons/monero-white";
import CurrencyBitcoinIcon from "../icons/currency-bitcoin";
import CurrencyEthereumIcon from "../icons/currency-ethereum";
import CurrencyDollarIcon from "../icons/currency-dollar";
import { getPaytoTypeInfo } from "../../helpers/payto-types";
import { getPaytoLogoUrl } from "../../helpers/payto-logos";

const iconMap: Record<string, typeof MoneroWhite> = {
  monero: MoneroWhite,
  bitcoin: CurrencyBitcoinIcon,
  ethereum: CurrencyEthereumIcon,
  litecoin: CurrencyBitcoinIcon,
  dogecoin: CurrencyBitcoinIcon,
  "bitcoin-cash": CurrencyBitcoinIcon,
  solana: CurrencyEthereumIcon,
};

const symbolMap: Record<string, string> = {
  lightning: "⚡",
  nano: "Ӿ",
};

export default function PaytoIcon({ type, boxSize = 4 }: { type: string; boxSize?: string | number }) {
  const logoUrl = getPaytoLogoUrl(type);

  if (logoUrl) {
    const size = typeof boxSize === "number" ? `${boxSize * 4}px` : boxSize;
    return (
      <Box boxSize={size} display="inline-flex" alignItems="center" justifyContent="center" flexShrink={0}>
        <Image src={logoUrl} alt={type} boxSize="100%" objectFit="contain" />
      </Box>
    );
  }

  const info = getPaytoTypeInfo(type);
  const Icon = iconMap[type];

  if (Icon) {
    return <Icon boxSize={boxSize} />;
  }

  const symbol = symbolMap[type] || info?.symbol;
  if (symbol) {
    const size = typeof boxSize === "number" ? `${boxSize * 4}px` : boxSize;
    return (
      <Text as="span" fontSize={size} lineHeight="1" role="img" aria-label={info?.label || type}>
        {symbol}
      </Text>
    );
  }

  return <CurrencyDollarIcon boxSize={boxSize} />;
}
