import { Alert, AlertIcon, Flex, Heading, Link, Text } from "@chakra-ui/react";
import { AddDMRelay, NewDMRelays, RemoveDMRelay } from "applesauce-actions/actions/dm-relays";
import { useActionHub, useActiveAccount } from "applesauce-react/hooks";
import { kinds } from "nostr-tools";

import DebugEventButton from "../../../components/debug-modal/debug-event-button";
import SimpleView from "../../../components/layout/presets/simple-view";
import RequireActiveAccount from "../../../components/router/require-active-account";
import useAsyncAction from "../../../hooks/use-async-action";
import useReplaceableEvent from "../../../hooks/use-replaceable-event";
import useUserDmRelays from "../../../hooks/use-user-dm-relays";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import AddRelayForm from "../relays/add-relay-form";
import RelayControl from "../relays/relay-control";

function DmRelayItem({ url }: { url: string }) {
  const publish = usePublishEvent();
  const actions = useActionHub();

  const remove = useAsyncAction(async () => {
    await actions.exec(RemoveDMRelay, url).forEach((e) => publish("Remove DM relay", e));
  });

  return <RelayControl url={url} onRemove={remove.run} />;
}

function DmRelaysPage() {
  const account = useActiveAccount()!;
  const publish = usePublishEvent();
  const actions = useActionHub();
  const dmRelays = useUserDmRelays(account.pubkey);
  const event = useReplaceableEvent({
    kind: kinds.DirectMessageRelaysList,
    pubkey: account.pubkey,
  });

  const addRelay = useAsyncAction(async (relay: string) => {
    if (event) {
      await actions.exec(AddDMRelay, relay).forEach((e) => publish("Add DM relay", e));
    } else {
      await actions.exec(NewDMRelays, [relay]).forEach((e) => publish("Create DM relays", e));
    }
  });

  return (
    <SimpleView title="DM Relays" actions={event && <DebugEventButton event={event} size="sm" ml="auto" />} maxW="4xl">
      <Text fontStyle="italic" mt="-2">
        DM relays are used to send and receive direct messages. They are defined in{" "}
        <Link
          color="blue.500"
          isExternal
          href={`https://github.com/nostr-protocol/nips/blob/master/17.md`}
          textDecoration="underline"
        >
          NIP-17
        </Link>{" "}
        (kind 10050) and take priority over NIP-65 inbox relays for DMs.
      </Text>

      <Flex gap="2" mt="4">
        <Heading size="md">DM relays</Heading>
      </Flex>
      <Text fontStyle="italic" mt="-2">
        These relays are used to send and receive your direct messages
      </Text>
      {(dmRelays?.length ?? 0) > 4 && (
        <Alert status="warning" variant="subtle" mt="2">
          <AlertIcon />
          Having too many DM relays may cause delivery issues
        </Alert>
      )}
      {(dmRelays?.length ?? 0) === 0 && event && (
        <Alert status="info" variant="subtle" mt="2">
          <AlertIcon />
          No DM relays set — will fall back to NIP-65 inbox relays for DM delivery
        </Alert>
      )}
      {Array.from(dmRelays ?? [])
        .sort()
        .map((url) => (
          <DmRelayItem key={url} url={url} />
        ))}
      <AddRelayForm onSubmit={addRelay.run} />
    </SimpleView>
  );
}

export default function DmRelaysView() {
  return (
    <RequireActiveAccount>
      <DmRelaysPage />
    </RequireActiveAccount>
  );
}
