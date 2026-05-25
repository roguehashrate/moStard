import { useEventModel } from "applesauce-react/hooks";
import { ProfilePointer } from "nostr-tools/nip19";
import { DirectMessageRelays } from "../models/messages";

export default function useUserDmRelays(user?: string | ProfilePointer) {
  return useEventModel(DirectMessageRelays, user ? [user] : undefined);
}

export function useUserDmRelaysList(pubkey?: string) {
  return useUserDmRelays(pubkey);
}
