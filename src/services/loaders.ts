import {
  createAddressLoader,
  createEventLoader,
  createReactionsLoader,
  createSocialGraphLoader,
  createTagValueLoader,
  createUserListsLoader,
} from "applesauce-loaders/loaders";
import { getReplaceableAddress, getSeenRelays, isReplaceable, mergeRelaySets } from "applesauce-core/helpers";
import { merge } from "rxjs";
import { kinds, type NostrEvent } from "nostr-tools";
import { cacheRequest } from "./event-cache";
import { eventStore } from "./event-store";
import localSettings from "./preferences";
import pool from "./pool";

/** Loader for replaceable events based on coordinate */
export const addressLoader = createAddressLoader(pool, {
  cacheRequest,
  eventStore,
  bufferTime: 500,
  extraRelays: localSettings.readRelays,
});

/** Loader for replaceable events based on coordinate */
export const profileLoader = createAddressLoader(pool, {
  cacheRequest,
  eventStore,
  bufferTime: 200,
  extraRelays: localSettings.readRelays,
  lookupRelays: localSettings.lookupRelays,
});

/** Loader for single events based on id */
export const eventLoader = createEventLoader(pool, {
  cacheRequest,
  eventStore,
  bufferTime: 500,
  extraRelays: localSettings.readRelays,
});

export const reactionsLoader = createReactionsLoader(pool, {
  cacheRequest,
  eventStore,
  extraRelays: localSettings.readRelays,
});

const reactionLoader30 = createTagValueLoader(pool, "e", {
  kinds: [30],
  cacheRequest,
  eventStore,
  extraRelays: localSettings.readRelays,
});
const addressableReactionLoader30 = createTagValueLoader(pool, "a", {
  kinds: [30],
  cacheRequest,
  eventStore,
  extraRelays: localSettings.readRelays,
});

/** Loads both kind 7 (NIP-25) and kind 30 (NIP-30) reactions */
export function customReactionsLoader(event: NostrEvent, relays?: string[]) {
  if (relays) relays = mergeRelaySets(relays, getSeenRelays(event));
  const r0 = reactionsLoader(event, relays);
  const r1 = isReplaceable(event.kind)
    ? addressableReactionLoader30({ value: getReplaceableAddress(event), relays })
    : reactionLoader30({ value: event.id, relays });
  return merge(r0, r1);
}

export const userSetsLoader = createUserListsLoader(pool, {
  cacheRequest,
  eventStore,
  extraRelays: localSettings.readRelays,
});

export const channelMetadataLoader = createTagValueLoader(pool, "e", {
  kinds: [kinds.ChannelMetadata],
  cacheRequest,
  extraRelays: localSettings.readRelays,
});

// A loader to load the group info from the relays
export const groupInfoLoader = createTagValueLoader(pool, "d", {
  kinds: [39000],
});

/** Loader for loading a users social graph */
export const socialGraphLoader = createSocialGraphLoader(profileLoader, {
  eventStore,
  extraRelays: localSettings.readRelays,
  hints: false,
});

if (import.meta.env.DEV) {
  // @ts-expect-error
  window.profileLoader = profileLoader;
  // @ts-expect-error
  window.addressLoader = addressLoader;
  // @ts-expect-error
  window.eventLoader = eventLoader;
  // @ts-expect-error
  window.reactionsLoader = reactionsLoader;
}
