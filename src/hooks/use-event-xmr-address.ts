import type { Event } from "nostr-tools";
import { getXMR } from "../helpers/monero";
import useUserXMRMetadata from "./use-user-xmr-metadata";

export default function useEventXMRAddress(event: Event) {
  const { address: userAddress } = useUserXMRMetadata(event.pubkey);
  const contentAddress = getXMR(event.content);
  const address = userAddress || contentAddress;
  const isUserTip = address === userAddress;

  return { address, isUserTip };
}
