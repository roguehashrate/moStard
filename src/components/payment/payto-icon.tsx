import { type IconProps, Text } from "@chakra-ui/react";
import MoneroWhite from "../icons/monero-white";
import CurrencyBitcoinIcon from "../icons/currency-bitcoin";
import CurrencyEthereumIcon from "../icons/currency-ethereum";
import CurrencyDollarIcon from "../icons/currency-dollar";
import { getPaytoTypeInfo } from "../../helpers/payto-types";

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
  paypal: "💙",
  venmo: "V",
  cashapp: "$",
  "ko-fi": "☕",
  patreon: "🎭",
  buymeacoffee: "☕",
};

export default function PaytoIcon({
  type,
  ...props
}: IconProps & { type: string }) {
  const info = getPaytoTypeInfo(type);
  const Icon = iconMap[type];

  if (Icon) {
    return <Icon {...props} />;
  }

  const symbol = symbolMap[type] || info?.symbol;
  if (symbol) {
    const boxSize = props.boxSize;
    const size = typeof boxSize === "number" ? boxSize : typeof boxSize === "string" ? parseInt(boxSize) : 4;
    return (
      <Text as="span" fontSize={`${size * 4}px`} lineHeight="1" role="img" aria-label={info?.label || type}>
        {symbol}
      </Text>
    );
  }

  return <CurrencyDollarIcon {...props} />;
}
