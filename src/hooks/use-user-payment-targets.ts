import { useEffect, useMemo } from "react";
import { useEventStore, useObservableMemo } from "applesauce-react/hooks";
import { kinds } from "nostr-tools";
import type { Event } from "nostr-tools";
import { map } from "rxjs/operators";
import useAppSettings from "./use-user-app-settings";
import { profileLoader, paymentInfoLoader, PAYMENT_INFO_KIND } from "../services/loaders";
import { extractPaymentTargetsFromEvent } from "../helpers/payment-info";
import {
  getCanonicalPaytoType,
  getPaytoEditorTypeLabel,
  isKnownPaytoType,
  mapExternalKeyToPaytoType,
  readStringAddress,
  escapeRegExp,
  type PaymentTarget,
} from "../helpers/payto-types";

// ── Catalog ──

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
};

const ROOT_FIELDS: Record<string, string> = {
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
};

// ── About coin line parser ──

function buildAboutCoinLabelAlternation(): string {
  const labels = new Set<string>();
  for (const key of Object.keys(KIND0_CRYPTO_ADDRESSES)) {
    labels.add(key);
    labels.add(key.toUpperCase());
  }
  return [...labels]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join("|");
}

const ABOUT_COIN_LINE_REGEX = new RegExp(
  `(?:^|[\\n\\r])\\s*(${buildAboutCoinLabelAlternation()})\\s*:\\s*([^\\s\\n]+)`,
  "gi",
);

function mapCoinLabelToPaytoType(label: string): string | null {
  const k = label.trim().toLowerCase();
  if (!k) return null;
  const fromCrypto = KIND0_CRYPTO_ADDRESSES[k];
  if (fromCrypto) return getCanonicalPaytoType(fromCrypto);
  const canonical = getCanonicalPaytoType(k);
  return isKnownPaytoType(canonical) ? canonical : null;
}

function parseAboutCoinLines(about: string): PaymentTarget[] {
  const text = about?.trim();
  if (!text) return [];
  const seen = new Set<string>();
  const out: PaymentTarget[] = [];
  for (const match of text.matchAll(ABOUT_COIN_LINE_REGEX)) {
    const coinLabel = match[1] ?? "";
    const address = (match[2] ?? "").trim();
    if (!address) continue;
    const paytoType = mapCoinLabelToPaytoType(coinLabel);
    if (!paytoType) continue;
    const dedupe = `${paytoType}:${address.toLowerCase()}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    out.push({ type: paytoType, authority: paytoType, address, paytoUri: `payto://${paytoType}/${address}` });
  }
  return out;
}

// ── Extract from a raw kind-0 event ──

