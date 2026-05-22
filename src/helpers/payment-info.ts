import type { Event } from "nostr-tools";
import { getCanonicalPaytoType, getPaytoEditorTypeLabel, type PaymentTarget } from "./payto-types";

export interface PaymentInfoMethod {
  type: string;
  authority: string;
  address?: string;
  payto?: string;
  displayType?: string;
  currency?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface PaymentInfo {
  methods?: PaymentInfoMethod[];
  payto?: string;
  type?: string;
  authority?: string;
}

export function getPaymentInfoFromEvent(event: Event): PaymentInfo | null {
  if (event.kind !== 10133) return null;

  let content: Record<string, unknown> = {};
  try {
    content = JSON.parse(event.content) as Record<string, unknown>;
  } catch {
    // invalid JSON
  }

  const paytoTags = event.tags.filter((t) => t[0] === "payto" && t[1] && t[2]);
  const methods: PaymentInfoMethod[] = [];

  if (paytoTags.length > 0) {
    for (const tag of paytoTags) {
      const type = getCanonicalPaytoType(tag[1]?.toLowerCase() || "lightning");
      const authority = tag[2] || "";
      const extra = tag.slice(3);
      methods.push({
        type,
        authority,
        payto: `payto://${type}/${authority}`,
        displayType: getPaytoEditorTypeLabel(type),
        ...(extra.length > 0 ? { extra } : {}),
      });
    }
  } else if (content.methods && Array.isArray(content.methods)) {
    for (const m of content.methods as Record<string, unknown>[]) {
      const type = getCanonicalPaytoType(((m.type as string) || "lightning").toLowerCase());
      const authority = (m.authority as string) || (m.address as string) || "";
      if (!authority) continue;
      methods.push({
        type,
        authority,
        payto: (m.payto as string) || `payto://${type}/${authority}`,
        displayType: (m.displayType as string) || getPaytoEditorTypeLabel(type),
        currency: m.currency as string | undefined,
        minAmount: m.minAmount as number | undefined,
        maxAmount: m.maxAmount as number | undefined,
      });
    }
  } else if (content.payto && typeof content.payto === "string") {
    const type = getCanonicalPaytoType(((content.type as string) || "lightning").toLowerCase());
    const payto = content.payto as string;
    const authority = (content.authority as string) || payto.replace(/^payto:\/\/[^/]+\//, "") || "";
    methods.push({
      type,
      authority,
      payto,
      displayType: getPaytoEditorTypeLabel(type),
    });
  }

  return methods.length > 0 ? { ...content, methods } : null;
}

export function extractPaymentTargetsFromEvent(event: Event | undefined): PaymentTarget[] {
  if (!event) return [];
  const info = getPaymentInfoFromEvent(event);
  if (!info?.methods?.length) return [];

  const seen = new Set<string>();
  const targets: PaymentTarget[] = [];

  for (const m of info.methods) {
    const authority = m.authority?.trim();
    if (!authority) continue;
    const canonical = getCanonicalPaytoType(m.type);
    const key = `${canonical}:${authority.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    targets.push({
      type: canonical,
      authority: canonical,
      address: authority,
      paytoUri: m.payto || `payto://${canonical}/${authority}`,
    });
  }

  return targets;
}
