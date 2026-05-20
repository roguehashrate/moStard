import { useEventModel } from "applesauce-react/hooks";
import { ContactsQuery } from "../models";
import type { ProfilePointer } from "nostr-tools/nip19";

export default function useUserContacts(pubkey?: string | ProfilePointer) {
  return useEventModel(ContactsQuery, pubkey ? [pubkey] : undefined);
}
