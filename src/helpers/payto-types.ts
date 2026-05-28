export type PaytoCategory = "crypto" | "fiat" | "service" | "bitcoin-layer" | "stablecoin" | "tip";

export interface PaytoType {
  label: string;
  symbol: string;
  category: PaytoCategory;
  uriScheme: string;
  coingeckoId?: string;
  walletOpen?: {
    scheme: string;
    walletApps: string[];
  };
}

export interface PaymentTarget {
  type: string;
  authority: string;
  address: string;
  paytoUri: string;
  label?: string;
}

interface WalletApp {
  label: string;
  uriTemplate: string;
}

const WALLET_APPS: Record<string, WalletApp> = {
  cakewallet: { label: "Cake Wallet", uriTemplate: "cakewallet:{coinScheme}?address={authority}" },
  ledger: { label: "Ledger Live", uriTemplate: "ledgerlive://send?currency={coinScheme}&recipient={authority}" },
};

export const PAYTO_TYPES: Record<string, PaytoType> = {
  monero: {
    label: "Monero",
    symbol: "XMR",
    category: "crypto",
    uriScheme: "monero:",
    coingeckoId: "monero",
    walletOpen: { scheme: "monero", walletApps: ["cakewallet", "ledger"] },
  },
  bitcoin: {
    label: "Bitcoin",
    symbol: "BTC",
    category: "crypto",
    uriScheme: "bitcoin:",
    coingeckoId: "bitcoin",
    walletOpen: { scheme: "bitcoin", walletApps: ["cakewallet", "ledger"] },
  },
  lightning: {
    label: "Lightning",
    symbol: "⚡",
    category: "bitcoin-layer",
    uriScheme: "lightning:",
    coingeckoId: "bitcoin",
  },
  nano: { label: "Nano", symbol: "XNO", category: "crypto", uriScheme: "nano:", coingeckoId: "nano" },
  ethereum: {
    label: "Ethereum",
    symbol: "ETH",
    category: "crypto",
    uriScheme: "ethereum:",
    coingeckoId: "ethereum",
    walletOpen: { scheme: "ethereum", walletApps: ["cakewallet", "ledger"] },
  },
  litecoin: {
    label: "Litecoin",
    symbol: "LTC",
    category: "crypto",
    uriScheme: "litecoin:",
    coingeckoId: "litecoin",
    walletOpen: { scheme: "litecoin", walletApps: ["cakewallet", "ledger"] },
  },
  dogecoin: {
    label: "Dogecoin",
    symbol: "DOGE",
    category: "crypto",
    uriScheme: "dogecoin:",
    coingeckoId: "dogecoin",
    walletOpen: { scheme: "dogecoin", walletApps: ["cakewallet", "ledger"] },
  },
  "bitcoin-cash": {
    label: "Bitcoin Cash",
    symbol: "BCH",
    category: "crypto",
    uriScheme: "bitcoincash:",
    coingeckoId: "bitcoin-cash",
    walletOpen: { scheme: "bitcoincash", walletApps: ["cakewallet", "ledger"] },
  },
  solana: {
    label: "Solana",
    symbol: "SOL",
    category: "crypto",
    uriScheme: "solana:",
    coingeckoId: "solana",
    walletOpen: { scheme: "solana", walletApps: ["cakewallet", "ledger"] },
  },
  zcash: {
    label: "Zcash",
    symbol: "ZEC",
    category: "crypto",
    uriScheme: "zcash:",
    coingeckoId: "zcash",
    walletOpen: { scheme: "zcash", walletApps: ["cakewallet", "ledger"] },
  },
  paypal: { label: "PayPal", symbol: "PayPal", category: "fiat", uriScheme: "paypal:" },
  venmo: { label: "Venmo", symbol: "Venmo", category: "fiat", uriScheme: "venmo:" },
  cashapp: { label: "Cash App", symbol: "CashApp", category: "fiat", uriScheme: "cashapp:" },
  "ko-fi": { label: "Ko-fi", symbol: "Ko-fi", category: "service", uriScheme: "kofi:" },
  patreon: { label: "Patreon", symbol: "Patreon", category: "tip", uriScheme: "patreon:" },
  buymeacoffee: { label: "Buy Me a Coffee", symbol: "BMC", category: "tip", uriScheme: "buymeacoffee:" },
};

const ALIAS_MAP: Record<string, string> = {
  xmr: "monero",
  btc: "bitcoin",
  ln: "lightning",
  lnurl: "lightning",
  xno: "nano",
  eth: "ethereum",
  ltc: "litecoin",
  doge: "dogecoin",
  bch: "bitcoin-cash",
  sol: "solana",
  zec: "zcash",
  bip: "bitcoin",
  bip21: "bitcoin",
  bip47: "bitcoin",
  bip270: "bitcoin",
  sp: "bitcoin",
  silentpayment: "bitcoin",
  "silent-payment": "bitcoin",
};

