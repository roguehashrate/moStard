import { IAccount } from "applesauce-accounts";
import { isFromCache } from "applesauce-core/helpers";
import { defined } from "applesauce-core/observable";
import { USER_BLOSSOM_SERVER_LIST_KIND } from "blossom-client-sdk";
import { kinds, nip42 } from "nostr-tools";
import {
  combineLatest,
  distinct,
  distinctUntilChanged,
  EMPTY,
  filter,
  map,
  merge,
  NEVER,
  of,
  switchMap,
  tap,
} from "rxjs";

import { APP_SETTING_IDENTIFIER, APP_SETTINGS_KIND } from "../helpers/app-settings";
import { AppSettingsQuery, MailboxesQuery } from "../models";
import accounts from "./accounts";
import authenticationSigner from "./authentication-signer";
import { writeEvent } from "./event-cache";
import { eventStore } from "./event-store";
import { addressLoader } from "./loaders";
import { nwcManager } from "./nwc-manager";
import pool from "./pool";
import localSettings from "./preferences";

// watch for new events and send them to the cache relay
eventStore.insert$.pipe(filter((event) => !isFromCache(event))).subscribe(writeEvent);

const addressable = (account: IAccount, relays: Iterable<string>, kind: number, d?: string) => {
  return addressLoader({ relays: [...relays], kind, pubkey: account.pubkey, identifier: d, cache: false });
};

// listen for account changes and load users events
combineLatest([
  accounts.active$.pipe(
    defined(),
    distinct((a) => a?.pubkey),
  ),
  localSettings.readRelays,
])
  .pipe(
    switchMap(([account, relays]) =>
      combineLatest([of(account), eventStore.model(MailboxesQuery, { pubkey: account.pubkey, relays })] as const),
    ),
    switchMap(([account, mailboxes]) => {
      if (!mailboxes?.outboxes) return NEVER;

      const info = merge(
        // Load user information
        addressable(account, mailboxes?.outboxes, kinds.Metadata),
        addressable(account, mailboxes?.outboxes, kinds.Contacts),
        addressable(account, mailboxes?.outboxes, USER_BLOSSOM_SERVER_LIST_KIND),
        addressable(account, mailboxes?.outboxes, kinds.SearchRelaysList),
        addressable(account, mailboxes?.outboxes, APP_SETTINGS_KIND, APP_SETTING_IDENTIFIER),
      );

      // load latest delete events
      const deletes = pool.request(mailboxes.outboxes, {
        kinds: [kinds.EventDeletion],
        authors: [account.pubkey],
      });

      return merge(info, deletes);
    }),
  )
  .subscribe();

// Attempt to authenticate with all relays
pool.relays$
  .pipe(
    switchMap((relays) =>
      merge(
        ...Array.from(relays.values()).map((relay) =>
          relay.challenge$.pipe(
            defined(),
            // Wait for a challenge to change
            distinctUntilChanged(),
            // Create auth draft
            map((c) => nip42.makeAuthEvent(relay.url, c)),
            // sign draft
            switchMap((draft) => authenticationSigner.signEvent(draft)),
            // send auth event
            switchMap((event) => relay.auth(event)),
          ),
        ),
      ),
    ),
  )
  .subscribe();

// Update authentication signer when relays status change
pool.relays$
  .pipe(
    switchMap((relays) =>
      merge(
        ...Array.from(relays.values()).map((relay) =>
          relay.connected$.pipe(
            // Update signer when relay connection state changes
            tap((connected) => authenticationSigner.handleRelayConnectionState(relay.url, connected)),
          ),
        ),
      ),
    ),
  )
  .subscribe();

// DM subscriptions are disabled
export const wrappedMessageSubscription = NEVER;
export const legacyMessageSubscription = NEVER;

// Auto-connect NWC wallet when app settings are loaded
accounts.active$
  .pipe(
    switchMap((account) =>
      account
        ? eventStore.model(AppSettingsQuery, account.pubkey).pipe(
            map((settings) => settings.nwcConnectionString),
            distinctUntilChanged(),
          )
        : EMPTY,
    ),
  )
  .subscribe((nwcConnectionString) => {
    if (nwcConnectionString && nwcManager.status === "disconnected") {
      nwcManager.connect(nwcConnectionString);
    }
  });
