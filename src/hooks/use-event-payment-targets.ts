import type { Event } from "nostr-tools";
import useUserPaymentTargets from "./use-user-payment-targets";
import { type PaymentTarget } from "../helpers/payto-types";

export default function useEventPaymentTargets(event: Event): PaymentTarget[] {
  return useUserPaymentTargets(event.pubkey);
}