// Maps external kind-0 cryptocurrency_addresses keys → canonical payto types
const KIND0_CRYPTO_ADDRESSES: Record<string, string> = {
  monero: "monero",
  xmr: "monero",
  bitcoin: "bitcoin",
  btc: "bitcoin",
  ethereum: "ethereum",
  eth: "ethereum",
  litecoin: "litecoin",
  ltc: "litecoin",
  dogecoin: "dogecoin",
  doge: "dogecoin",
  nano: "nano",
  xno: "nano",
  solana: "solana",
  sol: "solana",
  "bitcoin-cash": "bitcoin-cash",
  bch: "bitcoin-cash",
  bip: "bitcoin",
  bip21: "bitcoin",
  bip47: "bitcoin",
  bip270: "bitcoin",
  sp: "bitcoin",
  silentpayment: "bitcoin",
  "silent-payment": "bitcoin",
  lnurl: "lightning",
  zcash: "zcash",
  zec: "zcash",
};

// Maps top-level kind-0 JSON keys → canonical payto types
const KIND0_ROOT_FIELDS: Record<string, string> = {
  monero: "monero",
  bitcoin: "bitcoin",
  ethereum: "ethereum",
  litecoin: "litecoin",
  dogecoin: "dogecoin",
  nano: "nano",
  solana: "solana",
  bip: "bitcoin",
  bip21: "bitcoin",
  bip47: "bitcoin",
  bip270: "bitcoin",
  sp: "bitcoin",
  silentpayment: "bitcoin",
  "silent-payment": "bitcoin",
  lnurl: "lightning",
  lud06: "lightning",
  lud16: "lightning",
  zcash: "zcash",
};

export const PAYTO_URI_REGEX = /payto:\/\/([a-z0-9-]+)\/([^\s\]\)\<\"']+)/gi;

export function getCanonicalPaytoType(authority: string): string {
  const lower = authority.toLowerCase();
  if (ALIAS_MAP[lower]) return ALIAS_MAP[lower];
  if (lower.startsWith("bip")) return "bitcoin";
  if (lower.startsWith("lnurl")) return "lightning";
  return lower;
}

export function getPaytoTypeInfo(authority: string): PaytoType | undefined {
  const canonical = getCanonicalPaytoType(authority);
  return PAYTO_TYPES[canonical];
}

export function isKnownPaytoType(authority: string): boolean {
  return !!getPaytoTypeInfo(authority);
}

export function buildPaytoUri(authority: string, address: string, amount?: number): string {
  const info = getPaytoTypeInfo(authority);
  const scheme = info?.uriScheme || `${authority.toLowerCase()}:`;
  let uri = `${scheme}${address.replace(/\s/g, "")}`;
  if (amount && info?.coingeckoId) {
    uri += `?tx_amount=${amount}`;
  }
  return uri;
}

export function parsePaytoUri(uri: string): { authority: string; address: string; amount?: number } | null {
  const trimmed = uri.trim();
  const m = /^payto:\/\/([a-z0-9-]+)\/(.+)$/i.exec(trimmed);
  if (!m) return null;
  return { authority: m[1].toLowerCase(), address: decodeURIComponent(m[2]), amount: undefined };
}

export function getCoingeckoId(authority: string): string | undefined {
  const info = getPaytoTypeInfo(authority);
  return info?.coingeckoId;
}

export function getWalletApp(appId: string): WalletApp | undefined {
  return WALLET_APPS[appId];
}

export function resolveWalletDeepLink(paytoType: string, address: string, appId: string): string | null {
  const info = getPaytoTypeInfo(paytoType);
  if (!info?.walletOpen) return null;
  const app = WALLET_APPS[appId];
  if (!app) return null;
  const scheme = info.walletOpen.scheme;
  const href = app.uriTemplate.replace("{coinScheme}", scheme).replace("{authority}", encodeURIComponent(address));
  return href;
}

export function resolveNativeUri(paytoType: string, address: string): string | null {
  const info = getPaytoTypeInfo(paytoType);
  if (!info?.walletOpen) return null;
  return `${info.walletOpen.scheme}:${address}`;
}

export function getPaytoIconChar(type: string): string | null {
  const info = getPaytoTypeInfo(type);
  return info?.symbol ?? null;
}

export function getPaytoEditorTypeLabel(type: string): string {
  return getPaytoTypeInfo(type)?.label ?? getCanonicalPaytoType(type);
}

export function mapExternalKeyToPaytoType(externalKey: string): string | null {
  const k = externalKey.trim().toLowerCase();
  if (!k) return null;
  const fromCrypto = KIND0_CRYPTO_ADDRESSES[k];
  if (fromCrypto) return getCanonicalPaytoType(fromCrypto);
  const fromRoot = KIND0_ROOT_FIELDS[k];
  if (fromRoot) return getCanonicalPaytoType(fromRoot);
  const canonical = getCanonicalPaytoType(k);
  return isKnownPaytoType(canonical) ? canonical : null;
}

export function readStringAddress(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  return s.length > 0 ? s : null;
}

export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