function extractTargetsFromEvent(event: Event | undefined, enableAlternativePayments: boolean): PaymentTarget[] {
  const targets: PaymentTarget[] = [];
  const seen = new Set<string>();

  const add = (authority: string, address: string, label?: string) => {
    const canonical = getCanonicalPaytoType(authority);
    if (!canonical || !address.trim()) return;
    const key = `${canonical}:${address.trim().toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    targets.push({
      type: canonical,
      authority: canonical,
      address: address.trim(),
      paytoUri: `payto://${canonical}/${address.trim()}`,
      label,
    });
  };

  if (!event) return [];

  // Parse JSON content
  let profile: Record<string, unknown> = {};
  try {
    profile = JSON.parse(event.content) as Record<string, unknown>;
  } catch {
    // invalid JSON content
  }

  // 1. NIP-89 payto[] array in JSON content
  const paytoArr = profile.payto;
  if (Array.isArray(paytoArr)) {
    for (const entry of paytoArr) {
      if (typeof entry === "string") {
        const m = /^payto:\/\/([a-z0-9-]+)\/(.+)$/i.exec(entry.trim());
        if (m) add(m[1], m[2]);
      } else if (entry && typeof entry === "object") {
        const e = entry as Record<string, unknown>;
        if (typeof e.uri === "string") {
          const m = /^payto:\/\/([a-z0-9-]+)\/(.+)$/i.exec(e.uri.trim());
          if (m) add(m[1], m[2], typeof e.label === "string" ? e.label : undefined);
        }
      }
    }
  }

  // 2. cryptocurrency_addresses block (Garnet)
  const crypto = profile.cryptocurrency_addresses as Record<string, unknown> | undefined;
  if (crypto && typeof crypto === "object" && !Array.isArray(crypto)) {
    for (const [key, value] of Object.entries(crypto)) {
      const addr = readStringAddress(value);
      if (addr) {
        const paytoType = mapExternalKeyToPaytoType(key);
        if (paytoType) add(paytoType, addr);
      }
    }
  }

  // 3. Top-level root payment fields (legacy)
  for (const [key, paytoType] of Object.entries(ROOT_FIELDS)) {
    const addr = readStringAddress(profile[key]);
    if (addr) add(paytoType, addr);
  }

  // 4. About coin lines (XMR: addr style)
  const about = (profile.about as string | undefined) || "";
  for (const t of parseAboutCoinLines(about)) {
    add(t.type, t.address);
  }

  // 5. Event tags — NIP-89 ["payto", type, authority] / imwald-style [knownPaytoType, address]
  if (event.tags) {
    for (const tag of event.tags) {
      if (tag[0] === "payto" && tag[1] && tag[2]) {
        add(tag[1], tag[2]);
      } else if (tag[1] && tag[1].trim()) {
        const paytoType = mapExternalKeyToPaytoType(tag[0]);
        if (paytoType) add(paytoType, tag[1]);
      }
    }
  }

  if (enableAlternativePayments) return targets;
  return targets.filter((t) => t.type === "monero");
}

export default function useUserPaymentTargets(pubkey: string): PaymentTarget[] {
  const eventStore = useEventStore();
  const { enableAlternativePayments } = useAppSettings();

  // Trigger loading for both kind 0 and kind 10133 if not already in store
  useEffect(() => {
    if (!pubkey) return;
    const subs: import("rxjs").Subscription[] = [];
    if (!eventStore.hasReplaceable(kinds.Metadata, pubkey)) {
      subs.push(profileLoader({ kind: kinds.Metadata, pubkey }).subscribe({ error: () => {} }));
    }
    if (!eventStore.hasReplaceable(PAYMENT_INFO_KIND, pubkey)) {
      subs.push(paymentInfoLoader({ kind: PAYMENT_INFO_KIND, pubkey }).subscribe({ error: () => {} }));
    }
    return () => subs.forEach((s) => s.unsubscribe());
  }, [pubkey, eventStore]);

  const rawEvent = useObservableMemo(
    () => eventStore.replaceable(kinds.Metadata, pubkey).pipe(map((e) => e ?? undefined)),
    [pubkey, eventStore],
  );

  const paymentEvent = useObservableMemo(
    () => eventStore.replaceable(PAYMENT_INFO_KIND, pubkey).pipe(map((e) => e ?? undefined)),
    [pubkey, eventStore],
  );

  return useMemo(() => {
    // Merge: kind 10133 first, then kind 0 — first source wins for each type:address
    const kind10133 = extractPaymentTargetsFromEvent(paymentEvent);
    const kind0 = extractTargetsFromEvent(rawEvent, true); // no monero-only filter yet

    if (!kind10133.length && !kind0.length) return [];

    const seen = new Set<string>();
    const merged: PaymentTarget[] = [];
    const push = (t: PaymentTarget) => {
      const key = `${t.type}:${t.address.toLowerCase()}`;
      if (seen.has(key)) return;
      seen.add(key);
      merged.push(t);
    };
    for (const t of kind10133) push(t);
    for (const t of kind0) push(t);

    if (enableAlternativePayments) {
      // stable sort — monero first so it's the default selection
      const moneroTargets = merged.filter((t) => t.type === "monero");
      const otherTargets = merged.filter((t) => t.type !== "monero");
      return [...moneroTargets, ...otherTargets];
    }
    return merged.filter((t) => t.type === "monero");
  }, [rawEvent, paymentEvent, enableAlternativePayments]);
}
