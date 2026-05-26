import { getCanonicalPaytoType } from "./payto-types";

import moneroLogo from "../payto_logos/Monero.png";
import bitcoinLogo from "../payto_logos/Bitcoin.svg";
import ethereumLogo from "../payto_logos/ethereum-eth-logo.svg";
import litecoinLogo from "../payto_logos/Litecoin.png";
import dogecoinLogo from "../payto_logos/dogecoin-doge-logo.svg";
import bitcoinCashLogo from "../payto_logos/bitcoin-cash-bch-logo.svg";
import solanaLogo from "../payto_logos/solana.png";
import paypalLogo from "../payto_logos/paypal.webp";
import venmoLogo from "../payto_logos/venmo.png";
import cashappLogo from "../payto_logos/cashapp.webp";
import kofiLogo from "../payto_logos/ko-fi.png";
import patreonLogo from "../payto_logos/patreon.png";
import buymeacoffeeLogo from "../payto_logos/buymeacoffee.png";

const LOGO_MAP: Record<string, string> = {
  monero: moneroLogo,
  bitcoin: bitcoinLogo,
  ethereum: ethereumLogo,
  litecoin: litecoinLogo,
  dogecoin: dogecoinLogo,
  "bitcoin-cash": bitcoinCashLogo,
  solana: solanaLogo,
  paypal: paypalLogo,
  venmo: venmoLogo,
  cashapp: cashappLogo,
  "ko-fi": kofiLogo,
  patreon: patreonLogo,
  buymeacoffee: buymeacoffeeLogo,
};

export function getPaytoLogoUrl(type: string): string | null {
  const canonical = getCanonicalPaytoType(type);
  return LOGO_MAP[canonical] ?? null;
}
